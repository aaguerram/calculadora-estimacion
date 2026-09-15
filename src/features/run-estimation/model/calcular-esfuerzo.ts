import type { CoeficientesModelo } from '@/entities/estimation-model'
import { puntosDeElemento } from '@/entities/feature-catalog'
import type { Catalogo } from '@/entities/feature-catalog'

import type {
  Alcance,
  EsfuerzoDesarrollo,
  FeatureAlcance,
  ItemEstimado,
  MedidaDeFeature,
} from './types'

/** Reparto estructural de una feature: cuánto pesa en cada componente que toca. */
function pesoEstructural(
  feature: FeatureAlcance,
  alcance: Alcance,
  coeficientes: CoeficientesModelo,
): Array<{ componenteId: string; nombre: string; horas: number; nivel: string }> {
  const porId = new Map(alcance.componentes.map((c) => [c.id, c]))
  const partes: Array<{ componenteId: string; nombre: string; horas: number; nivel: string }> = []

  for (const toca of feature.toca) {
    const componente = porId.get(toca.componenteId)
    if (!componente) continue
    const nivel = toca.complejidad ?? feature.complejidad
    partes.push({
      componenteId: componente.id,
      nombre: componente.nombre,
      horas:
        coeficientes.base[componente.tipo] *
        coeficientes.complejidad[nivel] *
        coeficientes.stack[componente.stack],
      nivel,
    })
  }
  return partes
}

/** Puntos función sin ajustar de una feature, según los elementos marcados. */
export function puntosDeFeature(feature: FeatureAlcance, catalogo: Catalogo): number {
  return feature.elementos.reduce((total, sel) => {
    const definicion = catalogo.elementos.find((e) => e.clave === sel.elemento)
    return definicion
      ? total + sel.cantidad * puntosDeElemento(definicion, sel.complejidad)
      : total
  }, 0)
}

/**
 * Esfuerzo de desarrollo, item por item.
 *
 * Dos formas de medir la MISMA feature, nunca sumadas:
 *
 *   - ESTRUCTURAL: `base(tipo) x complejidad x stack` por cada componente que
 *     toca. Es una aproximación gruesa: dice dónde se trabaja, no qué se hace.
 *   - PUNTOS FUNCIÓN: los elementos marcados (eje 3) pesados con IFPUG, por las
 *     horas de desarrollo por punto. Mide lo que la feature CONTIENE.
 *
 * Cuando la feature tiene elementos marcados manda el método de puntos función,
 * y su esfuerzo se reparte entre los componentes en la proporción que da el
 * método estructural: así el motor conserva los streams y la ruta crítica.
 * Sumar los dos contaría el mismo trabajo dos veces.
 *
 * Funcion pura: mismas entradas, misma salida. Sin red, sin reloj, sin azar.
 */
export function calcularEsfuerzo(
  alcance: Alcance,
  coeficientes: CoeficientesModelo,
  catalogo?: Catalogo,
): EsfuerzoDesarrollo {
  const items: ItemEstimado[] = []
  const horasPorComponente: Record<string, number> = {}
  const horasPorTipo: EsfuerzoDesarrollo['horasPorTipo'] = {}
  const medidas: MedidaDeFeature[] = []

  const porId = new Map(alcance.componentes.map((c) => [c.id, c]))
  const acumular = (componenteId: string, horas: number) => {
    horasPorComponente[componenteId] = (horasPorComponente[componenteId] ?? 0) + horas
    const tipo = porId.get(componenteId)?.tipo
    if (tipo) horasPorTipo[tipo] = (horasPorTipo[tipo] ?? 0) + horas
  }

  // --- 1. Features: una medida por feature, repartida entre sus componentes --
  for (const feature of alcance.features) {
    const partes = pesoEstructural(feature, alcance, coeficientes)
    const horasEstructural = partes.reduce((t, p) => t + p.horas, 0)

    const puntos = catalogo ? puntosDeFeature(feature, catalogo) : 0
    const horasPorPuntos = puntos * coeficientes.puntosFuncion.horasDevPorPunto
    // Sin componentes no hay dónde repartir: el método de puntos no aplica.
    const usaPuntos = puntos > 0 && horasEstructural > 0
    const horasFeature = usaPuntos ? horasPorPuntos : horasEstructural

    medidas.push({
      featureId: feature.id,
      nombre: feature.nombre,
      metodo: usaPuntos ? 'puntos-funcion' : 'estructural',
      puntosFuncion: puntos,
      horasPorPuntos,
      horasEstructural,
      horasAplicadas: horasFeature,
      divergencia:
        usaPuntos && horasEstructural > 0 ? horasPorPuntos / horasEstructural - 1 : 0,
    })

    for (const parte of partes) {
      // El reparto conserva la proporción estructural: es lo que sostiene los streams.
      const proporcion = horasEstructural > 0 ? parte.horas / horasEstructural : 0
      const horas = horasFeature * proporcion
      if (horas <= 0) continue

      const rango = coeficientes.pert[feature.complejidad]
      acumular(parte.componenteId, horas)
      items.push({
        id: `${feature.id}::${parte.componenteId}`,
        concepto: `${feature.nombre} · ${parte.nombre}`,
        categoria: 'feature',
        componenteId: parte.componenteId,
        horasModal: horas,
        horasOptimista: horas * rango.optimista,
        horasPesimista: horas * rango.pesimista,
        factores: usaPuntos
          ? { puntosFuncion: puntos, horasPorPunto: coeficientes.puntosFuncion.horasDevPorPunto, proporcion }
          : {
              base: coeficientes.base[porId.get(parte.componenteId)!.tipo],
              complejidad: coeficientes.complejidad[parte.nivel as keyof typeof coeficientes.complejidad],
              stack: coeficientes.stack[porId.get(parte.componenteId)!.stack],
            },
      })
    }
  }

  // --- 2. Arranque de componentes nuevos (coste unico) --------------------
  for (const componente of alcance.componentes) {
    if (!componente.esNuevo) continue
    const horas = coeficientes.bootstrap[componente.tipo]
    if (horas <= 0) continue

    acumular(componente.id, horas)
    items.push({
      id: `bootstrap::${componente.id}`,
      concepto: `Arranque · ${componente.nombre}`,
      categoria: 'bootstrap',
      componenteId: componente.id,
      horasModal: horas,
      horasOptimista: horas * coeficientes.pertBootstrap.optimista,
      horasPesimista: horas * coeficientes.pertBootstrap.pesimista,
      factores: { base: horas },
    })
  }

  // --- 3. Integraciones, imputadas a su componente consumidor (doc §3) -----
  for (const integracion of alcance.integraciones) {
    const cfg = coeficientes.integracion
    const base = cfg.porComplejidad[integracion.complejidad]
    const recargoExterna = integracion.esExterna ? cfg.recargoExterna : 1
    const recargoSandbox = integracion.tieneSandbox ? 1 : cfg.recargoSinSandbox
    const recargoUsos = 1 + cfg.recargoUsoExtra * Math.max(0, integracion.usos - 1)
    const horas = base * recargoExterna * recargoSandbox * recargoUsos

    const destino = porId.has(integracion.componenteDuenioId)
      ? integracion.componenteDuenioId
      : (alcance.componentes[0]?.id ?? 'sin-componente')

    acumular(destino, horas)
    items.push({
      id: `integracion::${integracion.id}`,
      concepto: `Integración · ${integracion.nombre}`,
      categoria: 'integracion',
      componenteId: destino,
      horasModal: horas,
      horasOptimista: horas * coeficientes.pertIntegracion.optimista,
      horasPesimista: horas * coeficientes.pertIntegracion.pesimista,
      factores: {
        base,
        externa: recargoExterna,
        sandbox: recargoSandbox,
        usos: recargoUsos,
      },
    })
  }

  const devBrutoHoras = items.reduce((total, item) => total + item.horasModal, 0)
  const factorProyecto = calcularFactorProyecto(alcance)

  return {
    items,
    horasPorComponente,
    horasPorTipo,
    medidas,
    puntosFuncionTotales: medidas.reduce((t, m) => t + m.puntosFuncion, 0),
    featuresPorPuntos: medidas.filter((m) => m.metodo === 'puntos-funcion').length,
    devBrutoHoras,
    factorProyecto,
    devNominalHoras: devBrutoHoras * factorProyecto,
  }
}

/**
 * Drivers ADITIVOS: `1 + suma(delta)`.
 *
 * Multiplicarlos compone factores de 2x o mas con entradas perfectamente
 * normales y destruye la credibilidad de la estimacion (doc §4).
 */
export function calcularFactorProyecto(alcance: Alcance): number {
  const suma = alcance.drivers.reduce((total, driver) => total + driver.delta, 0)
  // Nunca menos de la mitad del nominal: ningun conjunto de drivers regala trabajo.
  return Math.max(0.5, 1 + suma)
}
