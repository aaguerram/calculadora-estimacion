import type { Alcance } from '@/entities/project-scope/@x/historical-project'

/** Un proyecto cerrado: lo que se estimó, lo que costó de verdad, y su alcance. */
export interface ProyectoHistorico {
  id: string
  nombre: string
  cerradoEn: string
  /** Meses-hombre comprometidos en su momento. Registro histórico. */
  mhEstimadas: number
  mhReales: number
  mesesReales: number
  personasReales: number
  /** Foto del alcance con el que se construyó. Es lo que el backtest re-estima. */
  alcance: Alcance | null
}

/** Métricas estándar de calidad de una estimación (doc §8.2). */
export interface MetricasCalidad {
  n: number
  /** Mean Magnitude of Relative Error. Objetivo < 0.25. */
  mmre: number
  /** Mediana del MRE: resistente a un proyecto atípico. */
  mdmre: number
  /** Fracción de proyectos con error < 25 %. Objetivo > 0.75. */
  pred25: number
  /** Media de (estimado − real)/real. Negativo = subestimamos. Objetivo |sesgo| < 0.10. */
  sesgo: number
  apto: boolean
}

export interface ErrorPorProyecto {
  id: string
  nombre: string
  estimado: number
  real: number
  mre: number
  ratio: number
  dentroDePred25: boolean
}

/** Ajuste propuesto para un bucket (un tipo de componente). */
export interface AjustePorBucket {
  clave: string
  factor: number
  /** Peso medio de este bucket en la muestra: baja confianza = poco dato. */
  pesoMedio: number
  proyectosConPeso: number
  confianza: 'alta' | 'media' | 'baja'
}

export interface PropuestaCalibracion {
  /** Media geométrica de real/estimado. Corrige el sesgo sistemático. */
  factorGlobal: number
  /** Sigma lognormal del riesgo común, medido sobre los residuos. */
  sigmaComun: number
  ajustes: AjustePorBucket[]
  advertencias: string[]
}

export interface ResultadoBacktest {
  metricas: MetricasCalidad
  errores: ErrorPorProyecto[]
  /** Proyectos descartados por no tener alcance o cifras utilizables. */
  descartados: string[]
}
