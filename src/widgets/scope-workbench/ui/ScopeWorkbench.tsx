import { InlineNotification, Loading } from '@carbon/react'

import { ALCANCE_VACIO, resumirAlcance } from '@/entities/project-scope'
import { ArchiveProjectForm } from '@/features/archive-project'
import {
  ComponentesEditor,
  DriversEditor,
  FeaturesEditor,
  IntegracionesEditor,
  useCatalogo,
  useProjectScope,
} from '@/features/manage-scope'
import { EstimationSummary, useEstimation } from '@/features/run-estimation'
import { PageSection } from '@/shared/ui'

import styles from './ScopeWorkbench.module.scss'

interface ScopeWorkbenchProps {
  proyectoId: string | null
}

/**
 * Widget: el ABM de alcance y el motor, conectados.
 *
 * El motor no sabe que existe Postgres: recibe un `Alcance` y lo calcula. Este
 * widget es el unico punto donde el alcance persistido se convierte en entrada
 * del calculo, asi que cambiar la persistencia no toca el motor.
 */
export function ScopeWorkbench({ proyectoId }: ScopeWorkbenchProps) {
  const { state, mutar, cerrarError } = useProjectScope(proyectoId)
  const { catalogo } = useCatalogo()
  const alcance = state.alcance

  const { estimacion, coeficientes } = useEstimation(alcance ?? ALCANCE_VACIO, catalogo)

  if (!proyectoId) {
    return (
      <PageSection
        title="Sin proyecto seleccionado"
        description="Elige un proyecto en «Proyectos» para capturar su alcance y estimarlo."
      >
        <InlineNotification
          kind="info"
          lowContrast
          hideCloseButton
          title="Nada que estimar todavía"
          subtitle="La estimación se calcula sobre el alcance real de un proyecto, no sobre un ejemplo."
        />
      </PageSection>
    )
  }

  if (state.estado === 'cargando' && !alcance) {
    return (
      <PageSection title="Alcance" description="Cargando desde Postgres…">
        <div className={styles.cargando}>
          <Loading withOverlay={false} small description="Cargando alcance" />
        </div>
      </PageSection>
    )
  }

  if (!alcance) {
    return (
      <PageSection title="Alcance" description="">
        <InlineNotification
          kind="error"
          lowContrast
          hideCloseButton
          title="No se pudo cargar el alcance"
          subtitle={state.error ?? 'El proyecto no existe o no tienes acceso.'}
        />
      </PageSection>
    )
  }

  const resumen = resumirAlcance(alcance)

  return (
    <>
      <PageSection
        title={`Alcance — ${alcance.nombre}`}
        description={`${resumen.componentes} componentes · ${resumen.features} features · ${resumen.pares} pares estimables · ${resumen.elementos} elementos · ${resumen.integraciones} integraciones${resumen.sinClasificar > 0 ? ` · ${resumen.sinClasificar} sin clasificar` : ''}`}
      >
        {state.error ? (
          <InlineNotification
            kind="error"
            lowContrast
            title="No se pudo guardar"
            subtitle={state.error}
            onCloseButtonClick={cerrarError}
          />
        ) : null}

        <ComponentesEditor alcance={alcance} guardando={state.guardando} mutar={mutar} />
        <FeaturesEditor
          alcance={alcance}
          catalogo={catalogo}
          horasPorPunto={coeficientes.coeficientes.puntosFuncion.horasDevPorPunto}
          guardando={state.guardando}
          mutar={mutar}
        />
        <IntegracionesEditor alcance={alcance} guardando={state.guardando} mutar={mutar} />
        <DriversEditor alcance={alcance} guardando={state.guardando} mutar={mutar} />
      </PageSection>

      <PageSection
        title={`Estimación — ${alcance.nombre}`}
        description={`1 mes-hombre = ${estimacion.horasPorMesHombre} h · compromiso P${estimacion.nivelCompromiso} · recalculada en cada cambio del alcance`}
      >
        <EstimationSummary estimacion={estimacion} aviso={coeficientes.aviso} />
      </PageSection>

      <PageSection
        title="Cerrar el proyecto"
        description="Al terminar, registra las cifras reales. Es lo único que convierte los coeficientes en algo medido en vez de supuesto."
      >
        <ArchiveProjectForm
          alcance={alcance}
          mhEstimadas={estimacion.riesgo.totalMesesHombre}
        />
      </PageSection>
    </>
  )
}
