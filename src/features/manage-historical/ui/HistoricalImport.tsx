import { Button, TextArea } from '@carbon/react'
import { useState } from 'react'

import { EJEMPLO_IMPORTACION, parsearHistoricos } from '@/entities/historical-project'
import type { ResultadoImportacion } from '@/entities/historical-project'

import styles from './historico.module.scss'

interface HistoricalImportProps {
  guardando: boolean
  onCargar: (resultado: ResultadoImportacion) => void
}

/** Carga masiva pegando JSON. Valida y muestra qué entraría antes de escribir nada. */
export function HistoricalImport({ guardando, onCargar }: HistoricalImportProps) {
  const [texto, setTexto] = useState('')
  const [revision, setRevision] = useState<ResultadoImportacion | null>(null)

  const revisar = () => setRevision(parsearHistoricos(texto))

  return (
    <div className={styles.bloque}>
      <h4 className={styles.titulo}>Cargar varios de golpe</h4>
      <p className={styles.nota}>
        Pega una lista en JSON. Se revisa <strong>antes</strong> de escribir nada y se te
        dice fila por fila qué falla. Los que traigan <code>alcance</code> recalibran; los
        que no, quedan solo como registro.
      </p>

      <TextArea
        id="hist-json"
        labelText="Proyectos cerrados en JSON"
        placeholder='[{ "nombre": "...", "cerradoEn": "2025-03-31", ... }]'
        rows={10}
        value={texto}
        onChange={(e) => {
          setTexto(e.target.value)
          setRevision(null)
        }}
      />

      {revision ? (
        <>
          {revision.errores.length > 0 ? (
            <ul className={styles.errores}>
              {revision.errores.map((e) => (
                <li key={`${e.fila}-${e.campo}-${e.motivo}`}>
                  fila {e.fila} · <span className={styles.clave}>{e.campo}</span>: {e.motivo}
                </li>
              ))}
            </ul>
          ) : null}
          <p className={styles.nota}>
            {revision.validos.length} listo(s) para cargar ·{' '}
            {revision.validos.filter((v) => v.calibra).length} con alcance ·{' '}
            {revision.errores.length} con problemas.
          </p>
        </>
      ) : null}

      <div className={styles.acciones}>
        <Button kind="tertiary" type="button" disabled={!texto.trim()} onClick={revisar}>
          Revisar
        </Button>
        <Button
          type="button"
          disabled={guardando || !revision || revision.validos.length === 0}
          onClick={() => {
            if (revision) onCargar(revision)
            setTexto('')
            setRevision(null)
          }}
        >
          Cargar {revision?.validos.length ?? 0}
        </Button>
        <Button
          kind="ghost"
          type="button"
          onClick={() => {
            setTexto(EJEMPLO_IMPORTACION)
            setRevision(null)
          }}
        >
          Pegar un ejemplo del formato
        </Button>
      </div>
    </div>
  )
}
