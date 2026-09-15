import { describe, expect, it } from 'vitest'

import {
  crearRng,
  media,
  multiplicadorLognormal,
  muestraTriangular,
  percentil,
} from './statistics'

describe('crearRng', () => {
  it('es determinista para la misma semilla', () => {
    const a = crearRng(42)
    const b = crearRng(42)
    expect([a(), a(), a()]).toEqual([b(), b(), b()])
  })

  it('produce secuencias distintas para semillas distintas', () => {
    expect(crearRng(1)()).not.toBe(crearRng(2)())
  })

  it('se mantiene dentro de [0, 1)', () => {
    const rng = crearRng(7)
    for (let i = 0; i < 1000; i++) {
      const v = rng()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })
})

describe('muestraTriangular', () => {
  it('nunca sale del rango [optimista, pesimista]', () => {
    const rng = crearRng(3)
    for (let i = 0; i < 2000; i++) {
      const v = muestraTriangular(10, 14, 30, rng)
      expect(v).toBeGreaterThanOrEqual(10)
      expect(v).toBeLessThanOrEqual(30)
    }
  })

  it('su media tiende a (o + m + p) / 3', () => {
    const rng = crearRng(11)
    const muestras = Array.from({ length: 50000 }, () => muestraTriangular(10, 14, 30, rng))
    expect(media(muestras)).toBeCloseTo((10 + 14 + 30) / 3, 0)
  })

  it('con rango degenerado devuelve la moda', () => {
    expect(muestraTriangular(5, 5, 5, crearRng(1))).toBe(5)
  })

  it('está sesgada a la derecha cuando la cola pesimista es larga', () => {
    const rng = crearRng(5)
    const muestras = Array.from({ length: 50000 }, () => muestraTriangular(8, 10, 25, rng))
    // Media > moda es la definición de sesgo positivo: el software se pasa más de lo que se adelanta.
    expect(media(muestras)).toBeGreaterThan(10)
  })
})

describe('multiplicadorLognormal', () => {
  it('con sigma 0 es neutro', () => {
    expect(multiplicadorLognormal(0, crearRng(1))).toBe(1)
  })

  it('tiene media 1: no desplaza la estimación, solo la ensancha', () => {
    const rng = crearRng(13)
    const muestras = Array.from({ length: 80000 }, () => multiplicadorLognormal(0.18, rng))
    expect(media(muestras)).toBeCloseTo(1, 1)
  })

  it('siempre es positivo', () => {
    const rng = crearRng(17)
    for (let i = 0; i < 5000; i++) {
      expect(multiplicadorLognormal(0.3, rng)).toBeGreaterThan(0)
    }
  })
})

describe('percentil', () => {
  const datos = [1, 2, 3, 4, 5]

  it('devuelve los extremos', () => {
    expect(percentil(datos, 0)).toBe(1)
    expect(percentil(datos, 1)).toBe(5)
  })

  it('interpola la mediana', () => {
    expect(percentil(datos, 0.5)).toBe(3)
    expect(percentil([1, 2, 3, 4], 0.5)).toBe(2.5)
  })

  it('es monótono creciente en q', () => {
    expect(percentil(datos, 0.5)).toBeLessThanOrEqual(percentil(datos, 0.8))
    expect(percentil(datos, 0.8)).toBeLessThanOrEqual(percentil(datos, 0.9))
  })

  it('devuelve NaN para muestra vacía', () => {
    expect(percentil([], 0.5)).toBeNaN()
  })
})
