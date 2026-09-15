export type TipoComponente =
  | 'front-angular'
  | 'bff'
  | 'micro-experiencia'
  | 'micro-negocio'
  | 'micro-core'
  | 'monolito-netcore'
  | 'monolito-netfx'
  /** Programa en lenguaje de 3a generacion (COBOL, PL/1, RPG), tipicamente en host. */
  | 'componente-3gl'

export type StackTecnologico =
  | 'net8'
  | 'netcore'
  | 'netfx'
  | 'angular17'
  | 'angular12'
  | 'cobol'
  | 'otro-3gl'

export type NivelComplejidad = 'mb' | 'b' | 'm' | 'a' | 'ma'

export const TIPOS_COMPONENTE: readonly TipoComponente[] = [
  'front-angular',
  'bff',
  'micro-experiencia',
  'micro-negocio',
  'micro-core',
  'monolito-netcore',
  'monolito-netfx',
  'componente-3gl',
]

export const NIVELES_COMPLEJIDAD: readonly NivelComplejidad[] = ['mb', 'b', 'm', 'a', 'ma']

export const ETIQUETA_COMPLEJIDAD: Record<NivelComplejidad, string> = {
  mb: 'Muy baja',
  b: 'Baja',
  m: 'Media',
  a: 'Alta',
  ma: 'Muy alta',
}

export const ETIQUETA_TIPO: Record<TipoComponente, string> = {
  'front-angular': 'Front Angular',
  bff: 'BFF',
  'micro-experiencia': 'Micro de experiencia',
  'micro-negocio': 'Micro de negocio',
  'micro-core': 'Micro core',
  'monolito-netcore': 'Monolito .NET Core',
  'monolito-netfx': 'Monolito .NET Framework',
  'componente-3gl': 'Componente 3GL (COBOL/PL1)',
}

/** Rango de tres puntos, expresado como factor sobre la estimacion modal. */
export interface RangoPert {
  optimista: number
  pesimista: number
}

/**
 * Todos los numeros que gobiernan el modelo.
 * Son CALIBRABLES: la tabla `estimacion.modelo_coeficiente` los sobreescribe.
 */
export interface CoeficientesModelo {
  /** Horas base por feature en cada tipo de componente, a complejidad media. */
  base: Record<TipoComponente, number>
  /** Maximo de devs que caben en ese componente sin estorbarse. */
  cap: Record<TipoComponente, number>
  /** Coste unico de arrancar un componente nuevo. */
  bootstrap: Record<TipoComponente, number>
  complejidad: Record<NivelComplejidad, number>
  stack: Record<StackTecnologico, number>
  integracion: {
    porComplejidad: Record<NivelComplejidad, number>
    recargoExterna: number
    recargoSinSandbox: number
    recargoUsoExtra: number
  }
  pert: Record<NivelComplejidad, RangoPert>
  pertIntegracion: RangoPert
  pertBootstrap: RangoPert
  overhead: {
    analisis: number
    qa: number
    devops: number
    gestion: number
    documentacion: number
  }
  equipo: {
    /** Sobrecarga de comunicacion dentro de un stream. */
    gamma: number
    /** Sobrecarga de coordinacion global del proyecto. */
    delta: number
    /** Meses-hombre de onboarding por persona adicional. */
    onboarding: number
    /** Personas que ejecutan el arranque serial. */
    personasNucleoSerial: number
    /** Estabilizacion como fraccion del desarrollo. */
    fraccionEstabilizacion: number
  }
  riesgo: {
    /** Sigma del multiplicador lognormal comun a toda la corrida. */
    sigmaComun: number
    iteraciones: number
  }
  puntosFuncion: {
    /**
     * Horas de DESARROLLO por punto funcion sin ajustar.
     *
     * OJO con la unidad: los 6.3-23.7 h/PF que se leen en la literatura y en
     * `benchmark.productividad` son esfuerzo TOTAL de proyecto. Aqui la cifra es
     * solo desarrollo, porque despues se le aplica el x1.65 de overheads. Usar
     * la cifra total contaria dos veces el analisis, QA y la gestion.
     */
    horasDevPorPunto: number
  }
}

/** Suma de los overheads no-desarrollo, como multiplicador. */
export function factorOverhead(coeficientes: CoeficientesModelo): number {
  const o = coeficientes.overhead
  return 1 + o.analisis + o.qa + o.devops + o.gestion + o.documentacion
}
