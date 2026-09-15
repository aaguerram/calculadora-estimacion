import { useCallback, useReducer } from 'react'

import { archivarProyecto } from '@/entities/historical-project'
import type { Alcance } from '@/entities/project-scope'
import { ErrorPostgrest } from '@/shared/api'

export interface ArchiveState {
  mhReales: number
  mesesReales: number
  personasReales: number
  cerradoEn: string
  enviando: boolean
  error: string | null
  archivado: string | null
}

export type ArchiveIntent =
  | { type: 'mhCambiadas'; valor: number }
  | { type: 'mesesCambiados'; valor: number }
  | { type: 'personasCambiadas'; valor: number }
  | { type: 'fechaCambiada'; valor: string }
  | { type: 'envioIniciado' }
  | { type: 'envioResuelto'; nombre: string }
  | { type: 'envioFallido'; error: string }
  | { type: 'avisoCerrado' }

export const initialArchiveState: ArchiveState = {
  mhReales: 0,
  mesesReales: 0,
  personasReales: 0,
  cerradoEn: new Date().toISOString().slice(0, 10),
  enviando: false,
  error: null,
  archivado: null,
}

/** Un proyecto sin cifras reales no sirve para calibrar: no se archiva. */
export function esArchivable(state: ArchiveState): boolean {
  return (
    !state.enviando &&
    state.mhReales > 0 &&
    state.mesesReales > 0 &&
    state.personasReales > 0 &&
    /^\d{4}-\d{2}-\d{2}$/.test(state.cerradoEn)
  )
}

export function archiveReducer(state: ArchiveState, intent: ArchiveIntent): ArchiveState {
  switch (intent.type) {
    case 'mhCambiadas':
      return { ...state, mhReales: intent.valor }
    case 'mesesCambiados':
      return { ...state, mesesReales: intent.valor }
    case 'personasCambiadas':
      return { ...state, personasReales: intent.valor }
    case 'fechaCambiada':
      return { ...state, cerradoEn: intent.valor }
    case 'envioIniciado':
      return { ...state, enviando: true, error: null, archivado: null }
    case 'envioResuelto':
      return { ...initialArchiveState, archivado: intent.nombre }
    case 'envioFallido':
      return { ...state, enviando: false, error: intent.error }
    case 'avisoCerrado':
      return { ...state, error: null, archivado: null }
    default:
      return state
  }
}

export function useArchiveProject(alcance: Alcance, mhEstimadas: number, alArchivar?: () => void) {
  const [state, dispatch] = useReducer(archiveReducer, initialArchiveState)

  const enviar = useCallback(async () => {
    if (!esArchivable(state)) return
    dispatch({ type: 'envioIniciado' })
    try {
      await archivarProyecto({
        nombre: alcance.nombre,
        cerradoEn: state.cerradoEn,
        mhEstimadas,
        mhReales: state.mhReales,
        mesesReales: state.mesesReales,
        personasReales: state.personasReales,
        // Foto inmutable: las tablas vivas seguiran cambiando, esto no.
        alcance,
      })
      dispatch({ type: 'envioResuelto', nombre: alcance.nombre })
      alArchivar?.()
    } catch (error) {
      const mensaje =
        error instanceof ErrorPostgrest
          ? error.estado === 403
            ? 'Archivar exige el rol `calibrador`.'
            : `${error.estado}: ${error.message}`
          : error instanceof Error
            ? error.message
            : 'Error desconocido'
      dispatch({ type: 'envioFallido', error: mensaje })
    }
  }, [state, alcance, mhEstimadas, alArchivar])

  return { state, dispatch, enviar }
}
