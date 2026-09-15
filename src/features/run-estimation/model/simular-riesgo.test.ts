import { COEFICIENTES_POR_DEFECTO } from '@/entities/estimation-model'
import { describe, expect, it } from 'vitest'

import { calcularEsfuerzo } from './calcular-esfuerzo'
import { escalaDeCompromiso, simularRiesgo } from './simular-riesgo'
import type { Alcance, EsfuerzoDesarrollo } from './types'

const C = COEFICIENTES_POR_DEFECTO

const ALCANCE: Alcance = {
  nombre: 'test',
  jornada: { horasDia: 6, diasMes: 20 },
  nivelCompromiso: 80,
  componentes: [
    { id: 'core', nombre: 'Core', tipo: 'micro-core', stack: 'net8', esNuevo: false },
    { id: 'web', nombre: 'Web', tipo: 'front-angular', stack: 'angular17', esNuevo: false },
  ],
  features: Array.from({ length: 30 }, (_, i) => ({
    id: `f${i}`,
    nombre: `F${i}`,
    complejidad: 'm' as const,
    categoria: null, elementos: [], toca: [{ componenteId: 'core' }, { componenteId: 'web' }],
  })),
  integraciones: [],
  drivers: [],
}

const esfuerzo: EsfuerzoDesarrollo = calcularEsfuerzo(ALCANCE, C)

const opciones = {
  coeficientes: C,
  jornada: ALCANCE.jornada,
  nivelCompromiso: 80 as const,
  semilla: 123,
  iteraciones: 4000,
}

describe('simularRiesgo', () => {
  it('es reproducible con la misma semilla', () => {
    const a = simularRiesgo(esfuerzo, opciones)
    const b = simularRiesgo(esfuerzo, opciones)
    expect(a).toEqual(b)
  })

  it('cambia con otra semilla', () => {
    const a = simularRiesgo(esfuerzo, opciones)
    const b = simularRiesgo(esfuerzo, { ...opciones, semilla: 999 })
    expect(a.devP80Horas).not.toBe(b.devP80Horas)
  })

  it('los percentiles están ordenados', () => {
    const r = simularRiesgo(esfuerzo, opciones)
    expect(r.devP50Horas).toBeLessThan(r.devP80Horas)
    expect(r.devP80Horas).toBeLessThan(r.devP90Horas)
  })

  it('el riesgo común ensancha la banda que el CLT colapsaría', () => {
    // Sin riesgo común, sumar 60 items independientes da una banda ridícula.
    const sinRiesgo = simularRiesgo(esfuerzo, {
      ...opciones,
      coeficientes: { ...C, riesgo: { ...C.riesgo, sigmaComun: 0 } },
    })
    const conRiesgo = simularRiesgo(esfuerzo, opciones)

    const anchoSin = sinRiesgo.devP90Horas / sinRiesgo.devP50Horas
    const anchoCon = conRiesgo.devP90Horas / conRiesgo.devP50Horas

    expect(anchoSin).toBeLessThan(1.1) // el colapso del teorema central del límite
    expect(anchoCon).toBeGreaterThan(1.2) // banda creíble
    expect(anchoCon).toBeGreaterThan(anchoSin)
  })

  it('el percentil comprometido sigue al nivel pedido', () => {
    const p50 = simularRiesgo(esfuerzo, { ...opciones, nivelCompromiso: 50 })
    const p80 = simularRiesgo(esfuerzo, { ...opciones, nivelCompromiso: 80 })
    const p90 = simularRiesgo(esfuerzo, { ...opciones, nivelCompromiso: 90 })

    expect(p50.comprometidoHoras).toBe(p50.devP50Horas)
    expect(p80.comprometidoHoras).toBe(p80.devP80Horas)
    expect(p90.comprometidoHoras).toBe(p90.devP90Horas)
    expect(p50.totalHoras).toBeLessThan(p80.totalHoras)
    expect(p80.totalHoras).toBeLessThan(p90.totalHoras)
  })

  it('aplica el overhead de 1.65 sobre el esfuerzo comprometido', () => {
    const r = simularRiesgo(esfuerzo, opciones)
    expect(r.totalHoras / r.comprometidoHoras).toBeCloseTo(1.65, 10)
  })

  it('convierte a meses-hombre con la jornada del proyecto', () => {
    const seisPorVeinte = simularRiesgo(esfuerzo, opciones)
    const ochoPorVeintidos = simularRiesgo(esfuerzo, {
      ...opciones,
      jornada: { horasDia: 8, diasMes: 22 },
    })
    expect(seisPorVeinte.totalMesesHombre).toBeCloseTo(seisPorVeinte.totalHoras / 120, 6)
    expect(ochoPorVeintidos.totalMesesHombre).toBeCloseTo(
      ochoPorVeintidos.totalHoras / 176,
      6,
    )
    // Misma obra, jornadas distintas: menos meses-hombre con jornadas más largas.
    expect(ochoPorVeintidos.totalMesesHombre).toBeLessThan(seisPorVeinte.totalMesesHombre)
  })

  it('el colchón sobre P50 es positivo al comprometer P80', () => {
    expect(simularRiesgo(esfuerzo, opciones).colchonSobreP50).toBeGreaterThan(0)
  })
})

describe('escalaDeCompromiso', () => {
  it('es mayor que 1 al comprometer por encima de la mediana', () => {
    const riesgo = simularRiesgo(esfuerzo, opciones)
    expect(escalaDeCompromiso(esfuerzo, riesgo)).toBeGreaterThan(1)
  })

  it('devuelve 1 si no hay esfuerzo', () => {
    const vacio = { ...esfuerzo, devNominalHoras: 0 }
    expect(escalaDeCompromiso(vacio, simularRiesgo(esfuerzo, opciones))).toBe(1)
  })
})
