export { useCalibration } from './model/use-calibration'
export type { Calibracion } from './model/use-calibration'
export {
  aFilaCoeficiente,
  construirCambios,
  simularCambios,
  unidadDeCoeficiente,
  MINIMO_PARA_CALIBRAR_PF,
} from './model/aplicar-propuesta'
export { refinarCambios, RONDAS_MAXIMAS, TOLERANCIA_SESGO } from './model/refinar'
export type { CambioCoeficiente } from './model/aplicar-propuesta'
export { CalibrationPanel } from './ui/CalibrationPanel'
