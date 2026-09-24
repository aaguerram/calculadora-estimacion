import { InlineNotification, Tag } from '@carbon/react'

import { cx } from '@/shared/lib'

import type { Estimacion, PuntoFrontera } from '../model/types'

import styles from './EstimationSummary.module.scss'

interface EstimationSummaryProps {
  estimacion: Estimacion
  /** Aviso de la carga de coeficientes (no del cálculo). */
  aviso?: string | null
}

const un = (valor: number, decimales = 1) => valor.toFixed(decimales)

const composicion = (p: PuntoFrontera) =>
  `${p.devs} dev · ${p.qa} QA · ${p.devops} ops · ${p.gestion} lead`

export function EstimationSummary({ estimacion, aviso }: EstimationSummaryProps) {
  const { riesgo, equipo, contraste, esfuerzo, alertas } = estimacion
  const { recomendado, masRapido } = equipo

  if (esfuerzo.devBrutoHoras <= 0) {
    return (
      <InlineNotification
        kind="warning"
        lowContrast
        hideCloseButton
        title="Sin alcance"
        subtitle="Agrega features y componentes para obtener una estimación."
      />
    )
  }

  return (
    <div>
      {aviso ? (
        <InlineNotification kind="info" lowContrast hideCloseButton title="Coeficientes" subtitle={aviso} />
      ) : null}

      <div className={styles.respuesta}>
        <div className={styles.dato}>
          <span className={styles.etiqueta}>Esfuerzo P{estimacion.nivelCompromiso}</span>
          <span className={styles.cifra}>{un(riesgo.totalMesesHombre)}</span>
          <span className={styles.unidad}>meses-hombre · {un(riesgo.totalHoras, 0)} h</span>
        </div>
        <div className={styles.dato}>
          <span className={styles.etiqueta}>Equipo óptimo</span>
          <span className={styles.cifra}>{recomendado.personas}</span>
          <span className={styles.unidad}>{composicion(recomendado)}</span>
        </div>
        <div className={styles.dato}>
          <span className={styles.etiqueta}>Duración</span>
          <span className={styles.cifra}>{un(recomendado.duracionMeses)}</span>
          <span className={styles.unidad}>
            meses · arranque {un(equipo.arranqueSerialMeses)} m
          </span>
        </div>
      </div>

      <section className={styles.seccion}>
        <h4 className={styles.titulo}>Banda de confianza (Monte Carlo, riesgo común)</h4>
        <div className={styles.tablaScroll}>
          <table className={styles.tabla}>
            <thead>
              <tr>
                <th>Percentil</th>
                <th>Meses-hombre de desarrollo</th>
                <th>Sobre P50</th>
              </tr>
            </thead>
            <tbody>
              {(
                [
                  ['P50', riesgo.devP50Horas, 50],
                  ['P80', riesgo.devP80Horas, 80],
                  ['P90', riesgo.devP90Horas, 90],
                ] as const
              ).map(([etiqueta, horas, nivel]) => (
                <tr
                  key={etiqueta}
                  className={cx(nivel === estimacion.nivelCompromiso && styles.destacada)}
                >
                  <td>{etiqueta}</td>
                  <td>{un(horas / estimacion.horasPorMesHombre)}</td>
                  <td>{un((horas / riesgo.devP50Horas - 1) * 100, 0)} %</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {esfuerzo.medidas.length > 0 ? (
        <section className={styles.seccion}>
          <h4 className={styles.titulo}>
            Cómo se midió cada feature{' '}
            {esfuerzo.puntosFuncionTotales > 0 ? (
              <Tag type="green" size="sm">
                {esfuerzo.puntosFuncionTotales} PF · {esfuerzo.featuresPorPuntos} de{' '}
                {esfuerzo.medidas.length} features
              </Tag>
            ) : null}
          </h4>
          <div className={styles.tablaScroll}>
            <table className={styles.tabla}>
              <thead>
                <tr>
                  <th>Feature</th>
                  <th>Método</th>
                  <th>PF</th>
                  <th>Por puntos (h)</th>
                  <th>Por componentes (h)</th>
                  <th>Divergencia</th>
                </tr>
              </thead>
              <tbody>
                {esfuerzo.medidas.map((m) => (
                  <tr key={m.featureId}>
                    <td>{m.nombre}</td>
                    <td>
                      <Tag
                        type={m.metodo === 'puntos-funcion' ? 'green' : 'warm-gray'}
                        size="sm"
                      >
                        {m.metodo === 'puntos-funcion' ? 'Puntos función' : 'Estructural'}
                      </Tag>
                    </td>
                    <td>{m.puntosFuncion || '—'}</td>
                    <td>{m.horasPorPuntos > 0 ? un(m.horasPorPuntos, 0) : '—'}</td>
                    <td>{un(m.horasEstructural, 0)}</td>
                    <td>
                      {m.metodo === 'puntos-funcion'
                        ? `${m.divergencia >= 0 ? '+' : ''}${un(m.divergencia * 100, 0)} %`
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className={styles.nota}>
            Los dos métodos miden lo mismo y nunca se suman. Cuando la feature tiene
            elementos marcados manda el de puntos función, y su esfuerzo se reparte entre
            los componentes en la proporción del método estructural, que es lo que
            sostiene los streams y la ruta crítica.
          </p>
        </section>
      ) : null}

      <section className={styles.seccion}>
        <h4 className={styles.titulo}>Streams por componente</h4>
        <div className={styles.tablaScroll}>
          <table className={styles.tabla}>
            <thead>
              <tr>
                <th>Componente</th>
                <th>Meses-hombre</th>
                <th>Devs asignados</th>
                <th>Máx. útil</th>
                <th>Meses</th>
              </tr>
            </thead>
            <tbody>
              {[...equipo.streams]
                .filter((s) => s.mesesHombre > 0)
                .sort((a, b) => b.mesesHombre - a.mesesHombre)
                .map((stream) => {
                  const dotado = recomendado.dotacion.find(
                    (d) => d.componenteId === stream.componenteId,
                  )
                  const esCritico =
                    stream.duracionMinima >= equipo.rutaCriticaMeses * 0.999
                  return (
                    <tr key={stream.componenteId}>
                      <td>
                        {stream.nombre}{' '}
                        {esCritico ? (
                          <Tag type="warm-gray" size="sm">
                            ruta crítica
                          </Tag>
                        ) : null}
                      </td>
                      <td>{un(stream.mesesHombre)}</td>
                      <td>{dotado?.devs ?? 0}</td>
                      <td>{stream.capDevs}</td>
                      <td>{un(dotado?.meses ?? 0)}</td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.seccion}>
        <h4 className={styles.titulo}>Frontera equipo · tiempo · coste</h4>
        <div className={styles.tablaScroll}>
          <table className={styles.tabla}>
            <thead>
              <tr>
                <th>Personas</th>
                <th>Composición</th>
                <th>Duración (meses)</th>
                <th>Coste (MH)</th>
                <th>Coordinación</th>
              </tr>
            </thead>
            <tbody>
              {equipo.frontera.map((punto) => {
                const negativa =
                  punto.personas > masRapido.personas &&
                  punto.duracionMeses > masRapido.duracionMeses
                return (
                  <tr
                    key={punto.personas}
                    className={cx(
                      punto.personas === recomendado.personas && styles.destacada,
                      negativa && styles.negativa,
                    )}
                  >
                    <td>
                      {punto.personas}
                      {negativa ? ' ⚠' : ''}
                    </td>
                    <td>{composicion(punto)}</td>
                    <td>{un(punto.duracionMeses)}</td>
                    <td>{un(punto.mesesHombreFacturables)}</td>
                    <td>×{punto.factorCoordinacion.toFixed(2)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className={styles.nota}>
          Las filas en gris con ⚠ son la zona de rendimientos negativos: más personas,
          más meses y más coste. Contraste COCOMO II: {un(contraste.mesesNominales)} meses
          con {un(contraste.personasNominales)} personas (desviación{' '}
          {un(contraste.desviacionDuracion * 100, 0)} %).
        </p>
      </section>

      {alertas.length > 0 ? (
        <section className={styles.seccion}>
          <h4 className={styles.titulo}>Revisión de la estimación</h4>
          <div className={styles.alertas}>
            {alertas.map((alerta) => (
              <InlineNotification
                key={alerta.clave}
                kind={
                  alerta.nivel === 'critico'
                    ? 'error'
                    : alerta.nivel === 'aviso'
                      ? 'warning'
                      : 'info'
                }
                lowContrast
                hideCloseButton
                title={alerta.nivel === 'critico' ? 'Crítico' : alerta.nivel === 'aviso' ? 'Aviso' : 'Nota'}
                subtitle={alerta.mensaje}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
