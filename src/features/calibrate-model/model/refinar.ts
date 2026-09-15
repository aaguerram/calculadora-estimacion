import type { CoeficientesModelo } from '@/entities/estimation-model'
import { mediaGeometrica, sigmaLogaritmica } from '@/entities/historical-project'
import type { ErrorPorProyecto, PropuestaCalibracion } from '@/entities/historical-project'

import { construirCambios, simularCambios } from './aplicar-propuesta'
import type { CambioCoeficiente } from './aplicar-propuesta'

export const TOLERANCIA_SESGO = 0.01
export const RONDAS_MAXIMAS = 4

/**
 * Refina la propuesta hasta que el sesgo residual desaparece.
 *
 * Los ajustes INTERACTUAN: subir las horas base sube el esfuerzo, pero bajar el
 * sigma del riesgo comun estrecha la distribucion y BAJA el percentil que se
 * compromete. Aplicados a la vez, se cancelan en parte y queda un sesgo residual.
 *
 * La solucion es iterar: aplicar, rehacer el backtest, medir el ratio que queda
 * y plegarlo en la propuesta. Converge en dos o tres rondas.
 *
 * `rehacerBacktest` se inyecta porque el motor vive en otro slice de esta misma
 * capa; ademas hace la funcion testeable sin motor.
 */
export function refinarCambios(
  coeficientes: CoeficientesModelo,
  propuestaInicial: PropuestaCalibracion,
  rehacerBacktest: (coeficientes: CoeficientesModelo) => readonly ErrorPorProyecto[],
  /** Cuanto del historico se midio por puntos funcion (0..1). */
  fraccionPorPuntos = 0,
): { cambios: CambioCoeficiente[]; rondas: number; convergio: boolean } {
  let propuesta = propuestaInicial
  let cambios = construirCambios(coeficientes, propuesta, fraccionPorPuntos)

  for (let ronda = 1; ronda <= RONDAS_MAXIMAS; ronda++) {
    if (cambios.length === 0) return { cambios, rondas: ronda - 1, convergio: true }

    const errores = rehacerBacktest(simularCambios(coeficientes, cambios))
    if (errores.length === 0) return { cambios, rondas: ronda, convergio: false }

    const ratios = errores.map((e) => e.ratio)
    const residual = mediaGeometrica(ratios)

    if (Math.abs(residual - 1) <= TOLERANCIA_SESGO) {
      return { cambios, rondas: ronda, convergio: true }
    }

    propuesta = {
      ...propuesta,
      factorGlobal: propuesta.factorGlobal * residual,
      ajustes: propuesta.ajustes.map((a) => ({ ...a, factor: a.factor * residual })),
      // El sigma se vuelve a medir sobre los residuos ya corregidos de escala.
      sigmaComun: sigmaLogaritmica(ratios),
    }
    cambios = construirCambios(coeficientes, propuesta, fraccionPorPuntos)
  }

  return { cambios, rondas: RONDAS_MAXIMAS, convergio: false }
}
