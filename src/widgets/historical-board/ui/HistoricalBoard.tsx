import { InlineNotification } from '@carbon/react'
import { Link } from 'react-router'

import {
  HistoricalImport,
  HistoricalList,
  HistoricalSingleForm,
  useHistorical,
} from '@/features/manage-historical'
import { PageSection } from '@/shared/ui'

/**
 * Widget: el histórico propio de la organización.
 *
 * Es lo ÚNICO que calibra el modelo. Los datasets públicos de `/fuentes` son
 * referencia: acotan rangos, pero no fijan coeficientes.
 */
export function HistoricalBoard() {
  const { state, importar, borrar, cerrarAviso } = useHistorical()

  return (
    <PageSection
      title="Histórico de proyectos cerrados"
      description="Lo que se estimó frente a lo que costó de verdad. Es lo único que convierte los coeficientes del modelo en algo medido en vez de supuesto."
    >
      {state.error ? (
        <InlineNotification
          kind="error"
          lowContrast
          title="No se pudo completar"
          subtitle={state.error}
          onCloseButtonClick={cerrarAviso}
        />
      ) : null}
      {state.cargados > 0 ? (
        <InlineNotification
          kind="success"
          lowContrast
          title={`${state.cargados} proyecto(s) cargado(s)`}
          subtitle="Ve a Calibración para ver qué dicen de los coeficientes actuales."
          onCloseButtonClick={cerrarAviso}
        />
      ) : null}

      <HistoricalList
        historicos={state.historicos}
        cargando={state.estado === 'cargando'}
        guardando={state.guardando}
        onBorrar={(id) => void borrar(id)}
      />

      <HistoricalSingleForm guardando={state.guardando} onCargar={(r) => void importar(r)} />
      <HistoricalImport guardando={state.guardando} onCargar={(r) => void importar(r)} />

      <p style={{ marginBlockStart: '2rem' }}>
        ¿Prefieres reconstruir el alcance para que además recalibre?{' '}
        <Link to="/ingresar">Ingresar proyecto</Link> y archívalo al final.
      </p>
    </PageSection>
  )
}
