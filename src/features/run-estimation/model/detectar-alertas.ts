import type { CoeficientesModelo } from '@/entities/estimation-model'

import type {
  Alcance,
  Alerta,
  BandaRiesgo,
  ContrasteCocomo,
  EsfuerzoDesarrollo,
  PlanEquipo,
} from './types'

/**
 * COCOMO II como contraste top-down independiente (doc §8.1).
 *   TDEV = 3.67 x MH^0.32
 * Sirve para triangular: si el bottom-up se aleja mucho, algo no cuadra.
 */
export function contrastarConCocomo(
  mesesHombre: number,
  duracionPropuesta: number,
): ContrasteCocomo {
  if (mesesHombre <= 0) {
    return {
      mesesNominales: 0,
      personasNominales: 0,
      desviacionDuracion: 0,
      dentroDeRango: true,
    }
  }
  const mesesNominales = 3.67 * Math.pow(mesesHombre, 0.32)
  const personasNominales = mesesHombre / mesesNominales
  const desviacionDuracion = duracionPropuesta / mesesNominales - 1

  return {
    mesesNominales,
    personasNominales,
    desviacionDuracion,
    // La "zona imposible" de COCOMO: por debajo del 75% del nominal nadie lo ha logrado.
    dentroDeRango: duracionPropuesta >= mesesNominales * 0.75,
  }
}

interface EntradaAlertas {
  alcance: Alcance
  esfuerzo: EsfuerzoDesarrollo
  riesgo: BandaRiesgo
  equipo: PlanEquipo
  contraste: ContrasteCocomo
  coeficientes: CoeficientesModelo
}

/**
 * Detectores de estimacion enferma (doc §8.4).
 * No bloquean: avisan antes de que la estimacion salga por la puerta.
 */
export function detectarAlertas(entrada: EntradaAlertas): Alerta[] {
  const { alcance, esfuerzo, riesgo, equipo, contraste, coeficientes } = entrada
  const alertas: Alerta[] = []

  if (esfuerzo.devBrutoHoras <= 0) {
    alertas.push({
      clave: 'alcance-vacio',
      nivel: 'critico',
      mensaje: 'El alcance no produce esfuerzo: faltan features o componentes.',
    })
    return alertas
  }

  // --- peso de las integraciones ------------------------------------------
  const horasIntegracion = esfuerzo.items
    .filter((i) => i.categoria === 'integracion')
    .reduce((t, i) => t + i.horasModal, 0)
  const pesoIntegracion = horasIntegracion / esfuerzo.devBrutoHoras
  if (pesoIntegracion > 0.4) {
    alertas.push({
      clave: 'integraciones-dominantes',
      nivel: 'aviso',
      mensaje: `Las integraciones son el ${(pesoIntegracion * 100).toFixed(0)} % del esfuerzo: esto es un proyecto de integración, no de desarrollo. Revisa el enfoque y quién coordina a las contrapartes.`,
    })
  }

  // --- QA insuficiente -----------------------------------------------------
  if (coeficientes.overhead.qa < 0.15) {
    alertas.push({
      clave: 'qa-insuficiente',
      nivel: 'aviso',
      mensaje: `QA está en el ${(coeficientes.overhead.qa * 100).toFixed(0)} % del desarrollo. Por debajo del 15 % la estimación suele estar incompleta.`,
    })
  }

  // --- banda demasiado estrecha -------------------------------------------
  const anchoBanda = riesgo.devP50Horas > 0 ? riesgo.devP90Horas / riesgo.devP50Horas : 1
  if (anchoBanda < 1.15) {
    alertas.push({
      clave: 'banda-estrecha',
      nivel: 'aviso',
      mensaje: `La banda P90/P50 es ${anchoBanda.toFixed(2)}. Falta riesgo común: la incertidumbre está subestimada.`,
    })
  }

  // --- zona imposible de COCOMO -------------------------------------------
  if (!contraste.dentroDeRango) {
    alertas.push({
      clave: 'zona-imposible',
      nivel: 'critico',
      mensaje: `La duración propuesta (${equipo.recomendado.duracionMeses.toFixed(1)} m) está por debajo del 75 % de la nominal COCOMO (${contraste.mesesNominales.toFixed(1)} m). Ningún equipo lo ha logrado.`,
    })
  }

  // --- streams topados: acelerar ya no es posible --------------------------
  const topados = equipo.recomendado.dotacion.filter((d) => {
    const stream = equipo.streams.find((s) => s.componenteId === d.componenteId)
    return stream && d.devs >= stream.capDevs && d.meses >= equipo.rutaCriticaMeses * 0.99
  })
  for (const topado of topados) {
    alertas.push({
      clave: `stream-topado:${topado.componenteId}`,
      nivel: 'info',
      mensaje: `«${topado.nombre}» está en su máximo de devs útiles y marca la ruta crítica. Meter más gente ahí no acelera nada: hay que partir el componente o recortar alcance.`,
    })
  }

  // --- features muy complejas sin integraciones ----------------------------
  const componentesConIntegracion = new Set(
    alcance.integraciones.map((i) => i.componenteDuenioId),
  )
  for (const feature of alcance.features) {
    if (feature.complejidad !== 'ma') continue
    const tocaIntegracion = feature.toca.some((t) =>
      componentesConIntegracion.has(t.componenteId),
    )
    if (!tocaIntegracion) {
      alertas.push({
        clave: `complejidad-sospechosa:${feature.id}`,
        nivel: 'info',
        mensaje: `«${feature.nombre}» es de complejidad muy alta pero no toca ninguna integración. Verifica que esté bien clasificada.`,
      })
    }
  }

  // --- los dos metodos de medida no se parecen -----------------------------
  // No es un error: es la triangulacion del doc §8.1 aplicada feature a feature.
  const porPuntos = esfuerzo.medidas.filter((m) => m.metodo === 'puntos-funcion')
  for (const medida of porPuntos) {
    if (Math.abs(medida.divergencia) < 0.8) continue
    alertas.push({
      clave: `divergencia-medida:${medida.featureId}`,
      nivel: 'aviso',
      mensaje: `«${medida.nombre}»: por puntos función son ${medida.horasPorPuntos.toFixed(0)} h y por componentes ${medida.horasEstructural.toFixed(0)} h (${(medida.divergencia * 100).toFixed(0)} %). O sobran elementos marcados, o la complejidad está mal puesta.`,
    })
  }

  const sinClasificar = alcance.features.length - porPuntos.length
  if (porPuntos.length > 0 && sinClasificar > 0) {
    alertas.push({
      clave: 'medida-mixta',
      nivel: 'info',
      mensaje: `${porPuntos.length} de ${alcance.features.length} features se miden por puntos función; el resto cae al método estructural, que es más grueso. Marca sus elementos para afinar.`,
    })
  }

  // --- equilibrio front / back ---------------------------------------------
  const horasFront = alcance.componentes
    .filter((c) => c.tipo === 'front-angular')
    .reduce((t, c) => t + (esfuerzo.horasPorComponente[c.id] ?? 0), 0)
  const horasBack = esfuerzo.devBrutoHoras - horasFront
  if (horasFront > 0 && horasBack > 0) {
    const ratio = horasFront / horasBack
    if (ratio < 0.15 || ratio > 1.5) {
      alertas.push({
        clave: 'desequilibrio-front-back',
        nivel: 'info',
        mensaje: `La relación front/back es ${ratio.toFixed(2)}, fuera del rango habitual 0.15–1.5. Puede faltar un componente en el alcance.`,
      })
    }
  }

  // --- coste de acelerar ---------------------------------------------------
  const { recomendado, masRapido } = equipo
  if (masRapido.personas > recomendado.personas) {
    const sobrecoste =
      recomendado.mesesHombreFacturables > 0
        ? masRapido.mesesHombreFacturables / recomendado.mesesHombreFacturables - 1
        : 0
    const ahorroMeses = recomendado.duracionMeses - masRapido.duracionMeses
    alertas.push({
      clave: 'coste-de-acelerar',
      nivel: 'info',
      mensaje: `Acelerar de ${recomendado.personas} a ${masRapido.personas} personas cuesta ${(sobrecoste * 100).toFixed(0)} % más de esfuerzo para ganar ${ahorroMeses.toFixed(1)} meses.`,
    })
  }

  // --- rendimientos negativos ----------------------------------------------
  const masGenteMasLento = equipo.frontera.some(
    (p) => p.personas > masRapido.personas && p.duracionMeses > masRapido.duracionMeses,
  )
  if (masGenteMasLento) {
    alertas.push({
      clave: 'rendimientos-negativos',
      nivel: 'aviso',
      mensaje: `Por encima de ${masRapido.personas} personas el proyecto se vuelve más lento Y más caro. Ese tramo de la curva no es una opción.`,
    })
  }

  return alertas
}
