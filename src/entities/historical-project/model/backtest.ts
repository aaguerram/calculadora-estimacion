import type { ObservacionCalibracion } from './calibrar'
import { calcularErrores, calcularMetricas } from './metricas'
import type { ProyectoHistorico, ResultadoBacktest } from './types'

/** Lo que el backtest necesita del motor. Se INYECTA: la entity no lo importa. */
export interface SalidaEstimador {
  mesesHombre: number
  horasPorBucket: Record<string, number>
  /**
   * Fraccion de las features de ese proyecto medidas por puntos funcion (0..1).
   * Sin esto no se sabe si el historico ejercita el coeficiente de PF, y
   * calibrarlo seria mover un numero que el dato no respalda.
   */
  fraccionPorPuntos?: number
}

export type Estimador = (historico: ProyectoHistorico) => SalidaEstimador

export interface Backtest extends ResultadoBacktest {
  observaciones: ObservacionCalibracion[]
  /** Media de la fraccion medida por puntos funcion en los proyectos usables. */
  fraccionPorPuntos: number
}

/**
 * Re-estima cada proyecto cerrado con los coeficientes de HOY y lo compara con
 * lo que costo de verdad.
 *
 * El estimador llega por parametro para que esta funcion sea pura y testeable
 * sin el motor: en los tests se le pasa un estimador de mentira, y en la app el
 * de verdad. Tambien es lo que permite pedir el backtest con coeficientes
 * propuestos, no solo con los vigentes.
 */
export function ejecutarBacktest(
  historicos: readonly ProyectoHistorico[],
  estimar: Estimador,
): Backtest {
  const descartados: string[] = []
  const pares: Array<{ id: string; nombre: string; estimado: number; real: number }> = []
  const observaciones: ObservacionCalibracion[] = []
  const fracciones: number[] = []

  for (const historico of historicos) {
    if (!historico.alcance) {
      descartados.push(`${historico.nombre}: sin alcance guardado`)
      continue
    }
    if (!(historico.mhReales > 0)) {
      descartados.push(`${historico.nombre}: sin meses-hombre reales`)
      continue
    }

    const salida = estimar(historico)
    if (!Number.isFinite(salida.mesesHombre) || salida.mesesHombre <= 0) {
      descartados.push(`${historico.nombre}: el alcance guardado no produce esfuerzo`)
      continue
    }

    pares.push({
      id: historico.id,
      nombre: historico.nombre,
      estimado: salida.mesesHombre,
      real: historico.mhReales,
    })
    observaciones.push({
      id: historico.id,
      horasPorBucket: salida.horasPorBucket,
      ratio: historico.mhReales / salida.mesesHombre,
    })
    fracciones.push(salida.fraccionPorPuntos ?? 0)
  }

  const errores = calcularErrores(pares)
  const fraccionPorPuntos =
    fracciones.length > 0
      ? fracciones.reduce((a, b) => a + b, 0) / fracciones.length
      : 0

  return {
    metricas: calcularMetricas(errores),
    errores,
    descartados,
    observaciones,
    fraccionPorPuntos,
  }
}
