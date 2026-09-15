import { useCallback } from 'react'

import type { CoeficientesModelo } from '@/entities/estimation-model'
import type { Estimador } from '@/entities/historical-project'
import { CalibrationPanel, useCalibration } from '@/features/calibrate-model'
import { ejecutarEstimacion, useEstimation } from '@/features/run-estimation'
import { ALCANCE_DEMO } from '@/features/run-estimation'
import { PageSection } from '@/shared/ui'

/**
 * Widget: aqui se inyecta el motor en el backtest.
 *
 * `calibrate-model` y `run-estimation` son dos slices de la MISMA capa y no
 * pueden importarse entre si. La capa de composicion es el sitio correcto para
 * unirlos, y la inyeccion deja el backtest testeable sin motor.
 */
export function CalibrationBoard() {
  // Se cargan los coeficientes vigentes de Postgres; el alcance da igual aqui.
  const { coeficientes } = useEstimation(ALCANCE_DEMO)

  const construirEstimador = useCallback(
    (coefs: CoeficientesModelo): Estimador =>
      (historico) => {
        const estimacion = ejecutarEstimacion(historico.alcance!, {
          coeficientes: coefs,
          // Menos iteraciones: el backtest reejecuta el motor por cada proyecto
          // y dos veces (antes y despues), y aqui interesa la media, no la cola.
          iteraciones: 3000,
        })
        return {
          mesesHombre: estimacion.riesgo.totalMesesHombre,
          horasPorBucket: estimacion.esfuerzo.horasPorTipo as Record<string, number>,
        }
      },
    [],
  )

  const calibracion = useCalibration(coeficientes.coeficientes, construirEstimador)

  return (
    <PageSection
      title="Calibración con el histórico"
      description="Re-estima cada proyecto cerrado con los coeficientes de hoy y los compara con lo que costó de verdad. Sin esto, los coeficientes son suposiciones."
    >
      <CalibrationPanel calibracion={calibracion} />
    </PageSection>
  )
}
