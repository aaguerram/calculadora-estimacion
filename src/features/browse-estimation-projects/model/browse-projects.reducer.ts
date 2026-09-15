import type { EstimationProject } from '@/entities/estimation-project'

export interface BrowseProjectsState {
  estado: 'inactivo' | 'cargando' | 'listo' | 'error'
  proyectos: EstimationProject[]
  error: string | null
}

export type BrowseProjectsIntent =
  | { type: 'cargaIniciada' }
  | { type: 'cargaResuelta'; proyectos: EstimationProject[] }
  | { type: 'cargaFallida'; error: string }
  | { type: 'reiniciado' }

export const initialBrowseProjectsState: BrowseProjectsState = {
  estado: 'inactivo',
  proyectos: [],
  error: null,
}

export function browseProjectsReducer(
  state: BrowseProjectsState,
  intent: BrowseProjectsIntent,
): BrowseProjectsState {
  switch (intent.type) {
    case 'cargaIniciada':
      return { ...state, estado: 'cargando', error: null }
    case 'cargaResuelta':
      return { estado: 'listo', proyectos: intent.proyectos, error: null }
    case 'cargaFallida':
      return { ...state, estado: 'error', error: intent.error }
    case 'reiniciado':
      return initialBrowseProjectsState
    default:
      return state
  }
}
