import { Button, InlineNotification, Loading, Tag } from '@carbon/react'

import { UMBRALES, motivosDeNoApto } from '@/entities/historical-project'
import { MINIMO_PARA_CALIBRAR_PF } from '../model/aplicar-propuesta'
import type { MetricasCalidad } from '@/entities/historical-project'
import { cx } from '@/shared/lib'

import type { Calibracion } from '../model/use-calibration'

import styles from './CalibrationPanel.module.scss'

const pct = (v: number, d = 0) => (Number.isFinite(v) ? `${(v * 100).toFixed(d)} %` : '—')

function Metrica({
  etiqueta,
  valor,
  cumple,
  objetivo,
}: {
  etiqueta: string
  valor: string
  cumple: boolean
  objetivo: string
}) {
  return (
    <div className={styles.metrica}>
      <span className={styles.etiqueta}>{etiqueta}</span>
      <span className={cx(styles.valor, cumple ? styles.ok : styles.mal)}>{valor}</span>
      <span className={styles.objetivo}>{objetivo}</span>
    </div>
  )
}

function Metricas({ m }: { m: MetricasCalidad }) {
  return (
    <div className={styles.metricas}>
      <Metrica
        etiqueta="MMRE"
        valor={pct(m.mmre)}
        cumple={m.mmre < UMBRALES.mmre}
        objetivo={`objetivo < ${pct(UMBRALES.mmre)}`}
      />
      <Metrica
        etiqueta="PRED(25)"
        valor={pct(m.pred25)}
        cumple={m.pred25 > UMBRALES.pred25}
        objetivo={`objetivo > ${pct(UMBRALES.pred25)}`}
      />
      <Metrica
        etiqueta="Sesgo"
        valor={Number.isFinite(m.sesgo) ? `${m.sesgo >= 0 ? '+' : ''}${pct(m.sesgo)}` : '—'}
        cumple={Math.abs(m.sesgo) < UMBRALES.sesgo}
        objetivo={`objetivo |sesgo| < ${pct(UMBRALES.sesgo)}`}
      />
      <Metrica
        etiqueta="Proyectos"
        valor={String(m.n)}
        cumple={m.n >= 5}
        objetivo="mínimo 3, recomendable 5"
      />
    </div>
  )
}

export function CalibrationPanel({ calibracion }: { calibracion: Calibracion }) {
  const { state, antes, despues, cambios, advertencias, factorGlobal, mejora } = calibracion

  if (state.estado === 'cargando' && state.historicos.length === 0) {
    return (
      <Loading withOverlay={false} small description="Cargando histórico" />
    )
  }

  if (state.estado === 'error' && state.historicos.length === 0) {
    return (
      <InlineNotification
        kind="error"
        lowContrast
        hideCloseButton
        title="No se pudo leer el histórico"
        subtitle={state.error ?? ''}
      />
    )
  }

  if (antes.metricas.n === 0) {
    return (
      <InlineNotification
        kind="info"
        lowContrast
        hideCloseButton
        title="Sin proyectos cerrados"
        subtitle="Archiva proyectos con sus cifras reales para poder calibrar. Sin histórico, los coeficientes son suposiciones."
      />
    )
  }

  return (
    <div>
      {state.error ? (
        <InlineNotification
          kind="error"
          lowContrast
          title="No se pudo aplicar"
          subtitle={state.error}
          onCloseButtonClick={calibracion.cerrarAviso}
        />
      ) : null}
      {state.aplicado ? (
        <InlineNotification
          kind="success"
          lowContrast
          title="Coeficientes actualizados"
          subtitle="Las estimaciones futuras ya usan los valores recalibrados."
          onCloseButtonClick={calibracion.cerrarAviso}
        />
      ) : null}

      <section>
        <h4 className={styles.titulo}>Calidad del modelo hoy</h4>
        <Metricas m={antes.metricas} />
        {antes.metricas.apto ? (
          <p className={styles.nota}>
            El modelo pasa el corte de la literatura. Recalibrar ahora es afinar, no arreglar.
          </p>
        ) : (
          <div className={styles.avisos}>
            {motivosDeNoApto(antes.metricas).map((motivo) => (
              <InlineNotification
                key={motivo}
                kind="warning"
                lowContrast
                hideCloseButton
                title="No apto"
                subtitle={motivo}
              />
            ))}
          </div>
        )}
      </section>

      <section className={styles.seccion}>
        <h4 className={styles.titulo}>
          Cobertura de puntos función{' '}
          <Tag
            type={antes.fraccionPorPuntos >= MINIMO_PARA_CALIBRAR_PF ? 'green' : 'warm-gray'}
            size="sm"
          >
            {pct(antes.fraccionPorPuntos)} del histórico
          </Tag>
        </h4>
        <p className={styles.nota}>
          {antes.fraccionPorPuntos >= MINIMO_PARA_CALIBRAR_PF
            ? 'Hay alcance suficiente medido por elementos, así que las horas por punto función entran en la calibración.'
            : `Por debajo del ${pct(MINIMO_PARA_CALIBRAR_PF)} el histórico no ejercita los puntos función, así que ese coeficiente NO se toca: moverlo sería inventar. Marca los elementos de las features antes de archivar los proyectos.`}
        </p>
      </section>

      <section className={styles.seccion}>
        <h4 className={styles.titulo}>Error por proyecto</h4>
        <div className={styles.scroll}>
          <table className={styles.tabla}>
            <thead>
              <tr>
                <th>Proyecto</th>
                <th>Re-estimado (MH)</th>
                <th>Real (MH)</th>
                <th>Ratio</th>
                <th>MRE</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {antes.errores.map((e) => (
                <tr key={e.id} className={cx(!e.dentroDePred25 && styles.fuera)}>
                  <td>{e.nombre}</td>
                  <td>{e.estimado.toFixed(1)}</td>
                  <td>{e.real.toFixed(1)}</td>
                  <td>×{e.ratio.toFixed(2)}</td>
                  <td>{pct(e.mre)}</td>
                  <td>
                    <Button
                      kind="ghost"
                      size="sm"
                      type="button"
                      disabled={state.guardando}
                      onClick={() => void calibracion.descartar(e.id)}
                    >
                      Quitar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {antes.descartados.length > 0 ? (
          <p className={styles.nota}>
            Fuera del backtest: {antes.descartados.join(' · ')}
          </p>
        ) : null}
      </section>

      <section className={styles.seccion}>
        <h4 className={styles.titulo}>
          Propuesta de recalibración{' '}
          <Tag type="warm-gray" size="sm">
            factor global ×{factorGlobal.toFixed(2)}
          </Tag>
        </h4>

        {cambios.length === 0 ? (
          <p className={styles.nota}>
            No hay nada que ajustar con confianza suficiente. Hacen falta más proyectos
            cerrados, o el modelo ya está calibrado.
          </p>
        ) : (
          <>
            <div className={styles.comparativa}>
              <div>
                <span className={styles.etiqueta}>MMRE ahora</span>
                <span className={cx(styles.valor, styles.mal)}>{pct(antes.metricas.mmre)}</span>
              </div>
              <span className={styles.flecha}>→</span>
              <div>
                <span className={styles.etiqueta}>MMRE con la propuesta</span>
                <span className={cx(styles.valor, mejora ? styles.ok : styles.mal)}>
                  {pct(despues.metricas.mmre)}
                </span>
              </div>
              <div>
                <span className={styles.etiqueta}>PRED(25)</span>
                <span className={styles.valor}>
                  {pct(antes.metricas.pred25)} → {pct(despues.metricas.pred25)}
                </span>
              </div>
            </div>

            <div className={styles.scroll}>
              <table className={styles.tabla}>
                <thead>
                  <tr>
                    <th>Coeficiente</th>
                    <th>Actual</th>
                    <th>Propuesto</th>
                    <th>Variación</th>
                    <th>Confianza</th>
                  </tr>
                </thead>
                <tbody>
                  {cambios.map((c) => (
                    <tr key={c.clave}>
                      <td>{c.etiqueta}</td>
                      <td>{c.valorActual}</td>
                      <td>{c.valorPropuesto}</td>
                      <td>
                        {c.variacion >= 0 ? '+' : ''}
                        {pct(c.variacion)}
                      </td>
                      <td>
                        <Tag
                          type={c.confianza === 'alta' ? 'green' : 'warm-gray'}
                          size="sm"
                        >
                          {c.confianza}
                        </Tag>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {advertencias.length > 0 ? (
          <div className={styles.avisos}>
            {advertencias.map((a) => (
              <InlineNotification
                key={a}
                kind="info"
                lowContrast
                hideCloseButton
                title="Nota"
                subtitle={a}
              />
            ))}
          </div>
        ) : null}

        <div className={styles.acciones}>
          <Button
            type="button"
            disabled={!mejora || state.guardando}
            onClick={() => void calibracion.aplicar()}
          >
            {state.guardando ? 'Aplicando…' : 'Aplicar recalibración'}
          </Button>
          <Button
            kind="tertiary"
            type="button"
            disabled={state.guardando}
            onClick={() => void calibracion.recargar()}
          >
            Recargar histórico
          </Button>
          {!mejora ? (
            <span className={styles.nota}>
              Solo se puede aplicar una propuesta que baje el MMRE sobre el propio
              histórico, con 3 proyectos como mínimo.
            </span>
          ) : null}
        </div>
      </section>
    </div>
  )
}
