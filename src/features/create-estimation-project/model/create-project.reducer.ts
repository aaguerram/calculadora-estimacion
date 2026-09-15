import type { NivelCompromiso } from '@/entities/estimation-project'

export interface CreateProjectState {
  nombre: string
  cliente: string
  horasDia: number
  diasMes: number
  nivelCompromiso: NivelCompromiso
  enviando: boolean
  error: string | null
  ultimoCreado: string | null
}

export type CreateProjectIntent =
  | { type: 'nombreCambiado'; valor: string }
  | { type: 'clienteCambiado'; valor: string }
  | { type: 'horasDiaCambiadas'; valor: number }
  | { type: 'diasMesCambiados'; valor: number }
  | { type: 'compromisoCambiado'; valor: NivelCompromiso }
  | { type: 'envioIniciado' }
  | { type: 'envioResuelto'; nombre: string }
  | { type: 'envioFallido'; error: string }
  | { type: 'avisoCerrado' }

export const initialCreateProjectState: CreateProjectState = {
  nombre: '',
  cliente: '',
  horasDia: 6,
  diasMes: 20,
  nivelCompromiso: 80,
  enviando: false,
  error: null,
  ultimoCreado: null,
}

/** Regla de negocio del formulario, aislada de React y del DOM. */
export function esEnviable(state: CreateProjectState): boolean {
  return (
    !state.enviando &&
    state.nombre.trim().length >= 3 &&
    state.horasDia > 0 &&
    state.horasDia <= 12 &&
    state.diasMes >= 1 &&
    state.diasMes <= 31
  )
}

/** Horas de un mes-hombre segun la jornada capturada. */
export function horasMesHombre(state: CreateProjectState): number {
  return state.horasDia * state.diasMes
}

export function createProjectReducer(
  state: CreateProjectState,
  intent: CreateProjectIntent,
): CreateProjectState {
  switch (intent.type) {
    case 'nombreCambiado':
      return { ...state, nombre: intent.valor }
    case 'clienteCambiado':
      return { ...state, cliente: intent.valor }
    case 'horasDiaCambiadas':
      return { ...state, horasDia: intent.valor }
    case 'diasMesCambiados':
      return { ...state, diasMes: intent.valor }
    case 'compromisoCambiado':
      return { ...state, nivelCompromiso: intent.valor }
    case 'envioIniciado':
      return { ...state, enviando: true, error: null, ultimoCreado: null }
    case 'envioResuelto':
      return {
        ...initialCreateProjectState,
        horasDia: state.horasDia,
        diasMes: state.diasMes,
        nivelCompromiso: state.nivelCompromiso,
        ultimoCreado: intent.nombre,
      }
    case 'envioFallido':
      return { ...state, enviando: false, error: intent.error }
    case 'avisoCerrado':
      return { ...state, error: null, ultimoCreado: null }
    default:
      return state
  }
}
