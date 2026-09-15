import { useCallback, useEffect, useReducer } from 'react'

import {
  archivarProyecto,
  eliminarHistorico,
  listarHistoricos,
  parsearHistoricos,
} from '@/entities/historical-project'
import type { ProyectoHistorico, ResultadoImportacion } from '@/entities/historical-project'
import { ErrorPostgrest } from '@/shared/api'

export interface HistoricalState {
  estado: 'cargando' | 'listo' | 'error'
  historicos: ProyectoHistorico[]
  guardando: boolean
  error: string | null
  cargados: number
}

export type HistoricalIntent =
  | { type: 'cargaIniciada' }
  | { type: 'cargaResuelta'; historicos: ProyectoHistorico[] }
  | { type: 'cargaFallida'; error: string }
  | { type: 'guardadoIniciado' }
  | { type: 'guardadoResuelto'; cargados: number }
  | { type: 'guardadoFallido'; error: string }
  | { type: 'avisoCerrado' }

export const initialHistoricalState: HistoricalState = {
  estado: 'cargando',
  historicos: [],
  guardando: false,
  error: null,
  cargados: 0,
}

export function historicalReducer(
  state: HistoricalState,
  intent: HistoricalIntent,
): HistoricalState {
  switch (intent.type) {
    case 'cargaIniciada':
      return { ...state, estado: 'cargando', error: null }
    case 'cargaResuelta':
      return { ...state, estado: 'listo', historicos: intent.historicos, guardando: false }
    case 'cargaFallida':
      return { ...state, estado: 'error', guardando: false, error: intent.error }
    case 'guardadoIniciado':
      return { ...state, guardando: true, error: null, cargados: 0 }
    case 'guardadoResuelto':
      return { ...state, guardando: false, cargados: intent.cargados }
    case 'guardadoFallido':
      return { ...state, guardando: false, error: intent.error }
    case 'avisoCerrado':
      return { ...state, error: null, cargados: 0 }
    default:
      return state
  }
}

function mensaje(error: unknown): string {
  if (error instanceof ErrorPostgrest) {
    if (error.estado === 403) return 'Cargar histórico exige el rol `calibrador`.'
    if (error.codigo === '23505') return 'Ya existe un proyecto cerrado con ese nombre.'
    return `${error.estado}: ${error.message}`
  }
  return error instanceof Error ? error.message : 'Error desconocido'
}

export function useHistorical() {
  const [state, dispatch] = useReducer(historicalReducer, initialHistoricalState)

  const recargar = useCallback(async (signal?: AbortSignal) => {
    dispatch({ type: 'cargaIniciada' })
    try {
      const historicos = await listarHistoricos(signal)
      if (!signal?.aborted) dispatch({ type: 'cargaResuelta', historicos })
    } catch (error) {
      if (!signal?.aborted) dispatch({ type: 'cargaFallida', error: mensaje(error) })
    }
  }, [])

  useEffect(() => {
    const control = new AbortController()
    void recargar(control.signal)
    return () => control.abort()
  }, [recargar])

  /** Carga solo las filas válidas. Las que no lo son ya se le mostraron al usuario. */
  const importar = useCallback(
    async (resultado: ResultadoImportacion) => {
      if (resultado.validos.length === 0) return
      dispatch({ type: 'guardadoIniciado' })
      try {
        for (const fila of resultado.validos) await archivarProyecto(fila.cierre)
        dispatch({ type: 'guardadoResuelto', cargados: resultado.validos.length })
        await recargar()
      } catch (error) {
        dispatch({ type: 'guardadoFallido', error: mensaje(error) })
      }
    },
    [recargar],
  )

  const importarTexto = useCallback(
    async (texto: string) => importar(parsearHistoricos(texto)),
    [importar],
  )

  const borrar = useCallback(
    async (id: string) => {
      dispatch({ type: 'guardadoIniciado' })
      try {
        await eliminarHistorico(id)
        await recargar()
        dispatch({ type: 'guardadoResuelto', cargados: 0 })
      } catch (error) {
        dispatch({ type: 'guardadoFallido', error: mensaje(error) })
      }
    },
    [recargar],
  )

  return {
    state,
    importar,
    importarTexto,
    borrar,
    recargar: useCallback(() => recargar(), [recargar]),
    cerrarAviso: useCallback(() => dispatch({ type: 'avisoCerrado' }), []),
  }
}
