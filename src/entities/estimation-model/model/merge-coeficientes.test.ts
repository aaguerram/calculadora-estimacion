import { describe, expect, it } from 'vitest'

import { COEFICIENTES_POR_DEFECTO } from '../config/defaults'

import { fundirCoeficientes } from './merge-coeficientes'

describe('fundirCoeficientes', () => {
  it('sin calibraciones devuelve las semillas', () => {
    const { coeficientes, clavesDesconocidas } = fundirCoeficientes([])
    expect(coeficientes).toEqual(COEFICIENTES_POR_DEFECTO)
    expect(clavesDesconocidas).toEqual([])
  })

  it('sobreescribe solo las claves presentes', () => {
    const { coeficientes } = fundirCoeficientes([{ clave: 'base.micro-core', valor: 72 }])
    expect(coeficientes.base['micro-core']).toBe(72)
    expect(coeficientes.base.bff).toBe(COEFICIENTES_POR_DEFECTO.base.bff)
  })

  it('no muta las semillas', () => {
    const antes = COEFICIENTES_POR_DEFECTO.base['micro-core']
    fundirCoeficientes([{ clave: 'base.micro-core', valor: 999 }])
    expect(COEFICIENTES_POR_DEFECTO.base['micro-core']).toBe(antes)
  })

  it('reconoce todas las familias de claves', () => {
    const { coeficientes, clavesDesconocidas } = fundirCoeficientes([
      { clave: 'cap.monolito-netfx', valor: 1 },
      { clave: 'bootstrap.bff', valor: 30 },
      { clave: 'complejidad.ma', valor: 3 },
      { clave: 'stack.netfx', valor: 1.5 },
      { clave: 'integracion.a', valor: 60 },
      { clave: 'integracion.externa', valor: 1.6 },
      { clave: 'integracion.sin-sandbox', valor: 1.4 },
      { clave: 'integracion.uso-extra', valor: 0.3 },
      { clave: 'overhead.qa', valor: 0.3 },
      { clave: 'overhead.documentacion', valor: 0.07 },
      { clave: 'equipo.gamma', valor: 0.03 },
      { clave: 'equipo.delta', valor: 0.002 },
      { clave: 'equipo.onboarding', valor: 0.5 },
      { clave: 'riesgo.sigma-comun', valor: 0.22 },
      { clave: 'jornada.horas-dia', valor: 6 },
    ])
    expect(clavesDesconocidas).toEqual([])
    expect(coeficientes.cap['monolito-netfx']).toBe(1)
    expect(coeficientes.integracion.recargoExterna).toBe(1.6)
    expect(coeficientes.overhead.qa).toBe(0.3)
    expect(coeficientes.equipo.delta).toBe(0.002)
    expect(coeficientes.riesgo.sigmaComun).toBe(0.22)
  })

  it('reporta claves desconocidas en vez de tragárselas', () => {
    const { clavesDesconocidas } = fundirCoeficientes([
      { clave: 'base.componente-inventado', valor: 10 },
      { clave: 'grupo.raro', valor: 1 },
      { clave: 'sin-punto', valor: 1 },
    ])
    expect(clavesDesconocidas).toEqual([
      'base.componente-inventado',
      'grupo.raro',
      'sin-punto',
    ])
  })

  it('rechaza valores no finitos', () => {
    const { coeficientes, clavesDesconocidas } = fundirCoeficientes([
      { clave: 'base.bff', valor: Number.NaN },
    ])
    expect(clavesDesconocidas).toEqual(['base.bff'])
    expect(coeficientes.base.bff).toBe(COEFICIENTES_POR_DEFECTO.base.bff)
  })
})
