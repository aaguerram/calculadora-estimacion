import { describe, expect, it } from 'vitest'

import { initialScopeState, scopeReducer } from './scope.reducer'
import type { ScopeState } from './scope.reducer'

const listo: ScopeState = {
  estado: 'listo',
  alcance: null,
  guardando: false,
  error: null,
}

describe('scopeReducer', () => {
  it('limpia el error al empezar una carga', () => {
    const conError: ScopeState = { ...listo, error: 'algo' }
    expect(scopeReducer(conError, { type: 'cargaIniciada' }).error).toBeNull()
  })

  it('una carga resuelta apaga el flag de guardado', () => {
    const guardando: ScopeState = { ...listo, guardando: true }
    const r = scopeReducer(guardando, { type: 'cargaResuelta', alcance: null })
    expect(r.guardando).toBe(false)
    expect(r.estado).toBe('listo')
  })

  it('un guardado fallido conserva el alcance ya cargado', () => {
    const r = scopeReducer(listo, { type: 'guardadoFallido', error: 'conflicto' })
    expect(r.estado).toBe('listo')
    expect(r.error).toBe('conflicto')
    expect(r.guardando).toBe(false)
  })

  it('una carga fallida no borra el alcance previo', () => {
    const conAlcance = { ...listo, alcance: { proyectoId: 'p1' } } as ScopeState
    const r = scopeReducer(conAlcance, { type: 'cargaFallida', error: 'red' })
    expect(r.alcance).toEqual({ proyectoId: 'p1' })
    expect(r.estado).toBe('error')
  })

  it('reiniciado vuelve al estado inicial', () => {
    expect(scopeReducer(listo, { type: 'reiniciado' })).toEqual(initialScopeState)
  })

  it('ignora intents desconocidos', () => {
    // @ts-expect-error se comprueba el comportamiento en runtime
    expect(scopeReducer(listo, { type: 'inventado' })).toBe(listo)
  })
})
