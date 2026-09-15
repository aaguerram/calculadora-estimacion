export { calcularErrores, calcularMetricas, motivosDeNoApto, UMBRALES } from './model/metricas'
export type { ParEstimadoReal } from './model/metricas'

export {
  ajustarPorBucket,
  mediaGeometrica,
  proponerCalibracion,
  sigmaLogaritmica,
} from './model/calibrar'
export type { ObservacionCalibracion } from './model/calibrar'

export {
  EJEMPLO_IMPORTACION,
  alcanceUtilizable,
  parsearHistoricos,
} from './model/importar'
export type {
  ErrorImportacion,
  FilaImportada,
  ResultadoImportacion,
} from './model/importar'

export { ejecutarBacktest } from './model/backtest'
export type { Backtest, Estimador, SalidaEstimador } from './model/backtest'

export {
  aplicarCoeficientes,
  archivarProyecto,
  eliminarHistorico,
  listarHistoricos,
} from './api/historical-project.api'
export type { CierreDeProyecto, CoeficienteAEscribir } from './api/historical-project.api'

export type {
  AjustePorBucket,
  ErrorPorProyecto,
  MetricasCalidad,
  PropuestaCalibracion,
  ProyectoHistorico,
  ResultadoBacktest,
} from './model/types'
