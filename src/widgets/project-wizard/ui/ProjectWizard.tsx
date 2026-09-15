import { Button, InlineNotification, Loading } from '@carbon/react'
import { useCallback, useReducer } from 'react'
import { Link } from 'react-router'

import { CreateEstimationProjectForm } from '@/features/create-estimation-project'
import {
  NavegacionPasos,
  PasosGuiados,
  initialWizardState,
  wizardReducer,
} from '@/features/guided-project-entry'
import {
  ComponentesEditor,
  DriversEditor,
  FeaturesEditor,
  IntegracionesEditor,
  useCatalogo,
  useProjectScope,
} from '@/features/manage-scope'
import { EstimationSummary, useEstimation } from '@/features/run-estimation'
import { ALCANCE_VACIO } from '@/entities/project-scope'
import { PageSection } from '@/shared/ui'

import styles from './ProjectWizard.module.scss'

/**
 * Widget: alta completa de un proyecto desde la web, paso a paso.
 *
 * Reutiliza los mismos editores que la pantalla de alcance; lo que aporta es el
 * ORDEN y la explicacion de que hace cada cosa, para que alguien que no conoce
 * el modelo pueda cargar un proyecto entero y entender por que sale lo que sale.
 */
export function ProjectWizard() {
  const [paso, dispatch] = useReducer(wizardReducer, initialWizardState)
  const { state, mutar, cerrarError } = useProjectScope(paso.proyectoId)
  const { catalogo } = useCatalogo()
  const alcance = state.alcance
  const { estimacion, coeficientes } = useEstimation(alcance ?? ALCANCE_VACIO, catalogo)

  const alCrear = useCallback((proyectoId: string) => {
    dispatch({ type: 'proyectoCreado', proyectoId })
  }, [])

  const editorProps = alcance
    ? { alcance, guardando: state.guardando, mutar }
    : null

  return (
    <PageSection
      title="Ingresar un proyecto"
      description="Todo lo necesario para cargar un proyecto desde la web, en orden y con una explicación en cada campo."
    >
      <PasosGuiados state={paso} dispatch={dispatch} />

      {state.error ? (
        <InlineNotification
          kind="error"
          lowContrast
          title="No se pudo guardar"
          subtitle={state.error}
          onCloseButtonClick={cerrarError}
        />
      ) : null}

      {paso.paso === 'proyecto' ? (
        <CreateEstimationProjectForm alCrearConId={alCrear} />
      ) : null}

      {paso.paso !== 'proyecto' && !editorProps ? (
        <div className={styles.cargando}>
          <Loading withOverlay={false} small description="Cargando el proyecto" />
        </div>
      ) : null}

      {editorProps ? (
        <>
          {paso.paso === 'componentes' ? <ComponentesEditor {...editorProps} /> : null}
          {paso.paso === 'features' ? (
            <FeaturesEditor
              {...editorProps}
              catalogo={catalogo}
              horasPorPunto={coeficientes.coeficientes.puntosFuncion.horasDevPorPunto}
            />
          ) : null}
          {paso.paso === 'integraciones' ? <IntegracionesEditor {...editorProps} /> : null}
          {paso.paso === 'drivers' ? <DriversEditor {...editorProps} /> : null}
          {paso.paso === 'revision' ? (
            <>
              <EstimationSummary estimacion={estimacion} aviso={coeficientes.aviso} />
              <div className={styles.enlaces}>
                <Button as={Link} to={`/proyecto/${paso.proyectoId}`}>
                  Abrir en la pantalla de alcance
                </Button>
                <Button
                  kind="tertiary"
                  type="button"
                  onClick={() => dispatch({ type: 'reiniciado' })}
                >
                  Ingresar otro proyecto
                </Button>
              </div>
            </>
          ) : null}
        </>
      ) : null}

      <NavegacionPasos state={paso} dispatch={dispatch} />
    </PageSection>
  )
}
