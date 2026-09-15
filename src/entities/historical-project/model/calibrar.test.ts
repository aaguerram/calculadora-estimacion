import { describe, expect, it } from 'vitest'

import {
  ajustarPorBucket,
  mediaGeometrica,
  proponerCalibracion,
  sigmaLogaritmica,
} from './calibrar'
import type { ObservacionCalibracion } from './calibrar'
import { calcularErrores } from './metricas'

describe('mediaGeometrica', () => {
  it('es neutra con ratios simétricos en escala logarítmica', () => {
    // 0.5 y 2.0: la media aritmética daría 1.25; la geométrica, 1.
    expect(mediaGeometrica([0.5, 2])).toBeCloseTo(1, 10)
  })

  it('recupera un sesgo sistemático', () => {
    expect(mediaGeometrica([1.2, 1.2, 1.2])).toBeCloseTo(1.2, 10)
  })

  it('ignora valores no positivos', () => {
    expect(mediaGeometrica([1.2, 0, -3, Number.NaN])).toBeCloseTo(1.2, 10)
  })

  it('sin datos devuelve 1, no NaN', () => {
    expect(mediaGeometrica([])).toBe(1)
  })
})

describe('sigmaLogaritmica', () => {
  it('sin dispersión es 0', () => {
    expect(sigmaLogaritmica([1.2, 1.2, 1.2])).toBe(0)
  })

  it('crece con la dispersión', () => {
    expect(sigmaLogaritmica([0.9, 1.1, 1.0, 1.05])).toBeLessThan(
      sigmaLogaritmica([0.5, 1.8, 1.0, 2.2]),
    )
  })

  it('con menos de dos datos no hay varianza que medir', () => {
    expect(sigmaLogaritmica([1.3])).toBe(0)
  })
})

describe('ajustarPorBucket', () => {
  const obs = (id: string, buckets: Record<string, number>, ratio: number): ObservacionCalibracion => ({
    id,
    horasPorBucket: buckets,
    ratio,
  })

  it('recupera el factor de un bucket que domina la muestra', () => {
    // Seis proyectos hechos casi solo de 'core', todos con ratio 1.4.
    const observaciones = Array.from({ length: 6 }, (_, i) =>
      obs(`p${i}`, { core: 95, web: 5 }, 1.4),
    )
    const ajustes = ajustarPorBucket(observaciones, 1.4)
    const core = ajustes.find((a) => a.clave === 'core')!
    expect(core.factor).toBeCloseTo(1.4, 1)
    expect(core.confianza).toBe('alta')
  })

  it('encoge hacia el global los buckets con poco dato', () => {
    const observaciones = [
      obs('p1', { core: 90, raro: 10 }, 1.0),
      obs('p2', { core: 100 }, 1.0),
      obs('p3', { core: 100 }, 1.0),
      obs('p4', { core: 100 }, 1.0),
    ]
    const ajustes = ajustarPorBucket(observaciones, 1.0)
    const raro = ajustes.find((a) => a.clave === 'raro')!
    expect(raro.confianza).toBe('baja')
    expect(raro.factor).toBeCloseTo(1.0, 1)
  })

  it('separa dos buckets con comportamientos distintos', () => {
    // 'legacy' siempre cuesta el doble; 'web' siempre acierta.
    const observaciones = [
      obs('p1', { legacy: 100 }, 2.0),
      obs('p2', { legacy: 100 }, 2.0),
      obs('p3', { legacy: 100 }, 2.0),
      obs('p4', { web: 100 }, 1.0),
      obs('p5', { web: 100 }, 1.0),
      obs('p6', { web: 100 }, 1.0),
    ]
    const ajustes = ajustarPorBucket(observaciones, Math.sqrt(2))
    const legacy = ajustes.find((a) => a.clave === 'legacy')!
    const web = ajustes.find((a) => a.clave === 'web')!
    expect(legacy.factor).toBeGreaterThan(web.factor)
    expect(legacy.factor).toBeGreaterThan(1.5)
    expect(web.factor).toBeLessThan(1.3)
  })

  it('nunca propone factores absurdos', () => {
    const observaciones = [obs('p1', { core: 100 }, 50), obs('p2', { core: 100 }, 0.01)]
    for (const ajuste of ajustarPorBucket(observaciones, 1)) {
      expect(ajuste.factor).toBeGreaterThanOrEqual(0.5)
      expect(ajuste.factor).toBeLessThanOrEqual(3)
    }
  })

  it('sin observaciones no propone nada', () => {
    expect(ajustarPorBucket([], 1.2)).toEqual([])
  })
})

describe('proponerCalibracion', () => {
  const errores = calcularErrores([
    { id: 'a', nombre: 'a', estimado: 100, real: 122 },
    { id: 'b', nombre: 'b', estimado: 50, real: 60 },
    { id: 'c', nombre: 'c', estimado: 80, real: 99 },
  ])
  const observaciones: ObservacionCalibracion[] = errores.map((e) => ({
    id: e.id,
    horasPorBucket: { core: 60, web: 40 },
    ratio: e.ratio,
  }))

  it('propone el factor que corrige el sesgo', () => {
    const p = proponerCalibracion(errores, observaciones)
    expect(p.factorGlobal).toBeGreaterThan(1.18)
    expect(p.factorGlobal).toBeLessThan(1.26)
  })

  it('mide el sigma del riesgo común sobre los residuos', () => {
    const p = proponerCalibracion(errores, observaciones)
    expect(p.sigmaComun).toBeGreaterThan(0)
    expect(p.sigmaComun).toBeLessThan(0.2)
  })

  it('avisa cuando el modelo ya no tiene sesgo', () => {
    const sinSesgo = calcularErrores([
      { id: 'a', nombre: 'a', estimado: 100, real: 100 },
      { id: 'b', nombre: 'b', estimado: 50, real: 50 },
      { id: 'c', nombre: 'c', estimado: 80, real: 80 },
    ])
    const p = proponerCalibracion(sinSesgo, [])
    expect(p.advertencias.join(' ')).toContain('no tiene sesgo sistemático')
  })

  it('avisa de muestra insuficiente', () => {
    const p = proponerCalibracion(errores.slice(0, 2), observaciones.slice(0, 2))
    expect(p.advertencias.join(' ')).toContain('orientativa')
  })

  it('avisa cuando acierta en media pero falla por proyecto', () => {
    const dispersos = calcularErrores([
      { id: 'a', nombre: 'a', estimado: 100, real: 200 },
      { id: 'b', nombre: 'b', estimado: 100, real: 50 },
      { id: 'c', nombre: 'c', estimado: 100, real: 105 },
    ])
    const p = proponerCalibracion(dispersos, [])
    expect(p.advertencias.join(' ')).toContain('dispersión')
  })
})
