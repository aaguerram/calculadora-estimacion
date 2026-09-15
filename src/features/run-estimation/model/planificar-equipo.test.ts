import { COEFICIENTES_POR_DEFECTO } from '@/entities/estimation-model'
import { describe, expect, it } from 'vitest'

import { TOLERANCIA_COSTE, duracionStream, planificarEquipo } from './planificar-equipo'
import type { Alcance } from './types'

const C = COEFICIENTES_POR_DEFECTO

const ALCANCE: Alcance = {
  nombre: 'test',
  jornada: { horasDia: 6, diasMes: 20 },
  nivelCompromiso: 80,
  componentes: [
    { id: 'core', nombre: 'Core', tipo: 'micro-core', stack: 'net8', esNuevo: false },
    { id: 'web', nombre: 'Web', tipo: 'front-angular', stack: 'angular17', esNuevo: false },
    { id: 'legacy', nombre: 'Legacy', tipo: 'monolito-netfx', stack: 'netfx', esNuevo: false },
  ],
  features: [],
  integraciones: [],
  drivers: [],
}

const plan = (mh: Record<string, number>, arranque = 0) =>
  planificarEquipo(ALCANCE, {
    coeficientes: C,
    mesesHombrePorComponente: mh,
    mesesHombreArranque: arranque,
  })

describe('duracionStream', () => {
  it('con una persona la duración es el esfuerzo completo', () => {
    expect(duracionStream(12, 1, 0.02)).toBe(12)
  })

  it('repartir acorta, pero menos de lo proporcional', () => {
    const uno = duracionStream(12, 1, 0.02)
    const tres = duracionStream(12, 3, 0.02)
    expect(tres).toBeLessThan(uno)
    expect(tres).toBeGreaterThan(uno / 3) // la sobrecarga se cobra
  })

  it('sin sobrecarga el reparto sí es proporcional', () => {
    expect(duracionStream(12, 3, 0)).toBeCloseTo(4, 10)
  })

  it('con gamma alto, más gente empeora', () => {
    expect(duracionStream(12, 12, 0.5)).toBeGreaterThan(duracionStream(12, 4, 0.5))
  })
})

describe('planificarEquipo', () => {
  it('respeta el máximo de devs útiles de cada componente', () => {
    const r = plan({ core: 30, web: 30, legacy: 30 })
    expect(r.streams.find((s) => s.componenteId === 'core')?.capDevs).toBe(3)
    expect(r.streams.find((s) => s.componenteId === 'web')?.capDevs).toBe(5)
    // El monolito .NET Framework tolera 2: acoplamiento y coste de regresión.
    expect(r.streams.find((s) => s.componenteId === 'legacy')?.capDevs).toBe(2)

    for (const punto of r.frontera) {
      for (const d of punto.dotacion) {
        const stream = r.streams.find((s) => s.componenteId === d.componenteId)
        expect(d.devs).toBeLessThanOrEqual(stream?.capDevs ?? 0)
      }
    }
  })

  it('un stream 3GL solo admite 2 devs: el host no se paraleliza', () => {
    const alcance: Alcance = {
      ...ALCANCE,
      componentes: [
        { id: 'host', nombre: 'Host', tipo: 'componente-3gl', stack: 'cobol', esNuevo: false },
      ],
    }
    const r = planificarEquipo(alcance, {
      coeficientes: C,
      mesesHombrePorComponente: { host: 40 },
      mesesHombreArranque: 0,
    })
    expect(r.streams[0].capDevs).toBe(2)
    for (const punto of r.frontera) expect(punto.dotacion[0].devs).toBeLessThanOrEqual(2)
  })

  it('acepta un cap propio por componente', () => {
    const alcance: Alcance = {
      ...ALCANCE,
      componentes: [{ ...ALCANCE.componentes[0], capDevs: 1 }],
    }
    const r = planificarEquipo(alcance, {
      coeficientes: C,
      mesesHombrePorComponente: { core: 24 },
      mesesHombreArranque: 0,
    })
    expect(r.streams[0].capDevs).toBe(1)
    expect(r.rutaCriticaMeses).toBe(24)
  })

  it('la ruta crítica la marca el stream más largo, no el esfuerzo total', () => {
    // Legacy tiene menos esfuerzo que core, pero solo aguanta 2 devs.
    const r = plan({ core: 12, web: 12, legacy: 10 })
    const legacy = r.streams.find((s) => s.componenteId === 'legacy')
    expect(r.rutaCriticaMeses).toBeCloseTo(legacy?.duracionMinima ?? 0, 10)
  })

  it('meter gente en un stream que no es crítico no acorta el proyecto', () => {
    const conPocoFront = plan({ core: 30, web: 3, legacy: 5 })
    const conMuchoFront = plan({ core: 30, web: 3, legacy: 5 })
    expect(conPocoFront.rutaCriticaMeses).toBe(conMuchoFront.rutaCriticaMeses)
  })

  it('el arranque serial se reparte entre el núcleo, no entre todo el equipo', () => {
    const r = plan({ core: 12 }, 4)
    expect(r.arranqueSerialMeses).toBe(4 / C.equipo.personasNucleoSerial)
  })

  it('produce una frontera con varias opciones de equipo', () => {
    const r = plan({ core: 20, web: 18, legacy: 10 })
    expect(r.frontera.length).toBeGreaterThan(2)
    // Ordenada por personas, sin duplicados.
    const personas = r.frontera.map((p) => p.personas)
    expect([...personas].sort((a, b) => a - b)).toEqual(personas)
    expect(new Set(personas).size).toBe(personas.length)
  })

  it('el recomendado está dentro de la tolerancia del coste mínimo', () => {
    const r = plan({ core: 20, web: 18, legacy: 10 })
    const costeMinimo = Math.min(...r.frontera.map((p) => p.mesesHombreFacturables))
    expect(r.recomendado.mesesHombreFacturables).toBeLessThanOrEqual(
      costeMinimo * (1 + TOLERANCIA_COSTE),
    )
  })

  it('con costes empatados recomienda el más rápido, no el más lento', () => {
    const r = plan({ core: 20, web: 18, legacy: 10 })
    const costeMinimo = Math.min(...r.frontera.map((p) => p.mesesHombreFacturables))
    const empatados = r.frontera.filter(
      (p) => p.mesesHombreFacturables <= costeMinimo * (1 + TOLERANCIA_COSTE),
    )
    const masRapidoDeLosBaratos = Math.min(...empatados.map((p) => p.duracionMeses))
    expect(r.recomendado.duracionMeses).toBe(masRapidoDeLosBaratos)
  })

  it('el más rápido es el de menor duración', () => {
    const r = plan({ core: 20, web: 18, legacy: 10 })
    for (const punto of r.frontera) {
      expect(r.masRapido.duracionMeses).toBeLessThanOrEqual(punto.duracionMeses)
    }
  })

  it('acelerar al máximo cuesta más que el recomendado', () => {
    const r = plan({ core: 20, web: 18, legacy: 10 })
    expect(r.masRapido.mesesHombreFacturables).toBeGreaterThanOrEqual(
      r.recomendado.mesesHombreFacturables,
    )
  })

  it('la coordinación crece con el tamaño del equipo (ley de Brooks)', () => {
    const r = plan({ core: 20, web: 18, legacy: 10 })
    const pequeno = r.frontera[0]
    const grande = r.frontera[r.frontera.length - 1]
    expect(grande.factorCoordinacion).toBeGreaterThan(pequeno.factorCoordinacion)
    expect(pequeno.factorCoordinacion).toBeGreaterThanOrEqual(1)
  })

  it('la curva se dobla: pasado el óptimo, más gente da MÁS meses', () => {
    const r = plan({ core: 26, web: 24, legacy: 14 })
    const masGenteYMasLento = r.frontera.some(
      (p) => p.personas > r.masRapido.personas && p.duracionMeses > r.masRapido.duracionMeses,
    )
    expect(masGenteYMasLento).toBe(true)
  })

  it('el equipo mínimo es el de menos personas y más meses', () => {
    const r = plan({ core: 20, web: 18, legacy: 10 })
    expect(r.equipoMinimo.personas).toBeLessThanOrEqual(r.masRapido.personas)
    expect(r.equipoMinimo.duracionMeses).toBeGreaterThanOrEqual(r.masRapido.duracionMeses)
  })

  it('dimensiona QA, DevOps y gestión además de los devs', () => {
    const r = plan({ core: 20, web: 18, legacy: 10 })
    const p = r.recomendado
    expect(p.qa).toBeGreaterThan(0)
    expect(p.devops).toBeGreaterThan(0)
    expect(p.gestion).toBeGreaterThan(0)
    expect(p.personas).toBeCloseTo(p.devs + p.qa + p.devops + p.gestion, 10)
  })

  it('un alcance vacío no explota', () => {
    const r = plan({})
    expect(r.rutaCriticaMeses).toBe(0)
    expect(r.frontera).toEqual([])
    expect(r.recomendado.personas).toBe(0)
  })

  it('ignora los componentes sin esfuerzo asignado', () => {
    const r = plan({ core: 12 })
    expect(r.recomendado.dotacion.map((d) => d.componenteId)).toEqual(['core'])
  })
})
