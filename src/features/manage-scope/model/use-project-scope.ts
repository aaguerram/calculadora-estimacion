import { useCallback, useEffect, useReducer } from 'react'

import { cargarAlcance } from '@/entities/project-scope'
import { ErrorPostgrest } from '@/shared/api'

import { initialScopeState, scopeReducer } from './scope.reducer'

function mensajeDeError(error: unknown): string {
  if (error instanceof ErrorPostgrest) {
    if (error.estado === 401) return 'Falta el token o caducó.'
    if (error.estado === 403) return 'El token no tiene permisos para esta operación.'
    if (error.codigo === '23505') return 'Ya existe un elemento con ese nombre en el proyecto.'
    if (error.codigo === '23514') return 'Un valor está fuera del rango que permite la base.'
    if (error.codigo === '23503') return 'Falta una referencia: revisa el componente asociado.'
    return `${error.estado}: ${error.message}`
  }
  return error instanceof Error ? error.message : 'Error desconocido'
}

/**
 * Carga el alcance de un proyecto y aplica mutaciones contra PostgREST.
 *
 * `mutar` centraliza el ciclo escribir → recargar → traducir el error, para que
 * cada editor no repita ese patron. La recarga completa es intencional: la fuente
 * de verdad es Postgres, no un estado local que podria divergir.
 */
export function useProjectScope(proyectoId: string | null) {
  const [state, dispatch] = useReducer(scopeReducer, initialScopeState)

  const recargar = useCallback(
    async (signal?: AbortSignal) => {
      if (!proyectoId) {
        dispatch({ type: 'reiniciado' })
        return
      }
      dispatch({ type: 'cargaIniciada' })
      try {
        const alcance = await cargarAlcance(proyectoId, signal)
        if (!signal?.aborted) dispatch({ type: 'cargaResuelta', alcance })
      } catch (error) {
        if (!signal?.aborted) dispatch({ type: 'cargaFallida', error: mensajeDeError(error) })
      }
    },
    [proyectoId],
  )

  useEffect(() => {
    const control = new AbortController()
    void recargar(control.signal)
    return () => control.abort()
  }, [recargar])

  const mutar = useCallback(
    async (accion: () => Promise<void>) => {
      dispatch({ type: 'guardadoIniciado' })
      try {
        await accion()
        await recargar()
        dispatch({ type: 'guardadoTerminado' })
      } catch (error) {
        dispatch({ type: 'guardadoFallido', error: mensajeDeError(error) })
      }
    },
    [recargar],
  )

  const cerrarError = useCallback(() => dispatch({ type: 'errorCerrado' }), [])

  return { state, mutar, recargar, cerrarError }
}
