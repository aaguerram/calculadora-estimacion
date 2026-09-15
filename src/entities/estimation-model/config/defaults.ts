import type { CoeficientesModelo } from '../model/types'

/**
 * Semillas del modelo (docs/modelo-estimacion.md).
 * NO son verdades: se recalibran con back-testing sobre proyectos cerrados.
 * La tabla `estimacion.modelo_coeficiente` sobreescribe clave a clave.
 */
export const COEFICIENTES_POR_DEFECTO: CoeficientesModelo = {
  base: {
    'front-angular': 40,
    bff: 20,
    'micro-experiencia': 28,
    'micro-negocio': 44,
    'micro-core': 60,
    'monolito-netcore': 52,
    'monolito-netfx': 68,
    'componente-3gl': 72,
  },
  cap: {
    'front-angular': 5,
    bff: 3,
    'micro-experiencia': 3,
    'micro-negocio': 3,
    'micro-core': 3,
    'monolito-netcore': 3,
    'monolito-netfx': 2,
    // Igual que el monolito legado: alto acoplamiento y coste de regresion.
    'componente-3gl': 2,
  },
  bootstrap: {
    'front-angular': 60,
    bff: 24,
    'micro-experiencia': 32,
    'micro-negocio': 40,
    'micro-core': 56,
    'monolito-netcore': 0,
    'monolito-netfx': 0,
    // Un componente 3GL siempre existe ya: no hay arranque que pagar.
    'componente-3gl': 0,
  },
  complejidad: { mb: 0.4, b: 0.7, m: 1.0, a: 1.6, ma: 2.2 },
  // El factor 3GL esta MEDIDO sobre datos reales, no supuesto: dentro de
  // Desharnais (misma empresa) 3GL rinde 18.7 h/PF frente a 4.2 de un 4GL (4.4x),
  // y entre datasets Albrecht (COBOL/PL1) 23.7 frente a China 8.1 (2.9x).
  // Se toma 2.6 porque la linea base .NET no es un 4GL puro. Ver datasets/HALLAZGOS.md.
  stack: {
    net8: 1.0,
    netcore: 1.0,
    netfx: 1.3,
    angular17: 1.0,
    angular12: 1.2,
    cobol: 2.6,
    'otro-3gl': 2.6,
  },
  integracion: {
    porComplejidad: { mb: 4, b: 8, m: 24, a: 56, ma: 96 },
    recargoExterna: 1.4,
    recargoSinSandbox: 1.3,
    recargoUsoExtra: 0.25,
  },
  // Asimetricos a la derecha: el software se pasa mucho mas de lo que se adelanta.
  pert: {
    mb: { optimista: 0.85, pesimista: 1.25 },
    b: { optimista: 0.85, pesimista: 1.3 },
    m: { optimista: 0.8, pesimista: 1.5 },
    a: { optimista: 0.7, pesimista: 1.9 },
    ma: { optimista: 0.65, pesimista: 2.3 },
  },
  pertIntegracion: { optimista: 0.7, pesimista: 2.2 },
  pertBootstrap: { optimista: 0.85, pesimista: 1.4 },
  overhead: { analisis: 0.15, qa: 0.25, devops: 0.08, gestion: 0.12, documentacion: 0.05 },
  equipo: {
    gamma: 0.02,
    delta: 0.0015,
    onboarding: 0.4,
    personasNucleoSerial: 2,
    fraccionEstabilizacion: 0.1,
  },
  riesgo: { sigmaComun: 0.18, iteraciones: 20000 },
  // Mediana observada sobre 1086 proyectos publicos: 8.7 h/PF de proyecto
  // completo, que dividido por el 1.65 de overheads deja 5.2 de desarrollo puro
  // (p25 2.9, p75 9.9). Es el coeficiente a calibrar antes que ningun otro.
  puntosFuncion: { horasDevPorPunto: 5.2 },
}
