export type PasoGuiado =
  | 'proyecto'
  | 'componentes'
  | 'features'
  | 'integraciones'
  | 'drivers'
  | 'revision'

export const PASOS: readonly PasoGuiado[] = [
  'proyecto',
  'componentes',
  'features',
  'integraciones',
  'drivers',
  'revision',
]

export interface DescripcionPaso {
  clave: PasoGuiado
  titulo: string
  resumen: string
  /** Qué aporta este paso al cálculo. Se muestra siempre, no escondido. */
  porQue: string
}

export const DESCRIPCION_PASOS: Record<PasoGuiado, DescripcionPaso> = {
  proyecto: {
    clave: 'proyecto',
    titulo: 'El proyecto',
    resumen: 'Nombre, cliente y la jornada con la que se cuenta el esfuerzo.',
    porQue:
      'La jornada define cuánto vale un mes-hombre. Con 6 h/día y 20 días son 120 h; cambiarla cambia todas las cifras de esfuerzo, no la cantidad de trabajo.',
  },
  componentes: {
    clave: 'componentes',
    titulo: 'Componentes',
    resumen: 'Los sistemas que hay que tocar: front, BFF, micros, monolito, host.',
    porQue:
      'Cada componente es un frente de trabajo con su propio techo de personas. El más largo marca la ruta crítica, y por tanto la duración mínima del proyecto.',
  },
  features: {
    clave: 'features',
    titulo: 'Features',
    resumen: 'Qué hay que construir, de qué tipo es y de qué está hecho.',
    porQue:
      'La unidad que se estima es el par (feature × componente). Si además marcas sus elementos, esa feature pasa a medirse por puntos función, que es más preciso que la complejidad a ojo.',
  },
  integraciones: {
    clave: 'integraciones',
    titulo: 'Integraciones',
    resumen: 'Sistemas de terceros o ajenos al equipo que hay que consumir.',
    porQue:
      'Es lo que más se subestima. Una contraparte externa multiplica por 1.4 y la falta de sandbox por 1.3: no es código, es coordinación y bloqueos.',
  },
  drivers: {
    clave: 'drivers',
    titulo: 'Drivers',
    resumen: 'Las cinco condiciones del proyecto que suben o bajan el esfuerzo.',
    porQue:
      'Sus efectos se SUMAN, no se multiplican. Multiplicarlos produciría factores de 2× con respuestas perfectamente normales.',
  },
  revision: {
    clave: 'revision',
    titulo: 'Revisión',
    resumen: 'La estimación resultante, con sus avisos y su banda de confianza.',
    porQue:
      'Aquí se ve el esfuerzo al percentil comprometido, el equipo óptimo, la duración y las señales de que algo está mal capturado.',
  },
}

export interface WizardState {
  paso: PasoGuiado
  proyectoId: string | null
}

export type WizardIntent =
  | { type: 'proyectoCreado'; proyectoId: string }
  | { type: 'irA'; paso: PasoGuiado }
  | { type: 'siguiente' }
  | { type: 'anterior' }
  | { type: 'reiniciado' }

export const initialWizardState: WizardState = { paso: 'proyecto', proyectoId: null }

/** Sin proyecto creado no se puede salir del primer paso: no hay dónde guardar. */
export function puedeIrA(state: WizardState, paso: PasoGuiado): boolean {
  return paso === 'proyecto' || state.proyectoId !== null
}

export function indiceDe(paso: PasoGuiado): number {
  return PASOS.indexOf(paso)
}

export function wizardReducer(state: WizardState, intent: WizardIntent): WizardState {
  switch (intent.type) {
    case 'proyectoCreado':
      return { proyectoId: intent.proyectoId, paso: 'componentes' }
    case 'irA':
      return puedeIrA(state, intent.paso) ? { ...state, paso: intent.paso } : state
    case 'siguiente': {
      const siguiente = PASOS[Math.min(PASOS.length - 1, indiceDe(state.paso) + 1)]
      return puedeIrA(state, siguiente) ? { ...state, paso: siguiente } : state
    }
    case 'anterior':
      return { ...state, paso: PASOS[Math.max(0, indiceDe(state.paso) - 1)] }
    case 'reiniciado':
      return initialWizardState
    default:
      return state
  }
}
