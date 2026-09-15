import type { AlcanceDeProyecto } from '@/entities/project-scope'

export interface ScopeState {
  estado: 'inactivo' | 'cargando' | 'listo' | 'error'
  alcance: AlcanceDeProyecto | null
  guardando: boolean
  error: string | null
}

export type ScopeIntent =
  | { type: 'cargaIniciada' }
  | { type: 'cargaResuelta'; alcance: AlcanceDeProyecto | null }
  | { type: 'cargaFallida'; error: string }
  | { type: 'guardadoIniciado' }
  | { type: 'guardadoTerminado' }
  | { type: 'guardadoFallido'; error: string }
  | { type: 'errorCerrado' }
  | { type: 'reiniciado' }

export const initialScopeState: ScopeState = {
  estado: 'inactivo',
  alcance: null,
  guardando: false,
  error: null,
}

export function scopeReducer(state: ScopeState, intent: ScopeIntent): ScopeState {
  switch (intent.type) {
    case 'cargaIniciada':
      return { ...state, estado: 'cargando', error: null }
    case 'cargaResuelta':
      return { estado: 'listo', alcance: intent.alcance, guardando: false, error: null }
    case 'cargaFallida':
      return { ...state, estado: 'error', guardando: false, error: intent.error }
    case 'guardadoIniciado':
      return { ...state, guardando: true, error: null }
    case 'guardadoTerminado':
      return { ...state, guardando: false }
    case 'guardadoFallido':
      return { ...state, guardando: false, error: intent.error }
    case 'errorCerrado':
      return { ...state, error: null }
    case 'reiniciado':
      return initialScopeState
    default:
      return state
  }
}
