import { describe, expect, it } from 'vitest'

import { calcularErrores, calcularMetricas, motivosDeNoApto } from './metricas'
import type { ParEstimadoReal } from './metricas'

const par = (id: string, estimado: number, real: number): ParEstimadoReal => ({
  id,
  nombre: id,
  estimado,
  real,
})

describe('calcularErrores', () => {
  it('divide por el real, que es la convención del MRE', () => {
    const [e] = calcularErrores([par('a', 80, 100)])
    expect(e.mre).toBeCloseTo(0.2, 10)
    expect(e.ratio).toBeCloseTo(1.25, 10)
  })

  it('el MRE es absoluto: pasarse y quedarse corto pesan igual', () => {
    const [bajo, alto] = calcularErrores([par('a', 80, 100), par('b', 120, 100)])
    expect(bajo.mre).toBeCloseTo(alto.mre, 10)
  })

  it('marca PRED(25) con el umbral del 25 %', () => {
    const errores = calcularErrores([par('justo', 76, 100), par('fuera', 74, 100)])
    expect(errores[0].dentroDePred25).toBe(true)
    expect(errores[1].dentroDePred25).toBe(false)
  })

  it('descarta proyectos sin real utilizable', () => {
    expect(calcularErrores([par('a', 80, 0), par('b', 80, Number.NaN)])).toEqual([])
  })
})

describe('calcularMetricas', () => {
  it('sin datos no inventa métricas', () => {
    const m = calcularMetricas([])
    expect(m.n).toBe(0)
    expect(m.apto).toBe(false)
    expect(m.mmre).toBeNaN()
  })

  it('un modelo perfecto da MMRE 0 y PRED(25) 1', () => {
    const m = calcularMetricas(
      calcularErrores([par('a', 100, 100), par('b', 50, 50), par('c', 20, 20)]),
    )
    expect(m.mmre).toBe(0)
    expect(m.pred25).toBe(1)
    expect(m.sesgo).toBe(0)
    expect(m.apto).toBe(true)
  })

  it('el sesgo es negativo cuando el modelo subestima', () => {
    const m = calcularMetricas(calcularErrores([par('a', 80, 100), par('b', 80, 100)]))
    expect(m.sesgo).toBeCloseTo(-0.2, 10)
  })

  it('la mediana resiste un proyecto atípico que dispara la media', () => {
    const m = calcularMetricas(
      calcularErrores([
        par('a', 100, 100),
        par('b', 100, 100),
        par('c', 100, 100),
        par('atipico', 10, 100),
      ]),
    )
    expect(m.mmre).toBeCloseTo(0.225, 10)
    expect(m.mdmre).toBe(0) // la mediana ignora el caso raro
  })

  it('no declara apto un modelo con menos de 3 proyectos por bien que salga', () => {
    const m = calcularMetricas(calcularErrores([par('a', 100, 100), par('b', 50, 50)]))
    expect(m.mmre).toBe(0)
    expect(m.apto).toBe(false)
    expect(motivosDeNoApto(m).join(' ')).toContain('Solo 2')
  })

  it('explica cada motivo de no aptitud', () => {
    const m = calcularMetricas(
      calcularErrores([par('a', 50, 100), par('b', 50, 100), par('c', 50, 100)]),
    )
    const motivos = motivosDeNoApto(m).join(' | ')
    expect(motivos).toContain('MMRE')
    expect(motivos).toContain('PRED(25)')
    expect(motivos).toContain('subestima')
  })
})
