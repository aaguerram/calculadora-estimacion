import { useCallback, useEffect, useMemo, useReducer } from 'react'

import type { CoeficientesModelo } from '@/entities/estimation-model'
import {
  aplicarCoeficientes,
  ejecutarBacktest,
  eliminarHistorico,
  listarHistoricos,
  proponerCalibracion,
} from '@/entities/historical-project'
import type { Backtest, Estimador, ProyectoHistorico } from '@/entities/historical-project'
import { ErrorPostgrest } from '@/shared/api'

import { aFilaCoeficiente, simularCambios } from './aplicar-propuesta'
import type { CambioCoeficiente } from './aplicar-propuesta'
import { refinarCambios } from './refinar'

interface CalibrationState {
  estado: 'cargando' | 'listo' | 'error'
  historicos: ProyectoHistorico[]
  guardando: boolean
  error: string | null
  aplicado: boolean
}

type CalibrationIntent =
  | { type: 'cargaIniciada' }
  | { type: 'cargaResuelta'; historicos: ProyectoHistorico[] }
  | { type: 'cargaFallida'; error: string }
  | { type: 'guardadoIniciado' }
  | { type: 'guardadoResuelto' }
  | { type: 'guardadoFallido'; error: string }
  | { type: 'avisoCerrado' }

const inicial: CalibrationState = {
  estado: 'cargando',
  historicos: [],
  guardando: false,
  error: null,
  aplicado: false,
}

function reducer(state: CalibrationState, intent: CalibrationIntent): CalibrationState {
  switch (intent.type) {
    case 'cargaIniciada':
      return { ...state, estado: 'cargando', error: null }
    case 'cargaResuelta':
      return { ...state, estado: 'listo', historicos: intent.historicos, guardando: false }
    case 'cargaFallida':
      return { ...state, estado: 'error', guardando: false, error: intent.error }
    case 'guardadoIniciado':
      return { ...state, guardando: true, error: null, aplicado: false }
    case 'guardadoResuelto':
      return { ...state, guardando: false, aplicado: true }
    case 'guardadoFallido':
      return { ...state, guardando: false, error: intent.error }
    case 'avisoCerrado':
      return { ...state, error: null, aplicado: false }
    default:
      return state
  }
}

function mensajeDeError(error: unknown): string {
  if (error instanceof ErrorPostgrest) {
    if (error.estado === 401) return 'Falta el token o caducó.'
    if (error.estado === 403)
      return 'Escribir coeficientes exige el rol `calibrador`. Genera el token con: npm run token:env -- --role calibrador'
    return `${error.estado}: ${error.message}`
  }
  return error instanceof Error ? error.message : 'Error desconocido'
}

export interface Calibracion {
  state: CalibrationState
  /** Backtest con los coeficientes VIGENTES. */
  antes: Backtest
  /** El mismo backtest con la propuesta aplicada. Es la validación de la calibración. */
  despues: Backtest
  cambios: CambioCoeficiente[]
  advertencias: string[]
  factorGlobal: number
  /** `false` si el refinamiento no logró anular el sesgo residual. */
  convergio: boolean
  /** La propuesta solo se puede aplicar si de verdad mejora el MMRE. */
  mejora: boolean
  aplicar: () => Promise<void>
  descartar: (id: string) => Promise<void>
  recargar: () => Promise<void>
  cerrarAviso: () => void
}

/**
 * Calibra el modelo contra el historico de proyectos cerrados.
 *
 * `construirEstimador` llega INYECTADO desde la capa de composicion: el motor
 * vive en otro slice de la misma capa y no se puede importar aqui. Ademas
 * permite re-hacer el backtest con los coeficientes propuestos, que es lo que
 * convierte esto en calibracion y no en un ajuste a ojo.
 */
export function useCalibration(
  coeficientes: CoeficientesModelo,
  construirEstimador: (coeficientes: CoeficientesModelo) => Estimador,
): Calibracion {
  const [state, dispatch] = useReducer(reducer, inicial)

  const recargar = useCallback(async (signal?: AbortSignal) => {
    dispatch({ type: 'cargaIniciada' })
    try {
      const historicos = await listarHistoricos(signal)
      if (!signal?.aborted) dispatch({ type: 'cargaResuelta', historicos })
    } catch (error) {
      if (!signal?.aborted) dispatch({ type: 'cargaFallida', error: mensajeDeError(error) })
    }
  }, [])

  useEffect(() => {
    const control = new AbortController()
    void recargar(control.signal)
    return () => control.abort()
  }, [recargar])

  const antes = useMemo(
    () => ejecutarBacktest(state.historicos, construirEstimador(coeficientes)),
    [state.historicos, coeficientes, construirEstimador],
  )

  const propuesta = useMemo(
    () => proponerCalibracion(antes.errores, antes.observaciones),
    [antes],
  )

  // Se refina iterando: los ajustes interactuan y una sola pasada deja sesgo.
  const { cambios, convergio } = useMemo(
    () =>
      refinarCambios(coeficientes, propuesta, (candidatos) =>
        ejecutarBacktest(state.historicos, construirEstimador(candidatos)).errores,
      ),
    [coeficientes, propuesta, state.historicos, construirEstimador],
  )

  const despues = useMemo(
    () =>
      ejecutarBacktest(
        state.historicos,
        construirEstimador(simularCambios(coeficientes, cambios)),
      ),
    [state.historicos, coeficientes, cambios, construirEstimador],
  )

  // Regla dura: una calibración que no baja el MMRE no se aplica.
  const mejora =
    cambios.length > 0 &&
    antes.metricas.n >= 3 &&
    Number.isFinite(despues.metricas.mmre) &&
    despues.metricas.mmre < antes.metricas.mmre

  const aplicar = useCallback(async () => {
    if (!mejora) return
    dispatch({ type: 'guardadoIniciado' })
    try {
      await aplicarCoeficientes(
        cambios.map((c) => aFilaCoeficiente(c, antes.metricas.n)),
      )
      dispatch({ type: 'guardadoResuelto' })
    } catch (error) {
      dispatch({ type: 'guardadoFallido', error: mensajeDeError(error) })
    }
  }, [cambios, mejora, antes.metricas.n])

  const descartar = useCallback(
    async (id: string) => {
      dispatch({ type: 'guardadoIniciado' })
      try {
        await eliminarHistorico(id)
        await recargar()
      } catch (error) {
        dispatch({ type: 'guardadoFallido', error: mensajeDeError(error) })
      }
    },
    [recargar],
  )

  return {
    state,
    antes,
    despues,
    cambios,
    advertencias: convergio
      ? propuesta.advertencias
      : [
          ...propuesta.advertencias,
          'El refinamiento no llegó a anular el sesgo residual: revisa el histórico antes de aplicar.',
        ],
    factorGlobal: propuesta.factorGlobal,
    convergio,
    mejora,
    aplicar,
    descartar,
    recargar: useCallback(() => recargar(), [recargar]),
    cerrarAviso: useCallback(() => dispatch({ type: 'avisoCerrado' }), []),
  }
}
