import { Tag } from '@carbon/react'

import { cx } from '@/shared/lib'

import { horasPorMesHombre } from '../model/types'
import type { EstimationProject } from '../model/types'

import styles from './EstimationProjectCard.module.scss'

interface EstimationProjectCardProps {
  proyecto: EstimationProject
  /** Accion opcional inyectada por la capa superior. La entity no decide que hace. */
  accion?: React.ReactNode
  seleccionado?: boolean
}

/**
 * Representacion canonica de un proyecto de estimacion.
 * Presentacional: no llama a la API ni despacha acciones propias.
 */
export function EstimationProjectCard({
  proyecto,
  accion,
  seleccionado,
}: EstimationProjectCardProps) {
  return (
    <article className={cx(styles.card, seleccionado && styles.seleccionada)}>
      <div>
        <p className={styles.nombre}>{proyecto.nombre}</p>
        {proyecto.cliente ? <p className={styles.cliente}>{proyecto.cliente}</p> : null}
        <p className={styles.meta}>
          {proyecto.horasDia} h/día × {proyecto.diasMes} días ={' '}
          {horasPorMesHombre(proyecto)} h por mes-hombre · {proyecto.ownerId}
        </p>
      </div>
      <div className={styles.lado}>
        <Tag type="warm-gray" size="sm">
          P{proyecto.nivelCompromiso}
        </Tag>
        {accion}
      </div>
    </article>
  )
}
