import { useCallback, useReducer } from 'react'

import { crearProyecto } from '@/entities/estimation-project'
import { ErrorPostgrest } from '@/shared/api'

import {
  createProjectReducer,
  esEnviable,
  initialCreateProjectState,
} from './create-project.reducer'

function mensajeDeError(error: unknown): string {
  if (error instanceof ErrorPostgrest) {
    if (error.estado === 401) return 'Falta el token o caducó.'
    if (error.estado === 403) return 'El token no puede escribir en esta tabla.'
    if (error.codigo === '23514') return 'Un valor está fuera del rango permitido por la base.'
    if (error.codigo === '23505') return 'Ya existe un proyecto con ese nombre.'
    return `${error.estado}: ${error.message}`
  }
  return error instanceof Error ? error.message : 'Error desconocido'
}

export function useCreateEstimationProject(
  alCrear?: () => void,
  alCrearConId?: (proyectoId: string) => void,
) {
  const [state, dispatch] = useReducer(createProjectReducer, initialCreateProjectState)

  const enviar = useCallback(async () => {
    if (!esEnviable(state)) return
    dispatch({ type: 'envioIniciado' })
    try {
      const creado = await crearProyecto({
        nombre: state.nombre,
        cliente: state.cliente,
        horasDia: state.horasDia,
        diasMes: state.diasMes,
        nivelCompromiso: state.nivelCompromiso,
      })
      dispatch({ type: 'envioResuelto', nombre: creado.nombre })
      alCrear?.()
      alCrearConId?.(creado.id)
    } catch (error) {
      dispatch({ type: 'envioFallido', error: mensajeDeError(error) })
    }
  }, [state, alCrear, alCrearConId])

  return { state, dispatch, enviar }
}
