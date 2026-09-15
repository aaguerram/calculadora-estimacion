import { useCallback, useEffect, useMemo, useReducer } from 'react'

import { COEFICIENTES_POR_DEFECTO, cargarCoeficientes } from '@/entities/estimation-model'
import type { CoeficientesModelo } from '@/entities/estimation-model'
import { CATALOGO_VACIO } from '@/entities/feature-catalog'
import type { Catalogo } from '@/entities/feature-catalog'

import { ejecutarEstimacion } from './run-estimation'
import type { Alcance, Estimacion } from './types'

interface EstadoCoeficientes {
  estado: 'cargando' | 'listo' | 'semilla'
  coeficientes: CoeficientesModelo
  clavesDesconocidas: string[]
  aviso: string | null
}

type IntentCoeficientes =
  | { type: 'cargaIniciada' }
  | { type: 'cargaResuelta'; coeficientes: CoeficientesModelo; clavesDesconocidas: string[] }
  | { type: 'cargaFallida'; aviso: string }

const inicial: EstadoCoeficientes = {
  estado: 'cargando',
  coeficientes: COEFICIENTES_POR_DEFECTO,
  clavesDesconocidas: [],
  aviso: null,
}

function reducer(state: EstadoCoeficientes, intent: IntentCoeficientes): EstadoCoeficientes {
  switch (intent.type) {
    case 'cargaIniciada':
      return { ...state, estado: 'cargando', aviso: null }
    case 'cargaResuelta':
      return {
        estado: 'listo',
        coeficientes: intent.coeficientes,
        clavesDesconocidas: intent.clavesDesconocidas,
        aviso: null,
      }
    case 'cargaFallida':
      // Degradado consciente: el motor sigue funcionando con las semillas.
      return { ...inicial, estado: 'semilla', aviso: intent.aviso }
    default:
      return state
  }
}

/**
 * Carga los coeficientes calibrados desde Postgres y ejecuta el motor.
 * El calculo en si es puro: este hook solo aporta la red.
 */
export function useEstimation(alcance: Alcance, catalogo: Catalogo = CATALOGO_VACIO) {
  const [state, dispatch] = useReducer(reducer, inicial)

  const recargar = useCallback(async (signal?: AbortSignal) => {
    dispatch({ type: 'cargaIniciada' })
    try {
      const { coeficientes, clavesDesconocidas } = await cargarCoeficientes(signal)
      if (!signal?.aborted) dispatch({ type: 'cargaResuelta', coeficientes, clavesDesconocidas })
    } catch (error) {
      if (signal?.aborted) return
      const detalle = error instanceof Error ? error.message : 'error desconocido'
      dispatch({
        type: 'cargaFallida',
        aviso: `No se pudieron leer los coeficientes calibrados (${detalle}). Se usan los valores semilla.`,
      })
    }
  }, [])

  useEffect(() => {
    const control = new AbortController()
    void recargar(control.signal)
    return () => control.abort()
  }, [recargar])

  const estimacion: Estimacion = useMemo(
    () => ejecutarEstimacion(alcance, { coeficientes: state.coeficientes, catalogo }),
    [alcance, state.coeficientes, catalogo],
  )

  return { estimacion, coeficientes: state, recargar }
}
