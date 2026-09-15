import { Tag } from '@carbon/react'

import { ETIQUETA_NIVEL } from '../model/types'
import type { FuenteBenchmark } from '../model/types'

import styles from './FuenteCard.module.scss'

/** Representación canónica de una fuente. Presentacional. */
export function FuenteCard({ fuente }: { fuente: FuenteBenchmark }) {
  return (
    <article className={styles.card}>
      <div className={styles.cabecera}>
        <span className={styles.nombre}>{fuente.nombre}</span>
        <span>
          <span className={styles.cifra}>{fuente.nRegistros.toLocaleString('es-EC')}</span>{' '}
          <span className={styles.unidad}>registros</span>
        </span>
      </div>

      <div className={styles.etiquetas}>
        <Tag type="warm-gray" size="sm">
          Nivel: {ETIQUETA_NIVEL[fuente.nivel]}
        </Tag>
        <Tag type="warm-gray" size="sm">
          Esfuerzo en {fuente.unidadEsfuerzo}
        </Tag>
        {fuente.anio ? (
          <Tag type="warm-gray" size="sm">
            {fuente.anio}
          </Tag>
        ) : null}
        <Tag type={fuente.multiempresa ? 'gray' : 'green'} size="sm">
          {fuente.multiempresa ? 'Varias organizaciones' : 'Una sola organización'}
        </Tag>
      </div>

      <p className={styles.descripcion}>{fuente.descripcion}</p>

      <a
        className={styles.enlace}
        href={fuente.origenUrl}
        target="_blank"
        rel="noreferrer noopener"
      >
        {fuente.origenUrl}
      </a>
    </article>
  )
}
