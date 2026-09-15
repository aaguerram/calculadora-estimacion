import { InlineNotification, Loading } from '@carbon/react'
import type { ReactNode } from 'react'

import { EstimationProjectCard } from '@/entities/estimation-project'

import type { BrowseProjectsState } from '../model/browse-projects.reducer'

import styles from './EstimationProjectList.module.scss'

interface EstimationProjectListProps {
  state: BrowseProjectsState
  /** La capa superior decide que accion ofrece por fila. */
  renderAccion?: (id: string) => ReactNode
  /** Proyecto activo, para resaltarlo. */
  seleccionadoId?: string | null
}

export function EstimationProjectList({
  state,
  renderAccion,
  seleccionadoId,
}: EstimationProjectListProps) {
  if (state.estado === 'cargando') {
    return (
      <div className={styles.cargando}>
        <Loading withOverlay={false} small description="Cargando proyectos" />
      </div>
    )
  }

  if (state.estado === 'error') {
    return (
      <InlineNotification
        kind="error"
        lowContrast
        title="No se pudieron cargar los proyectos"
        subtitle={state.error ?? ''}
        hideCloseButton
      />
    )
  }

  if (state.proyectos.length === 0) {
    return <p className={styles.vacio}>Todavía no hay proyectos. Crea el primero abajo.</p>
  }

  return (
    <div className={styles.lista}>
      {state.proyectos.map((proyecto) => (
        <EstimationProjectCard
          key={proyecto.id}
          proyecto={proyecto}
          seleccionado={proyecto.id === seleccionadoId}
          accion={renderAccion?.(proyecto.id)}
        />
      ))}
    </div>
  )
}
