import { COEFICIENTES_POR_DEFECTO } from '@/entities/estimation-model'
import { describe, expect, it } from 'vitest'

import { ALCANCE_DEMO } from '../config/alcance-demo'

import { contrastarConCocomo } from './detectar-alertas'
import { ejecutarEstimacion } from './run-estimation'
import type { Alcance, OpcionesEstimacion } from './types'

const OPCIONES: Partial<OpcionesEstimacion> = { iteraciones: 2000 }
const claves = (alcance: Alcance, opciones: Partial<OpcionesEstimacion> = OPCIONES) =>
  ejecutarEstimacion(alcance, opciones).alertas.map((a) => a.clave)

describe('contrastarConCocomo', () => {
  it('aplica TDEV = 3.67 × MH^0.32', () => {
    const r = contrastarConCocomo(100, 15)
    expect(r.mesesNominales).toBeCloseTo(3.67 * Math.pow(100, 0.32), 10)
    expect(r.personasNominales).toBeCloseTo(100 / r.mesesNominales, 10)
  })

  it('marca la zona imposible por debajo del 75 % del nominal', () => {
    const nominal = 3.67 * Math.pow(100, 0.32)
    expect(contrastarConCocomo(100, nominal * 0.74).dentroDeRango).toBe(false)
    expect(contrastarConCocomo(100, nominal * 0.76).dentroDeRango).toBe(true)
  })

  it('no explota con esfuerzo cero', () => {
    expect(contrastarConCocomo(0, 0).dentroDeRango).toBe(true)
  })
})

describe('detectarAlertas', () => {
  it('avisa cuando las integraciones dominan el esfuerzo', () => {
    const alcance: Alcance = {
      ...ALCANCE_DEMO,
      features: ALCANCE_DEMO.features.slice(0, 1),
      integraciones: ALCANCE_DEMO.integraciones.map((i) => ({
        ...i,
        complejidad: 'ma',
        usos: 10,
      })),
    }
    expect(claves(alcance)).toContain('integraciones-dominantes')
  })

  it('avisa si el QA presupuestado es menor al 15 %', () => {
    const coeficientes = {
      ...COEFICIENTES_POR_DEFECTO,
      overhead: { ...COEFICIENTES_POR_DEFECTO.overhead, qa: 0.05 },
    }
    expect(claves(ALCANCE_DEMO, { ...OPCIONES, coeficientes })).toContain('qa-insuficiente')
  })

  it('avisa si la banda de confianza es demasiado estrecha', () => {
    const coeficientes = {
      ...COEFICIENTES_POR_DEFECTO,
      riesgo: { ...COEFICIENTES_POR_DEFECTO.riesgo, sigmaComun: 0 },
    }
    expect(claves(ALCANCE_DEMO, { ...OPCIONES, coeficientes })).toContain('banda-estrecha')
  })

  it('no avisa de banda estrecha con el riesgo común por defecto', () => {
    expect(claves(ALCANCE_DEMO)).not.toContain('banda-estrecha')
  })

  it('sospecha de una feature muy alta que no toca ninguna integración', () => {
    const alcance: Alcance = {
      ...ALCANCE_DEMO,
      features: [
        {
          id: 'rara',
          nombre: 'Feature sospechosa',
          complejidad: 'ma',
          categoria: null, elementos: [], toca: [{ componenteId: 'web' }],
        },
      ],
      integraciones: [],
    }
    expect(claves(alcance)).toContain('complejidad-sospechosa:rara')
  })

  it('avisa cuando un stream topado marca la ruta crítica', () => {
    const alcance: Alcance = {
      ...ALCANCE_DEMO,
      componentes: ALCANCE_DEMO.componentes.map((c) =>
        c.id === 'core' ? { ...c, capDevs: 1 } : c,
      ),
    }
    expect(claves(alcance).some((c) => c.startsWith('stream-topado:core'))).toBe(true)
  })

  it('detecta desequilibrio front/back', () => {
    const alcance: Alcance = {
      ...ALCANCE_DEMO,
      features: ALCANCE_DEMO.features.map((f) => ({
        ...f,
        toca: f.toca.filter((t) => t.componenteId !== 'web'),
      })),
    }
    expect(claves(alcance)).toContain('desequilibrio-front-back')
  })

  it('un alcance sano no dispara alertas críticas', () => {
    const criticas = ejecutarEstimacion(ALCANCE_DEMO, OPCIONES).alertas.filter(
      (a) => a.nivel === 'critico',
    )
    expect(criticas).toEqual([])
  })
})
