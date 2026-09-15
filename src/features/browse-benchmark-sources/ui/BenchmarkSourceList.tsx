import { InlineNotification, Loading } from '@carbon/react'

import { ETIQUETA_NIVEL, FuenteCard, totalRegistros } from '@/entities/benchmark-source'
import type { FuenteBenchmark } from '@/entities/benchmark-source'

import styles from './BenchmarkSourceList.module.scss'

interface BenchmarkSourceListProps {
  state: { estado: 'cargando' | 'listo' | 'error'; fuentes: FuenteBenchmark[]; error: string | null }
}

const ORDEN: ReadonlyArray<FuenteBenchmark['nivel']> = ['proyecto', 'tarea', 'historia']

export function BenchmarkSourceList({ state }: BenchmarkSourceListProps) {
  if (state.estado === 'cargando' && state.fuentes.length === 0) {
    return (
      <div className={styles.cargando}>
        <Loading withOverlay={false} small description="Cargando fuentes" />
      </div>
    )
  }

  if (state.estado === 'error' && state.fuentes.length === 0) {
    return (
      <InlineNotification
        kind="error"
        lowContrast
        hideCloseButton
        title="No se pudieron leer las fuentes"
        subtitle={`${state.error ?? ''} — ¿ejecutaste \`npm run benchmark:cargar\`?`}
      />
    )
  }

  const total = totalRegistros(state.fuentes)
  const unaEmpresa = state.fuentes.filter((f) => !f.multiempresa).length

  return (
    <div>
      <div className={styles.resumen}>
        <div className={styles.dato}>
          <span className={styles.etiqueta}>Fuentes</span>
          <span className={styles.valor}>{state.fuentes.length}</span>
        </div>
        <div className={styles.dato}>
          <span className={styles.etiqueta}>Proyectos</span>
          <span className={styles.valor}>{total.proyectos.toLocaleString('es-EC')}</span>
        </div>
        <div className={styles.dato}>
          <span className={styles.etiqueta}>Tareas e historias</span>
          <span className={styles.valor}>{total.tareas.toLocaleString('es-EC')}</span>
        </div>
        <div className={styles.dato}>
          <span className={styles.etiqueta}>De una sola organización</span>
          <span className={styles.valor}>
            {unaEmpresa} / {state.fuentes.length}
          </span>
        </div>
      </div>

      {ORDEN.map((nivel) => {
        const delNivel = state.fuentes.filter((f) => f.nivel === nivel)
        if (delNivel.length === 0) return null
        return (
          <section key={nivel}>
            <h3 className={styles.grupo}>
              Nivel {ETIQUETA_NIVEL[nivel].toLowerCase()} ({delNivel.length})
            </h3>
            <div className={styles.lista}>
              {delNivel.map((f) => (
                <FuenteCard key={f.clave} fuente={f} />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
