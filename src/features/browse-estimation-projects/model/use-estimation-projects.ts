import { useCallback, useEffect, useReducer } from 'react'

import { listarProyectos } from '@/entities/estimation-project'
import { ErrorPostgrest } from '@/shared/api'

import {
  browseProjectsReducer,
  initialBrowseProjectsState,
} from './browse-projects.reducer'

function mensajeDeError(error: unknown): string {
  if (error instanceof ErrorPostgrest) {
    if (error.estado === 401) return 'Falta el token o caducó. Genera uno con `npm run token`.'
    if (error.estado === 403) return 'El token no tiene permisos sobre esta tabla.'
    return `${error.estado}: ${error.message}`
  }
  if (error instanceof Error) return `No se pudo contactar a PostgREST: ${error.message}`
  return 'Error desconocido'
}

/**
 * El reducer es puro; este hook es el unico que toca la red y el reloj.
 * `activo` evita disparar la carga cuando todavia no hay token.
 */
export function useEstimationProjects(activo: boolean) {
  const [state, dispatch] = useReducer(browseProjectsReducer, initialBrowseProjectsState)

  const recargar = useCallback(
    async (signal?: AbortSignal) => {
      dispatch({ type: 'cargaIniciada' })
      try {
        const proyectos = await listarProyectos(signal)
        if (!signal?.aborted) dispatch({ type: 'cargaResuelta', proyectos })
      } catch (error) {
        if (!signal?.aborted) dispatch({ type: 'cargaFallida', error: mensajeDeError(error) })
      }
    },
    [],
  )

  useEffect(() => {
    if (!activo) {
      dispatch({ type: 'reiniciado' })
      return
    }
    const control = new AbortController()
    void recargar(control.signal)
    return () => control.abort()
  }, [activo, recargar])

  return { state, recargar }
}
