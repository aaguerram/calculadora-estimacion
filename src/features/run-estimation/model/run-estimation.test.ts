import { COEFICIENTES_POR_DEFECTO } from '@/entities/estimation-model'
import { describe, expect, it } from 'vitest'

import { ALCANCE_DEMO } from '../config/alcance-demo'

import { ejecutarEstimacion } from './run-estimation'
import type { Alcance } from './types'

const OPCIONES = { iteraciones: 4000 }

describe('ejecutarEstimacion — integración sobre el alcance de referencia', () => {
  const estimacion = ejecutarEstimacion(ALCANCE_DEMO, OPCIONES)

  it('es determinista: misma semilla, misma estimación', () => {
    const otra = ejecutarEstimacion(ALCANCE_DEMO, OPCIONES)
    expect(otra).toEqual(estimacion)
  })

  it('cambia con otra semilla', () => {
    const otra = ejecutarEstimacion(ALCANCE_DEMO, { ...OPCIONES, semilla: 1 })
    expect(otra.riesgo.totalMesesHombre).not.toBe(estimacion.riesgo.totalMesesHombre)
  })

  it('produce un esfuerzo del orden esperado para 12 features y 7 componentes', () => {
    expect(estimacion.riesgo.totalMesesHombre).toBeGreaterThan(60)
    expect(estimacion.riesgo.totalMesesHombre).toBeLessThan(140)
  })

  it('1 mes-hombre son 120 h con jornada de 6 h × 20 días', () => {
    expect(estimacion.horasPorMesHombre).toBe(120)
    expect(estimacion.riesgo.totalMesesHombre).toBeCloseTo(
      estimacion.riesgo.totalHoras / 120,
      6,
    )
  })

  it('responde las tres preguntas: esfuerzo, personas y meses', () => {
    expect(estimacion.riesgo.totalMesesHombre).toBeGreaterThan(0)
    expect(estimacion.equipo.recomendado.personas).toBeGreaterThan(0)
    expect(estimacion.equipo.recomendado.duracionMeses).toBeGreaterThan(0)
  })

  it('el micro core marca la ruta crítica', () => {
    const critico = [...estimacion.equipo.streams].sort(
      (a, b) => b.duracionMinima - a.duracionMinima,
    )[0]
    expect(critico.componenteId).toBe('core')
    expect(estimacion.equipo.rutaCriticaMeses).toBeCloseTo(critico.duracionMinima, 10)
  })

  it('el monolito .NET Framework pesa más por hora que un micro equivalente', () => {
    const legacy = estimacion.esfuerzo.items.find((i) => i.id === 'f10::legacy')
    const core = estimacion.esfuerzo.items.find((i) => i.id === 'f10::core')
    // Misma feature, misma complejidad: el legacy cuesta más por stack y base.
    expect(legacy!.horasModal).toBeGreaterThan(core!.horasModal)
  })

  it('triangula con COCOMO II dentro de rango', () => {
    expect(estimacion.contraste.mesesNominales).toBeGreaterThan(0)
    expect(estimacion.contraste.dentroDeRango).toBe(true)
    expect(Math.abs(estimacion.contraste.desviacionDuracion)).toBeLessThan(0.4)
  })

  it('cada hora estimada es trazable hasta su par feature × componente', () => {
    const suma = estimacion.esfuerzo.items.reduce((t, i) => t + i.horasModal, 0)
    expect(suma).toBeCloseTo(estimacion.esfuerzo.devBrutoHoras, 6)
    expect(estimacion.esfuerzo.items.every((i) => i.concepto.length > 0)).toBe(true)
  })

  it('comprometer P90 cuesta más que P50', () => {
    const p50 = ejecutarEstimacion({ ...ALCANCE_DEMO, nivelCompromiso: 50 }, OPCIONES)
    const p90 = ejecutarEstimacion({ ...ALCANCE_DEMO, nivelCompromiso: 90 }, OPCIONES)
    expect(p50.riesgo.totalMesesHombre).toBeLessThan(estimacion.riesgo.totalMesesHombre)
    expect(p90.riesgo.totalMesesHombre).toBeGreaterThan(estimacion.riesgo.totalMesesHombre)
  })

  it('unos requisitos claros abaratan el proyecto', () => {
    const claro: Alcance = {
      ...ALCANCE_DEMO,
      drivers: ALCANCE_DEMO.drivers.map((d) =>
        d.clave === 'claridad-requisitos' ? { ...d, delta: -0.1 } : d,
      ),
    }
    expect(ejecutarEstimacion(claro, OPCIONES).riesgo.totalMesesHombre).toBeLessThan(
      estimacion.riesgo.totalMesesHombre,
    )
  })

  it('recomendar cuesta menos que correr, y correr no es gratis', () => {
    const { recomendado, masRapido } = estimacion.equipo
    expect(masRapido.duracionMeses).toBeLessThanOrEqual(recomendado.duracionMeses)
    expect(masRapido.mesesHombreFacturables).toBeGreaterThan(
      recomendado.mesesHombreFacturables,
    )
  })

  it('avisa del coste de acelerar y de los rendimientos negativos', () => {
    const claves = estimacion.alertas.map((a) => a.clave)
    expect(claves).toContain('coste-de-acelerar')
    expect(claves).toContain('rendimientos-negativos')
  })

  it('un alcance vacío devuelve una estimación vacía y una alerta crítica', () => {
    const vacio: Alcance = {
      ...ALCANCE_DEMO,
      features: [],
      integraciones: [],
      componentes: [],
    }
    const r = ejecutarEstimacion(vacio, OPCIONES)
    expect(r.riesgo.totalMesesHombre).toBe(0)
    expect(r.equipo.recomendado.personas).toBe(0)
    expect(r.alertas.map((a) => a.clave)).toContain('alcance-vacio')
  })

  it('usa los coeficientes que se le pasen, no los suyos', () => {
    const caro = {
      ...COEFICIENTES_POR_DEFECTO,
      base: { ...COEFICIENTES_POR_DEFECTO.base, 'micro-core': 200 },
    }
    const r = ejecutarEstimacion(ALCANCE_DEMO, { ...OPCIONES, coeficientes: caro })
    expect(r.riesgo.totalMesesHombre).toBeGreaterThan(estimacion.riesgo.totalMesesHombre)
  })
})
