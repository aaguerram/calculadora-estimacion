import { describe, expect, it } from 'vitest'

import { ejecutarBacktest } from './backtest'
import type { Estimador } from './backtest'
import type { ProyectoHistorico } from './types'

const alcanceFalso = { nombre: 'x' } as ProyectoHistorico['alcance']

const historico = (
  id: string,
  mhReales: number,
  alcance: ProyectoHistorico['alcance'] = alcanceFalso,
): ProyectoHistorico => ({
  id,
  nombre: id,
  cerradoEn: '2026-01-01',
  mhEstimadas: 0,
  mhReales,
  mesesReales: 10,
  personasReales: 8,
  alcance,
})

/** Estimador de mentira: el motor real no hace falta para probar esta lógica. */
const estimadorFijo =
  (
    mesesHombre: number,
    buckets: Record<string, number> = { core: 100 },
    fraccionPorPuntos?: number,
  ): Estimador =>
  () => ({ mesesHombre, horasPorBucket: buckets, fraccionPorPuntos })

describe('ejecutarBacktest', () => {
  it('compara lo re-estimado con lo que costó de verdad', () => {
    const r = ejecutarBacktest([historico('a', 120), historico('b', 120)], estimadorFijo(100))
    expect(r.errores).toHaveLength(2)
    expect(r.errores[0].ratio).toBeCloseTo(1.2, 10)
    expect(r.metricas.n).toBe(2)
  })

  it('descarta proyectos sin alcance guardado y dice por qué', () => {
    const r = ejecutarBacktest([historico('a', 120), historico('sin-foto', 120, null)], estimadorFijo(100))
    expect(r.errores).toHaveLength(1)
    expect(r.descartados).toEqual(['sin-foto: sin alcance guardado'])
  })

  it('descarta proyectos sin meses-hombre reales', () => {
    const r = ejecutarBacktest([historico('a', 0)], estimadorFijo(100))
    expect(r.descartados[0]).toContain('sin meses-hombre reales')
  })

  it('descarta un alcance que no produce esfuerzo', () => {
    const r = ejecutarBacktest([historico('a', 120)], estimadorFijo(0))
    expect(r.descartados[0]).toContain('no produce esfuerzo')
    expect(r.metricas.n).toBe(0)
  })

  it('devuelve las observaciones listas para calibrar', () => {
    const r = ejecutarBacktest(
      [historico('a', 150)],
      estimadorFijo(100, { core: 70, web: 30 }),
    )
    expect(r.observaciones[0].horasPorBucket).toEqual({ core: 70, web: 30 })
    expect(r.observaciones[0].ratio).toBeCloseTo(1.5, 10)
  })

  it('permite re-ejecutarlo con otros coeficientes inyectando otro estimador', () => {
    const historicos = [historico('a', 120), historico('b', 120), historico('c', 120)]
    const antes = ejecutarBacktest(historicos, estimadorFijo(100))
    const despues = ejecutarBacktest(historicos, estimadorFijo(120))
    // |120 − 100| / 120: el MRE se divide por el REAL, no por el estimado.
    expect(antes.metricas.mmre).toBeCloseTo(20 / 120, 10)
    expect(despues.metricas.mmre).toBe(0)
  })

  it('promedia cuánto del histórico se midió por puntos función', () => {
    const r = ejecutarBacktest(
      [historico('a', 120), historico('b', 120)],
      estimadorFijo(100, { core: 100 }, 0.5),
    )
    expect(r.fraccionPorPuntos).toBeCloseTo(0.5, 10)
  })

  it('sin esa información la fracción es 0: no se calibra lo que no se ejercita', () => {
    const r = ejecutarBacktest([historico('a', 120)], estimadorFijo(100))
    expect(r.fraccionPorPuntos).toBe(0)
  })

  it('sin histórico devuelve métricas vacías, no un error', () => {
    const r = ejecutarBacktest([], estimadorFijo(100))
    expect(r.metricas.n).toBe(0)
    expect(r.errores).toEqual([])
  })
})
