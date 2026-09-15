import { useCallback, useEffect, useReducer } from 'react'

import { listarFuentes } from '@/entities/benchmark-source'
import type { FuenteBenchmark } from '@/entities/benchmark-source'
import { ErrorPostgrest } from '@/shared/api'

interface Estado {
  estado: 'cargando' | 'listo' | 'error'
  fuentes: FuenteBenchmark[]
  error: string | null
}

type Intent =
  | { type: 'cargaIniciada' }
  | { type: 'cargaResuelta'; fuentes: FuenteBenchmark[] }
  | { type: 'cargaFallida'; error: string }

const inicial: Estado = { estado: 'cargando', fuentes: [], error: null }

export function fuentesReducer(state: Estado, intent: Intent): Estado {
  switch (intent.type) {
    case 'cargaIniciada':
      return { ...state, estado: 'cargando', error: null }
    case 'cargaResuelta':
      return { estado: 'listo', fuentes: intent.fuentes, error: null }
    case 'cargaFallida':
      return { ...state, estado: 'error', error: intent.error }
    default:
      return state
  }
}

export function useBenchmarkSources() {
  const [state, dispatch] = useReducer(fuentesReducer, inicial)

  const recargar = useCallback(async (signal?: AbortSignal) => {
    dispatch({ type: 'cargaIniciada' })
    try {
      const fuentes = await listarFuentes(signal)
      if (!signal?.aborted) dispatch({ type: 'cargaResuelta', fuentes })
    } catch (error) {
      if (signal?.aborted) return
      const mensaje =
        error instanceof ErrorPostgrest
          ? `${error.estado}: ${error.message}`
          : error instanceof Error
            ? error.message
            : 'Error desconocido'
      dispatch({ type: 'cargaFallida', error: mensaje })
    }
  }, [])

  useEffect(() => {
    const control = new AbortController()
    void recargar(control.signal)
    return () => control.abort()
  }, [recargar])

  return { state, recargar }
}
