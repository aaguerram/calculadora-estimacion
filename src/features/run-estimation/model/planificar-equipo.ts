import type { CoeficientesModelo } from '@/entities/estimation-model'

import type {
  Alcance,
  DotacionStream,
  PlanEquipo,
  PuntoFrontera,
  Stream,
} from './types'

/**
 * Duracion de un stream con `devs` personas.
 * La sobrecarga crece con los canales de comunicacion: m(m-1)/2.
 */
export function duracionStream(mesesHombre: number, devs: number, gamma: number): number {
  if (devs <= 0) return Number.POSITIVE_INFINITY
  return (mesesHombre * (1 + (gamma * devs * (devs - 1)) / 2)) / devs
}

/**
 * Cuando dos puntos de la frontera cuestan practicamente lo mismo, el criterio
 * "minimo coste" es ruido: elige por centesimas. Entre los puntos dentro de esta
 * tolerancia del minimo se recomienda el MAS RAPIDO, que es la eleccion util.
 */
export const TOLERANCIA_COSTE = 0.05

export interface OpcionesPlan {
  coeficientes: CoeficientesModelo
  /** Meses-hombre de desarrollo por componente, al percentil comprometido. */
  mesesHombrePorComponente: Record<string, number>
  /** Meses-hombre de arranque serial (bootstrap de componentes nuevos). */
  mesesHombreArranque: number
}

/**
 * El limite real de paralelizacion NO es la comunicacion: son los componentes.
 *
 * Un modelo de sobrecarga pura n(n-1)/2 tiene su optimo en sqrt(2/gamma),
 * independiente del tamaño del proyecto, lo que implicaria que un proyecto de
 * 20 MH y uno de 500 MH quieren el mismo equipo. Es falso. El tope real es el
 * stream mas largo: si el micro core aguanta 3 devs, no hay forma de bajar de
 * su duracion metiendo gente en el front (doc §6).
 */
export function planificarEquipo(alcance: Alcance, opciones: OpcionesPlan): PlanEquipo {
  const { coeficientes, mesesHombrePorComponente, mesesHombreArranque } = opciones
  const { gamma, delta, onboarding, personasNucleoSerial, fraccionEstabilizacion } =
    coeficientes.equipo
  const { analisis, qa, devops, gestion } = coeficientes.overhead

  // --- streams ------------------------------------------------------------
  const streams: Stream[] = alcance.componentes.map((componente) => {
    const mesesHombre = mesesHombrePorComponente[componente.id] ?? 0
    const capDevs = Math.max(1, componente.capDevs ?? coeficientes.cap[componente.tipo])

    let devsParaMinimo = 1
    let duracionMinima = duracionStream(mesesHombre, 1, gamma)
    for (let m = 2; m <= capDevs; m++) {
      const t = duracionStream(mesesHombre, m, gamma)
      if (t < duracionMinima) {
        duracionMinima = t
        devsParaMinimo = m
      }
    }

    return {
      componenteId: componente.id,
      nombre: componente.nombre,
      mesesHombre,
      capDevs,
      devsParaMinimo,
      duracionMinima,
    }
  })

  const activos = streams.filter((s) => s.mesesHombre > 0)
  const rutaCriticaMeses = activos.length
    ? Math.max(...activos.map((s) => s.duracionMinima))
    : 0
  const arranqueSerialMeses = mesesHombreArranque / Math.max(1, personasNucleoSerial)

  // --- dotacion para un objetivo de duracion ------------------------------
  const redondearMedio = (v: number) => Math.max(0.5, Math.round(v * 2) / 2)

  function dotar(objetivoMeses: number): PuntoFrontera {
    // Punto fijo: mas gente -> mas coordinacion -> mas esfuerzo -> mas gente.
    // Es la ley de Brooks, emergiendo del modelo en vez de escrita a mano.
    let personas = 1
    let resultado = construir(objetivoMeses, 1)
    for (let iteracion = 0; iteracion < 30; iteracion++) {
      resultado = construir(objetivoMeses, personas)
      if (Math.abs(resultado.personas - personas) < 0.01) break
      personas = resultado.personas
    }
    return resultado
  }

  function construir(objetivoMeses: number, personasAsumidas: number): PuntoFrontera {
    const factorCoordinacion =
      1 + (delta * personasAsumidas * (personasAsumidas - 1)) / 2

    const dotacion: DotacionStream[] = []
    let duracionDesarrollo = 0
    let devs = 0
    let mesesHombreDev = 0

    for (const stream of activos) {
      const mh = stream.mesesHombre * factorCoordinacion
      let m = 1
      while (m < stream.capDevs && duracionStream(mh, m, gamma) > objetivoMeses) m++
      const meses = duracionStream(mh, m, gamma)

      dotacion.push({
        componenteId: stream.componenteId,
        nombre: stream.nombre,
        devs: m,
        meses,
      })
      duracionDesarrollo = Math.max(duracionDesarrollo, meses)
      devs += m
      mesesHombreDev += mh
    }

    const t = Math.max(duracionDesarrollo, 0.01)
    const rolQA = redondearMedio((mesesHombreDev * qa) / t)
    const rolDevops = redondearMedio((mesesHombreDev * devops) / t)
    const rolGestion = redondearMedio((mesesHombreDev * (gestion + analisis)) / t)
    const personas = devs + rolQA + rolDevops + rolGestion

    const estabilizacion = Math.max(0.5, fraccionEstabilizacion * duracionDesarrollo)
    const duracionMeses = arranqueSerialMeses + duracionDesarrollo + estabilizacion

    return {
      personas,
      devs,
      qa: rolQA,
      devops: rolDevops,
      gestion: rolGestion,
      duracionMeses,
      factorCoordinacion,
      // Facturable = equipo completo durante toda la ventana + onboarding.
      mesesHombreFacturables:
        personas * duracionMeses + onboarding * Math.max(0, personas - 1),
      dotacion,
    }
  }

  // --- frontera: barrido del objetivo de duracion -------------------------
  const frontera: PuntoFrontera[] = []
  const vistos = new Set<number>()
  if (rutaCriticaMeses > 0) {
    for (let t = rutaCriticaMeses; t <= rutaCriticaMeses * 4; t *= 1.08) {
      const punto = dotar(t)
      if (vistos.has(punto.personas)) continue
      vistos.add(punto.personas)
      frontera.push(punto)
    }
  }

  const vacio: PuntoFrontera = {
    personas: 0,
    devs: 0,
    qa: 0,
    devops: 0,
    gestion: 0,
    duracionMeses: 0,
    factorCoordinacion: 1,
    mesesHombreFacturables: 0,
    dotacion: [],
  }

  if (frontera.length === 0) {
    return {
      streams,
      rutaCriticaMeses,
      arranqueSerialMeses,
      frontera,
      recomendado: vacio,
      masRapido: vacio,
      equipoMinimo: vacio,
    }
  }

  frontera.sort((a, b) => a.personas - b.personas)
  const menor = <T,>(items: T[], valor: (x: T) => number) =>
    items.reduce((a, b) => (valor(b) < valor(a) ? b : a))

  const costeMinimo = menor(frontera, (p) => p.mesesHombreFacturables)
    .mesesHombreFacturables
  const casiTanBaratos = frontera.filter(
    (p) => p.mesesHombreFacturables <= costeMinimo * (1 + TOLERANCIA_COSTE),
  )

  return {
    streams,
    rutaCriticaMeses,
    arranqueSerialMeses,
    frontera,
    // Mismo coste, menos meses: no hay razon para elegir la opcion lenta.
    recomendado: menor(casiTanBaratos, (p) => p.duracionMeses),
    masRapido: menor(frontera, (p) => p.duracionMeses),
    equipoMinimo: menor(frontera, (p) => p.personas),
  }
}
