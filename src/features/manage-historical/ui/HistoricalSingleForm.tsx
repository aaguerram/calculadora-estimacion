import { Button, NumberInput, TextInput } from '@carbon/react'
import { useState } from 'react'

import { parsearHistoricos } from '@/entities/historical-project'
import type { ResultadoImportacion } from '@/entities/historical-project'
import { CampoConAyuda } from '@/shared/ui'

import styles from './historico.module.scss'

interface HistoricalSingleFormProps {
  guardando: boolean
  onCargar: (resultado: ResultadoImportacion) => void
}

const VACIO = {
  nombre: '',
  cerradoEn: new Date().toISOString().slice(0, 10),
  mhEstimadas: 0,
  mhReales: 0,
  mesesReales: 0,
  personasReales: 0,
}

/**
 * Alta de UN proyecto cerrado.
 *
 * Valida con el MISMO parser que la importación masiva: una sola definición de
 * qué es un cierre válido, no dos que puedan divergir.
 */
export function HistoricalSingleForm({ guardando, onCargar }: HistoricalSingleFormProps) {
  const [campos, setCampos] = useState(VACIO)
  const [errores, setErrores] = useState<ResultadoImportacion['errores']>([])

  const poner = (k: keyof typeof VACIO, v: string | number) =>
    setCampos((c) => ({ ...c, [k]: v }))

  const enviar = () => {
    const resultado = parsearHistoricos(JSON.stringify([campos]))
    setErrores(resultado.errores)
    if (resultado.errores.length === 0) {
      onCargar(resultado)
      setCampos(VACIO)
    }
  }

  return (
    <div className={styles.bloque}>
      <h4 className={styles.titulo}>Cargar un proyecto cerrado</h4>
      <p className={styles.nota}>
        Con esto queda el registro de lo que se estimó frente a lo que costó. Para que
        además <strong>recalibre</strong> el modelo hace falta su alcance: reconstrúyelo
        en «Ingresar proyecto» y archívalo desde ahí, o pégalo abajo en formato JSON.
      </p>

      <div className={styles.formulario}>
        <CampoConAyuda
          className={styles.anchoTotal}
          ayuda="Cómo se llamó el proyecto. Tiene que ser único."
          efecto="Ninguno sobre el cálculo."
        >
          <TextInput
            id="hist-nombre"
            labelText="Nombre del proyecto"
            value={campos.nombre}
            onChange={(e) => poner('nombre', e.target.value)}
          />
        </CampoConAyuda>

        <CampoConAyuda
          ayuda="Fecha en que se dio por terminado, en formato AAAA-MM-DD."
          efecto="Solo ordena el histórico; no entra en el cálculo."
        >
          <TextInput
            id="hist-fecha"
            labelText="Cerrado el"
            placeholder="2025-03-31"
            value={campos.cerradoEn}
            onChange={(e) => poner('cerradoEn', e.target.value)}
          />
        </CampoConAyuda>

        <CampoConAyuda
          ayuda="Lo que se comprometió en su momento, en meses-hombre."
          efecto="Queda como registro histórico. La calibración usa lo que el modelo estima HOY, no esta cifra."
        >
          <NumberInput
            id="hist-mh-est"
            label="MH estimadas"
            min={0}
            step={0.5}
            value={campos.mhEstimadas}
            onChange={(_e, { value }) => poner('mhEstimadas', Number(value) || 0)}
          />
        </CampoConAyuda>

        <CampoConAyuda
          ayuda="Lo que costó de verdad, en meses-hombre: horas imputadas dividido por la jornada del proyecto."
          efecto="Es la cifra contra la que se mide el modelo. Si está mal, la calibración estará mal."
        >
          <NumberInput
            id="hist-mh-real"
            label="MH reales"
            min={0}
            step={0.5}
            value={campos.mhReales}
            onChange={(_e, { value }) => poner('mhReales', Number(value) || 0)}
          />
        </CampoConAyuda>

        <CampoConAyuda
          ayuda="Meses de calendario entre el arranque y la entrega."
          efecto="Sirve para contrastar la duración que propone el modelo."
        >
          <NumberInput
            id="hist-meses"
            label="Meses reales"
            min={0}
            step={0.5}
            value={campos.mesesReales}
            onChange={(_e, { value }) => poner('mesesReales', Number(value) || 0)}
          />
        </CampoConAyuda>

        <CampoConAyuda
          ayuda="Tamaño medio del equipo, contando QA, DevOps y gestión."
          efecto="Sirve para contrastar el equipo óptimo que propone el modelo."
        >
          <NumberInput
            id="hist-personas"
            label="Personas reales"
            min={0}
            step={0.5}
            value={campos.personasReales}
            onChange={(_e, { value }) => poner('personasReales', Number(value) || 0)}
          />
        </CampoConAyuda>
      </div>

      {errores.length > 0 ? (
        <ul className={styles.errores}>
          {errores.map((e) => (
            <li key={`${e.fila}-${e.campo}`}>
              <span className={styles.clave}>{e.campo}</span>: {e.motivo}
            </li>
          ))}
        </ul>
      ) : null}

      <div className={styles.acciones}>
        <Button type="button" disabled={guardando} onClick={enviar}>
          {guardando ? 'Cargando…' : 'Cargar proyecto cerrado'}
        </Button>
      </div>
    </div>
  )
}
