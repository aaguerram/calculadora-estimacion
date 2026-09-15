import { describe, expect, it } from 'vitest'

import {
  DESCRIPCION_PASOS,
  PASOS,
  indiceDe,
  initialWizardState,
  puedeIrA,
  wizardReducer,
} from './wizard.reducer'
import type { WizardState } from './wizard.reducer'

const conProyecto: WizardState = { paso: 'componentes', proyectoId: 'p1' }

describe('wizardReducer', () => {
  it('empieza en el paso del proyecto y sin proyecto', () => {
    expect(initialWizardState).toEqual({ paso: 'proyecto', proyectoId: null })
  })

  it('al crear el proyecto salta al siguiente paso', () => {
    const r = wizardReducer(initialWizardState, { type: 'proyectoCreado', proyectoId: 'p1' })
    expect(r).toEqual({ paso: 'componentes', proyectoId: 'p1' })
  })

  it('sin proyecto no deja avanzar: no habría dónde guardar', () => {
    expect(wizardReducer(initialWizardState, { type: 'siguiente' })).toBe(initialWizardState)
    expect(wizardReducer(initialWizardState, { type: 'irA', paso: 'drivers' })).toBe(
      initialWizardState,
    )
  })

  it('con proyecto se puede saltar a cualquier paso', () => {
    expect(wizardReducer(conProyecto, { type: 'irA', paso: 'revision' }).paso).toBe('revision')
  })

  it('avanza y retrocede sin salirse de los extremos', () => {
    let s: WizardState = { paso: 'revision', proyectoId: 'p1' }
    expect(wizardReducer(s, { type: 'siguiente' }).paso).toBe('revision')
    s = { paso: 'proyecto', proyectoId: null }
    expect(wizardReducer(s, { type: 'anterior' }).paso).toBe('proyecto')
  })

  it('recorre los seis pasos en orden', () => {
    let s: WizardState = { paso: 'proyecto', proyectoId: 'p1' }
    const recorrido = [s.paso]
    for (let i = 0; i < PASOS.length + 2; i++) {
      s = wizardReducer(s, { type: 'siguiente' })
      recorrido.push(s.paso)
    }
    expect([...new Set(recorrido)]).toEqual([...PASOS])
  })

  it('reiniciar vuelve al principio y olvida el proyecto', () => {
    expect(wizardReducer(conProyecto, { type: 'reiniciado' })).toEqual(initialWizardState)
  })

  it('ignora intents desconocidos', () => {
    // @ts-expect-error se comprueba el comportamiento en runtime
    expect(wizardReducer(conProyecto, { type: 'inventado' })).toBe(conProyecto)
  })
})

describe('catálogo de pasos', () => {
  it('cada paso tiene título, resumen y por qué importa', () => {
    for (const paso of PASOS) {
      const d = DESCRIPCION_PASOS[paso]
      expect(d.titulo.length).toBeGreaterThan(2)
      expect(d.resumen.length).toBeGreaterThan(10)
      expect(d.porQue.length).toBeGreaterThan(20)
    }
  })

  it('indiceDe respeta el orden declarado', () => {
    expect(indiceDe('proyecto')).toBe(0)
    expect(indiceDe('revision')).toBe(PASOS.length - 1)
  })

  it('puedeIrA solo abre el primer paso sin proyecto', () => {
    expect(puedeIrA(initialWizardState, 'proyecto')).toBe(true)
    expect(puedeIrA(initialWizardState, 'features')).toBe(false)
    expect(puedeIrA(conProyecto, 'features')).toBe(true)
  })
})
