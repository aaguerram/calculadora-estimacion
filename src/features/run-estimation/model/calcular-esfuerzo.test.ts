import { COEFICIENTES_POR_DEFECTO } from '@/entities/estimation-model'
import { describe, expect, it } from 'vitest'

import { calcularEsfuerzo, calcularFactorProyecto } from './calcular-esfuerzo'
import type { Alcance } from './types'

const C = COEFICIENTES_POR_DEFECTO

function alcanceBase(parcial: Partial<Alcance> = {}): Alcance {
  return {
    nombre: 'test',
    jornada: { horasDia: 6, diasMes: 20 },
    nivelCompromiso: 80,
    componentes: [
      { id: 'core', nombre: 'Core', tipo: 'micro-core', stack: 'net8', esNuevo: false },
    ],
    features: [],
    integraciones: [],
    drivers: [],
    ...parcial,
  }
}

describe('calcularFactorProyecto', () => {
  it('sin drivers es neutro', () => {
    expect(calcularFactorProyecto(alcanceBase())).toBe(1)
  })

  it('suma los deltas en vez de multiplicarlos', () => {
    // Multiplicando 1.15 x 1.10 x 1.12 x 1.08 = 1.53; sumando = 1.45.
    // Componer factores es lo que infla las estimaciones paramétricas (doc §4).
    const alcance = alcanceBase({
      drivers: [
        { clave: 'a', etiqueta: 'a', delta: 0.15 },
        { clave: 'b', etiqueta: 'b', delta: 0.1 },
        { clave: 'c', etiqueta: 'c', delta: 0.12 },
        { clave: 'd', etiqueta: 'd', delta: 0.08 },
      ],
    })
    expect(calcularFactorProyecto(alcance)).toBeCloseTo(1.45, 10)
  })

  it('nunca baja de 0.5 por muchos drivers favorables que haya', () => {
    const alcance = alcanceBase({
      drivers: Array.from({ length: 10 }, (_, i) => ({
        clave: `d${i}`,
        etiqueta: 'x',
        delta: -0.2,
      })),
    })
    expect(calcularFactorProyecto(alcance)).toBe(0.5)
  })
})

describe('calcularEsfuerzo', () => {
  it('estima el par feature × componente, no la feature suelta', () => {
    const alcance = alcanceBase({
      features: [
        { id: 'f1', nombre: 'F1', complejidad: 'm', categoria: null, elementos: [], toca: [{ componenteId: 'core' }] },
      ],
    })
    const r = calcularEsfuerzo(alcance, C)
    // 60 (micro-core) × 1.0 (media) × 1.0 (net8)
    expect(r.devBrutoHoras).toBe(60)
    expect(r.horasPorComponente.core).toBe(60)
    expect(r.items).toHaveLength(1)
  })

  it('aplica el factor de stack de .NET Framework', () => {
    const alcance = alcanceBase({
      componentes: [
        { id: 'leg', nombre: 'Legacy', tipo: 'monolito-netfx', stack: 'netfx', esNuevo: false },
      ],
      features: [
        { id: 'f1', nombre: 'F1', complejidad: 'm', categoria: null, elementos: [], toca: [{ componenteId: 'leg' }] },
      ],
    })
    // 68 × 1.0 × 1.3
    expect(calcularEsfuerzo(alcance, C).devBrutoHoras).toBeCloseTo(88.4, 10)
  })

  it('un componente 3GL cuesta 2.6× lo mismo en .NET, como midieron los datos', () => {
    const alcance = alcanceBase({
      componentes: [
        { id: 'host', nombre: 'Host', tipo: 'componente-3gl', stack: 'cobol', esNuevo: false },
      ],
      features: [
        { id: 'f1', nombre: 'F1', complejidad: 'm', categoria: null, elementos: [], toca: [{ componenteId: 'host' }] },
      ],
    })
    // 72 (base 3GL) × 1.0 (media) × 2.6 (COBOL)
    expect(calcularEsfuerzo(alcance, C).devBrutoHoras).toBeCloseTo(187.2, 10)
  })

  it('un componente 3GL nunca cobra arranque: ya existe', () => {
    const alcance = alcanceBase({
      componentes: [
        { id: 'host', nombre: 'Host', tipo: 'componente-3gl', stack: 'cobol', esNuevo: true },
      ],
      features: [
        { id: 'f1', nombre: 'F1', complejidad: 'm', categoria: null, elementos: [], toca: [{ componenteId: 'host' }] },
      ],
    })
    const r = calcularEsfuerzo(alcance, C)
    expect(r.items.filter((i) => i.categoria === 'bootstrap')).toHaveLength(0)
  })

  it('permite complejidad distinta por componente dentro de la misma feature', () => {
    const alcance = alcanceBase({
      componentes: [
        { id: 'core', nombre: 'Core', tipo: 'micro-core', stack: 'net8', esNuevo: false },
        { id: 'web', nombre: 'Web', tipo: 'front-angular', stack: 'angular17', esNuevo: false },
      ],
      features: [
        {
          id: 'f1',
          nombre: 'Transferencia',
          complejidad: 'ma',
          categoria: null, elementos: [], toca: [{ componenteId: 'core' }, { componenteId: 'web', complejidad: 'b' }],
        },
      ],
    })
    const r = calcularEsfuerzo(alcance, C)
    expect(r.horasPorComponente.core).toBeCloseTo(60 * 2.2, 10) // hereda "ma"
    expect(r.horasPorComponente.web).toBeCloseTo(40 * 0.7, 10) // override "b"
  })

  it('cobra el arranque una sola vez y solo en componentes nuevos', () => {
    const alcance = alcanceBase({
      componentes: [
        { id: 'core', nombre: 'Core', tipo: 'micro-core', stack: 'net8', esNuevo: true },
      ],
      features: [
        { id: 'f1', nombre: 'F1', complejidad: 'm', categoria: null, elementos: [], toca: [{ componenteId: 'core' }] },
        { id: 'f2', nombre: 'F2', complejidad: 'm', categoria: null, elementos: [], toca: [{ componenteId: 'core' }] },
      ],
    })
    const r = calcularEsfuerzo(alcance, C)
    expect(r.items.filter((i) => i.categoria === 'bootstrap')).toHaveLength(1)
    expect(r.devBrutoHoras).toBe(60 + 60 + 56)
  })

  it('aplica los recargos de integración de forma multiplicativa', () => {
    const alcance = alcanceBase({
      integraciones: [
        {
          id: 'i1',
          nombre: 'Core bancario',
          complejidad: 'a',
          componenteDuenioId: 'core',
          esExterna: true,
          tieneSandbox: false,
          usos: 3,
        },
      ],
    })
    const r = calcularEsfuerzo(alcance, C)
    // 56 × 1.4 (externa) × 1.3 (sin sandbox) × 1.5 (3 usos)
    expect(r.devBrutoHoras).toBeCloseTo(56 * 1.4 * 1.3 * 1.5, 10)
  })

  it('imputa la integración al stream de su componente dueño', () => {
    const alcance = alcanceBase({
      componentes: [
        { id: 'core', nombre: 'Core', tipo: 'micro-core', stack: 'net8', esNuevo: false },
        { id: 'bff', nombre: 'BFF', tipo: 'bff', stack: 'net8', esNuevo: false },
      ],
      integraciones: [
        {
          id: 'i1',
          nombre: 'IAM',
          complejidad: 'm',
          componenteDuenioId: 'bff',
          esExterna: false,
          tieneSandbox: true,
          usos: 1,
        },
      ],
    })
    const r = calcularEsfuerzo(alcance, C)
    expect(r.horasPorComponente.bff).toBe(24)
    expect(r.horasPorComponente.core).toBeUndefined()
  })

  it('ignora referencias a componentes inexistentes', () => {
    const alcance = alcanceBase({
      features: [
        { id: 'f1', nombre: 'F1', complejidad: 'm', categoria: null, elementos: [], toca: [{ componenteId: 'fantasma' }] },
      ],
    })
    expect(calcularEsfuerzo(alcance, C).devBrutoHoras).toBe(0)
  })

  it('deja traza auditable de cada item', () => {
    const alcance = alcanceBase({
      features: [
        { id: 'f1', nombre: 'Alta', complejidad: 'a', categoria: null, elementos: [], toca: [{ componenteId: 'core' }] },
      ],
    })
    const [item] = calcularEsfuerzo(alcance, C).items
    expect(item.concepto).toBe('Alta · Core')
    expect(item.factores).toEqual({ base: 60, complejidad: 1.6, stack: 1 })
    expect(item.horasOptimista).toBeLessThan(item.horasModal)
    expect(item.horasPesimista).toBeGreaterThan(item.horasModal)
  })

  it('el rango PERT es asimétrico a la derecha', () => {
    const alcance = alcanceBase({
      features: [
        { id: 'f1', nombre: 'F1', complejidad: 'ma', categoria: null, elementos: [], toca: [{ componenteId: 'core' }] },
      ],
    })
    const [item] = calcularEsfuerzo(alcance, C).items
    const haciaAbajo = item.horasModal - item.horasOptimista
    const haciaArriba = item.horasPesimista - item.horasModal
    expect(haciaArriba).toBeGreaterThan(haciaAbajo * 2)
  })
})
