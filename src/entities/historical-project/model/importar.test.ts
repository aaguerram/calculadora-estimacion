import { describe, expect, it } from 'vitest'

import {
  EJEMPLO_IMPORTACION,
  alcanceUtilizable,
  parsearHistoricos,
} from './importar'

const valido = {
  nombre: 'Portal v1',
  cerradoEn: '2025-03-31',
  mhEstimadas: 48.5,
  mhReales: 61.2,
  mesesReales: 7.5,
  personasReales: 8,
}

const alcance = {
  nombre: 'Portal v1',
  jornada: { horasDia: 6, diasMes: 20 },
  nivelCompromiso: 80,
  componentes: [{ id: 'c', nombre: 'Core', tipo: 'micro-core', stack: 'net8', esNuevo: false }],
  features: [{ id: 'f', nombre: 'F', complejidad: 'm', categoria: null, toca: [{ componenteId: 'c' }], elementos: [] }],
  integraciones: [],
  drivers: [],
}

const json = (v: unknown) => JSON.stringify(v)

describe('parsearHistoricos', () => {
  it('nunca lanza: un JSON roto devuelve el motivo', () => {
    const r = parsearHistoricos('{esto no es json')
    expect(r.validos).toEqual([])
    expect(r.errores[0].campo).toBe('json')
  })

  it('acepta un objeto suelto además de una lista', () => {
    expect(parsearHistoricos(json(valido)).validos).toHaveLength(1)
    expect(parsearHistoricos(json([valido])).validos).toHaveLength(1)
  })

  it('una lista vacía es un error explícito, no un éxito silencioso', () => {
    expect(parsearHistoricos('[]').errores[0].motivo).toContain('vacía')
  })

  it('marca como NO calibrable un cierre sin alcance', () => {
    const [f] = parsearHistoricos(json([valido])).validos
    expect(f.calibra).toBe(false)
  })

  it('marca como calibrable un cierre con alcance utilizable', () => {
    const [f] = parsearHistoricos(json([{ ...valido, alcance }])).validos
    expect(f.calibra).toBe(true)
    expect(f.cierre.alcance).toEqual(alcance)
  })

  it('rechaza un alcance que no serviría para recalibrar', () => {
    const r = parsearHistoricos(json([{ ...valido, alcance: { componentes: [], features: [] } }]))
    expect(r.validos).toEqual([])
    expect(r.errores[0].campo).toBe('alcance')
    expect(r.errores[0].motivo).toContain('componente')
  })

  it('exige la fecha en formato AAAA-MM-DD', () => {
    const r = parsearHistoricos(json([{ ...valido, cerradoEn: '31/03/2025' }]))
    expect(r.errores[0]).toMatchObject({ fila: 1, campo: 'cerradoEn' })
  })

  it('exige nombre con sustancia', () => {
    expect(parsearHistoricos(json([{ ...valido, nombre: 'ab' }])).errores[0].campo).toBe('nombre')
  })

  it('rechaza cifras que no son números o no son positivas', () => {
    const r = parsearHistoricos(json([{ ...valido, mhReales: 'mucho' }, { ...valido, mesesReales: 0 }]))
    expect(r.errores.map((e) => `${e.fila}:${e.campo}`)).toEqual(['1:mhReales', '2:mesesReales'])
  })

  it('acepta decimales con coma, que es como salen de una hoja de cálculo', () => {
    const [f] = parsearHistoricos(json([{ ...valido, mhReales: '61,2' }])).validos
    expect(f.cierre.mhReales).toBeCloseTo(61.2, 10)
  })

  it('reporta la fila exacta de cada problema', () => {
    const r = parsearHistoricos(json([valido, { ...valido, nombre: '' }, valido]))
    expect(r.validos.map((v) => v.fila)).toEqual([1, 3])
    expect(r.errores[0].fila).toBe(2)
  })

  it('no acumula varios errores del mismo campo en una fila', () => {
    const r = parsearHistoricos(json([{ nombre: 'ab' }]))
    const campos = r.errores.filter((e) => e.fila === 1).map((e) => e.campo)
    expect(new Set(campos).size).toBe(campos.length)
  })

  it('el ejemplo que se le muestra al usuario es válido', () => {
    const r = parsearHistoricos(EJEMPLO_IMPORTACION)
    expect(r.errores).toEqual([])
    expect(r.validos).toHaveLength(1)
    expect(r.validos[0].calibra).toBe(true)
  })
})

describe('alcanceUtilizable', () => {
  it('exige al menos un componente y una feature', () => {
    expect(alcanceUtilizable(alcance)).toBe(true)
    expect(alcanceUtilizable({ componentes: [], features: [{}] })).toBe(false)
    expect(alcanceUtilizable({ componentes: [{}], features: [] })).toBe(false)
  })

  it('rechaza lo que no es un objeto', () => {
    for (const v of [null, undefined, 'x', 3, []]) expect(alcanceUtilizable(v)).toBe(false)
  })
})
