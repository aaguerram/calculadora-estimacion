import { Button } from '@carbon/react'
import { useCallback } from 'react'

import { eliminarProyecto } from '@/entities/estimation-project'
import { EstimationProjectList, useEstimationProjects } from '@/features/browse-estimation-projects'
import { CreateEstimationProjectForm } from '@/features/create-estimation-project'
import { ApiTokenField, useApiToken } from '@/features/set-api-token'
import { PageSection } from '@/shared/ui'

import styles from './EstimationProjectBoard.module.scss'

/**
 * Widget: orquesta tres features que NO se conocen entre si.
 * Crear un proyecto recarga la lista porque este widget conecta ambos cables.
 */
interface EstimationProjectBoardProps {
  proyectoSeleccionadoId: string | null
  onSeleccionar: (id: string | null) => void
}

export function EstimationProjectBoard({
  proyectoSeleccionadoId,
  onSeleccionar,
}: EstimationProjectBoardProps) {
  const { hayToken } = useApiToken()
  const { state, recargar } = useEstimationProjects(hayToken)

  const alCrear = useCallback(() => {
    void recargar()
  }, [recargar])

  const alBorrar = useCallback(
    async (id: string) => {
      await eliminarProyecto(id)
      if (id === proyectoSeleccionadoId) onSeleccionar(null)
      void recargar()
    },
    [recargar, proyectoSeleccionadoId, onSeleccionar],
  )

  return (
    <PageSection
      title="Proyectos en Postgres"
      description="React → PostgREST → Postgres on-prem. Sin backend propio: la API la genera el esquema."
    >
      <div className={styles.bloque}>
        <ApiTokenField />
      </div>

      <div className={styles.bloque}>
        <h3 className={styles.subtitulo}>Proyectos guardados</h3>
        {hayToken ? (
          <EstimationProjectList
            state={state}
            seleccionadoId={proyectoSeleccionadoId}
            renderAccion={(id) => (
              <>
                <Button
                  kind={id === proyectoSeleccionadoId ? 'tertiary' : 'primary'}
                  size="sm"
                  type="button"
                  onClick={() => onSeleccionar(id === proyectoSeleccionadoId ? null : id)}
                >
                  {id === proyectoSeleccionadoId ? 'Activo' : 'Estimar'}
                </Button>
                <Button
                  kind="ghost"
                  size="sm"
                  type="button"
                  onClick={() => {
                    void alBorrar(id)
                  }}
                >
                  Eliminar
                </Button>
              </>
            )}
          />
        ) : (
          <p className={styles.desconectado}>
            Conecta un token para leer y escribir. Sin token, PostgREST responde 401: la
            seguridad la aplica Postgres, no el navegador.
          </p>
        )}
      </div>

      <div className={styles.bloque}>
        <h3 className={styles.subtitulo}>Nuevo proyecto</h3>
        <CreateEstimationProjectForm alCrear={alCrear} />
      </div>
    </PageSection>
  )
}
