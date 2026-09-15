import type { CoeficientesModelo, TipoComponente } from '@/entities/estimation-model'
import type { Catalogo } from '@/entities/feature-catalog'
import type { Jornada } from '@/entities/project-scope'

//
// El ALCANCE (la entrada del motor) vive en `entities/project-scope`: lo comparten
// el ABM que lo persiste y el motor que lo consume, y una feature no puede ser la
// dueña de un contrato que otra capa necesita.
//
export type {
  Alcance,
  ComponenteAlcance,
  DriverAlcance,
  FeatureAlcance,
  IntegracionAlcance,
  Jornada,
  TocaComponente,
} from '@/entities/project-scope'

export interface OpcionesEstimacion {
  coeficientes: CoeficientesModelo
  /** Sin catálogo, todas las features caen al método estructural. */
  catalogo: Catalogo
  /** Semilla del Monte Carlo. Fijarla hace la estimacion reproducible. */
  semilla?: number
  /** Permite bajar las iteraciones en tests. */
  iteraciones?: number
}

// ------------------------------------------------------------------- salida

export type CategoriaItem = 'feature' | 'bootstrap' | 'integracion'

/** Traza auditable: de aqui sale cada hora estimada (doc §8.5). */
export interface ItemEstimado {
  id: string
  concepto: string
  categoria: CategoriaItem
  componenteId: string
  horasModal: number
  horasOptimista: number
  horasPesimista: number
  factores: Record<string, number>
}

/** Cómo se midió una feature y qué habría dado el otro método. */
export interface MedidaDeFeature {
  featureId: string
  nombre: string
  metodo: 'puntos-funcion' | 'estructural'
  puntosFuncion: number
  horasPorPuntos: number
  horasEstructural: number
  horasAplicadas: number
  /** horasPorPuntos / horasEstructural − 1. Un valor alto es una señal, no un error. */
  divergencia: number
}

export interface EsfuerzoDesarrollo {
  items: ItemEstimado[]
  horasPorComponente: Record<string, number>
  /** Mismo esfuerzo agrupado por tipo: es la base de la calibracion por tipo. */
  horasPorTipo: Partial<Record<TipoComponente, number>>
  /** Una entrada por feature: con qué método se midió y qué decía el otro. */
  medidas: MedidaDeFeature[]
  puntosFuncionTotales: number
  featuresPorPuntos: number
  devBrutoHoras: number
  factorProyecto: number
  devNominalHoras: number
}

export interface BandaRiesgo {
  devP50Horas: number
  devP80Horas: number
  devP90Horas: number
  /** Horas al percentil comprometido, ya con overheads. */
  totalHoras: number
  totalMesesHombre: number
  comprometidoHoras: number
  /** Cuanto ensancha el riesgo respecto a la mediana. */
  colchonSobreP50: number
}

export interface Stream {
  componenteId: string
  nombre: string
  mesesHombre: number
  capDevs: number
  devsParaMinimo: number
  duracionMinima: number
}

export interface DotacionStream {
  componenteId: string
  nombre: string
  devs: number
  meses: number
}

export interface PuntoFrontera {
  personas: number
  devs: number
  qa: number
  devops: number
  gestion: number
  duracionMeses: number
  mesesHombreFacturables: number
  factorCoordinacion: number
  dotacion: DotacionStream[]
}

export interface PlanEquipo {
  streams: Stream[]
  rutaCriticaMeses: number
  arranqueSerialMeses: number
  frontera: PuntoFrontera[]
  /** Minimo coste total. Es la respuesta por defecto. */
  recomendado: PuntoFrontera
  /** Minima duracion alcanzable. */
  masRapido: PuntoFrontera
  /** Menor equipo viable. */
  equipoMinimo: PuntoFrontera
}

/** Contraste top-down COCOMO II para triangular (doc §8.1). */
export interface ContrasteCocomo {
  mesesNominales: number
  personasNominales: number
  desviacionDuracion: number
  dentroDeRango: boolean
}

export type NivelAlerta = 'info' | 'aviso' | 'critico'

export interface Alerta {
  clave: string
  nivel: NivelAlerta
  mensaje: string
}

export interface Estimacion {
  alcance: string
  jornada: Jornada
  horasPorMesHombre: number
  nivelCompromiso: 50 | 80 | 90
  esfuerzo: EsfuerzoDesarrollo
  riesgo: BandaRiesgo
  equipo: PlanEquipo
  contraste: ContrasteCocomo
  alertas: Alerta[]
}
