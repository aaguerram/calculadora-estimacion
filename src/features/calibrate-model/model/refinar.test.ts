import { COEFICIENTES_POR_DEFECTO } from '@/entities/estimation-model'
import type { CoeficientesModelo } from '@/entities/estimation-model'
import { calcularErrores } from '@/entities/historical-project'
import type { PropuestaCalibracion } from '@/entities/historical-project'
import { describe, expect, it } from 'vitest'

import { simularCambios } from './aplicar-propuesta'
import { RONDAS_MAXIMAS, refinarCambios } from './refinar'

const propuesta = (parcial: Partial<PropuestaCalibracion> = {}): PropuestaCalibracion => ({
  factorGlobal: 1.2,
  sigmaComun: 0.18,
  ajustes: [
    { clave: 'micro-core', factor: 1.2, pesoMedio: 0.5, proyectosConPeso: 6, confianza: 'alta' },
  ],
  advertencias: [],
  ...parcial,
})

/**
 * Motor de mentira. Modela la interacción real: el esfuerzo sube con las horas
 * base, pero el percentil comprometido BAJA si se estrecha el sigma.
 */
function motorFalso(realPorProyecto: number[]) {
  return (coeficientes: CoeficientesModelo) => {
    const escalaBase = coeficientes.base['micro-core'] / COEFICIENTES_POR_DEFECTO.base['micro-core']
    const escalaSigma = 1 + 0.84 * coeficientes.riesgo.sigmaComun
    const estimado = 100 * escalaBase * escalaSigma
    return calcularErrores(
      realPorProyecto.map((real, i) => ({
        id: `p${i}`,
        nombre: `p${i}`,
        estimado,
        real,
      })),
    )
  }
}

describe('refinarCambios', () => {
  // El modelo nominal estima 100 × (1 + 0.84×0.18) = 115.1; el real es 140.
  const reales = [140, 140, 140, 140, 140]

  it('converge a sesgo prácticamente nulo', () => {
    const { cambios, convergio } = refinarCambios(
      COEFICIENTES_POR_DEFECTO,
      propuesta({ sigmaComun: 0.05 }),
      motorFalso(reales),
    )
    expect(convergio).toBe(true)

    const finales = simularCambios(COEFICIENTES_POR_DEFECTO, cambios)
    const errores = motorFalso(reales)(finales)
    expect(Math.abs(errores[0].ratio - 1)).toBeLessThan(0.02)
  })

  it('una sola ronda deja sesgo residual: por eso hace falta iterar', () => {
    // Con la propuesta sin refinar, el sigma más estrecho cancela parte del ajuste.
    const sinRefinar = refinarCambios(
      COEFICIENTES_POR_DEFECTO,
      propuesta({ sigmaComun: 0.05 }),
      () => [],
    )
    const finales = simularCambios(COEFICIENTES_POR_DEFECTO, sinRefinar.cambios)
    const errores = motorFalso(reales)(finales)
    expect(Math.abs(errores[0].ratio - 1)).toBeGreaterThan(0.05)
  })

  it('no itera si ya no hay sesgo', () => {
    const { rondas, convergio } = refinarCambios(
      COEFICIENTES_POR_DEFECTO,
      propuesta({ sigmaComun: 0.18 }),
      motorFalso([115.1, 115.1, 115.1]),
    )
    expect(convergio).toBe(true)
    expect(rondas).toBeLessThanOrEqual(2)
  })

  it('sin cambios que hacer, termina de inmediato', () => {
    const { cambios, convergio } = refinarCambios(
      COEFICIENTES_POR_DEFECTO,
      propuesta({ factorGlobal: 1, sigmaComun: 0.18, ajustes: [] }),
      motorFalso(reales),
    )
    expect(cambios).toEqual([])
    expect(convergio).toBe(true)
  })

  it('se rinde tras un número acotado de rondas en vez de girar sin fin', () => {
    // Un backtest que nunca mejora: el bucle tiene que cortar.
    const { rondas, convergio } = refinarCambios(
      COEFICIENTES_POR_DEFECTO,
      propuesta(),
      () => calcularErrores([{ id: 'a', nombre: 'a', estimado: 1, real: 5 }]),
    )
    expect(convergio).toBe(false)
    expect(rondas).toBe(RONDAS_MAXIMAS)
  })

  it('un backtest vacío no rompe el refinamiento', () => {
    const { convergio } = refinarCambios(COEFICIENTES_POR_DEFECTO, propuesta(), () => [])
    expect(convergio).toBe(false)
  })
})
