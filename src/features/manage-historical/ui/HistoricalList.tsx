import { Button, InlineNotification, Loading, Tag } from '@carbon/react'

import type { ProyectoHistorico } from '@/entities/historical-project'

import styles from './historico.module.scss'

interface HistoricalListProps {
  historicos: ProyectoHistorico[]
  cargando: boolean
  guardando: boolean
  onBorrar: (id: string) => void
}

const MINIMO = 3
const RECOMENDADO = 5

export function HistoricalList({
  historicos,
  cargando,
  guardando,
  onBorrar,
}: HistoricalListProps) {
  const calibrables = historicos.filter((h) => h.alcance !== null)

  if (cargando && historicos.length === 0) {
    return <Loading withOverlay={false} small description="Cargando histórico" />
  }

  return (
    <div className={styles.bloque}>
      <h4 className={styles.titulo}>
        Proyectos cerrados ({historicos.length})
        <Tag type={calibrables.length >= MINIMO ? 'green' : 'red'} size="sm">
          {calibrables.length} sirven para calibrar
        </Tag>
      </h4>

      {calibrables.length < RECOMENDADO ? (
        <InlineNotification
          kind={calibrables.length < MINIMO ? 'warning' : 'info'}
          lowContrast
          hideCloseButton
          title={
            calibrables.length < MINIMO
              ? `Faltan ${MINIMO - calibrables.length} para poder calibrar`
              : 'Se puede calibrar, pero con poca muestra'
          }
          subtitle={`Hacen falta ${MINIMO} proyectos con alcance como mínimo y ${RECOMENDADO} para que la calibración sea defendible. Un proyecto sin alcance queda como registro, pero no recalibra nada.`}
        />
      ) : null}

      {historicos.length === 0 ? (
        <p className={styles.nota}>Todavía no hay ninguno. Cárgalos con el formulario de abajo.</p>
      ) : (
        <div className={styles.scroll}>
          <table className={styles.tabla}>
            <thead>
              <tr>
                <th>Proyecto</th>
                <th>Cerrado</th>
                <th>MH estimadas</th>
                <th>MH reales</th>
                <th>Error</th>
                <th>Meses</th>
                <th>Personas</th>
                <th>Alcance</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {historicos.map((h) => {
                const error = h.mhReales > 0 ? (h.mhReales - h.mhEstimadas) / h.mhReales : 0
                return (
                  <tr key={h.id}>
                    <td>{h.nombre}</td>
                    <td>{h.cerradoEn}</td>
                    <td>{h.mhEstimadas.toFixed(1)}</td>
                    <td>{h.mhReales.toFixed(1)}</td>
                    <td>
                      {error >= 0 ? '+' : ''}
                      {(error * 100).toFixed(0)} %
                    </td>
                    <td>{h.mesesReales.toFixed(1)}</td>
                    <td>{h.personasReales.toFixed(1)}</td>
                    <td>
                      <Tag type={h.alcance ? 'green' : 'warm-gray'} size="sm">
                        {h.alcance ? 'calibra' : 'solo registro'}
                      </Tag>
                    </td>
                    <td>
                      <Button
                        kind="ghost"
                        size="sm"
                        type="button"
                        disabled={guardando}
                        onClick={() => onBorrar(h.id)}
                      >
                        Eliminar
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
