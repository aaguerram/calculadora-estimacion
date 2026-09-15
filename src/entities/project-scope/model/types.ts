import type {
  NivelComplejidad,
  StackTecnologico,
  TipoComponente,
} from '@/entities/estimation-model/@x/project-scope'

/**
 * El ALCANCE de un proyecto: lo que hay que construir.
 *
 * Es el contrato de entrada del motor de estimacion y, a la vez, lo que se
 * persiste en Postgres. Vive en una entity (no en el motor) para que tanto el
 * ABM como el motor lo consuman sin importarse entre si.
 */

export interface ComponenteAlcance {
  id: string
  nombre: string
  tipo: TipoComponente
  stack: StackTecnologico
  esNuevo: boolean
  /** Sobrescribe el maximo de devs utiles del tipo. */
  capDevs?: number
}

export interface TocaComponente {
  componenteId: string
  /** Si se omite, hereda la complejidad de la feature. */
  complejidad?: NivelComplejidad
}

/** Eje 3: un elemento del catálogo marcado en una feature, con su cantidad. */
export interface ElementoSeleccionado {
  elemento: string
  cantidad: number
  complejidad: NivelComplejidad
}

export interface FeatureAlcance {
  id: string
  nombre: string
  complejidad: NivelComplejidad
  /** Eje 1: qué es la feature. `null` mientras no se clasifique. */
  categoria: string | null
  /** Eje 2: dónde vive, componente a componente. */
  toca: TocaComponente[]
  /** Eje 3: de qué está hecha. */
  elementos: ElementoSeleccionado[]
}

export interface IntegracionAlcance {
  id: string
  nombre: string
  complejidad: NivelComplejidad
  /** Componente que la consume: su esfuerzo entra en ese stream. */
  componenteDuenioId: string
  esExterna: boolean
  tieneSandbox: boolean
  /** Cuantas features la usan. La primera cuesta completa; las demas, un recargo. */
  usos: number
}

export interface DriverAlcance {
  clave: string
  etiqueta: string
  /** Delta ADITIVO. factorProyecto = 1 + suma(delta). */
  delta: number
}

export interface Jornada {
  horasDia: number
  diasMes: number
}

export interface Alcance {
  nombre: string
  jornada: Jornada
  nivelCompromiso: 50 | 80 | 90
  componentes: ComponenteAlcance[]
  features: FeatureAlcance[]
  integraciones: IntegracionAlcance[]
  drivers: DriverAlcance[]
}

/** Alcance con la identidad del proyecto al que pertenece. */
export interface AlcanceDeProyecto extends Alcance {
  proyectoId: string
}

export const ALCANCE_VACIO: Alcance = {
  nombre: '',
  jornada: { horasDia: 6, diasMes: 20 },
  nivelCompromiso: 80,
  componentes: [],
  features: [],
  integraciones: [],
  drivers: [],
}
