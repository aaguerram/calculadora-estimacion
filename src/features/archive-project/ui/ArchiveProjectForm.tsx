import { Button, InlineNotification, NumberInput, TextInput } from '@carbon/react'
import type { FormEvent } from 'react'

import type { Alcance } from '@/entities/project-scope'

import { esArchivable, useArchiveProject } from '../model/use-archive-project'

import styles from './ArchiveProjectForm.module.scss'

interface ArchiveProjectFormProps {
  alcance: Alcance
  /** Lo que el modelo estima hoy: queda como registro del compromiso. */
  mhEstimadas: number
  alArchivar?: () => void
}

export function ArchiveProjectForm({
  alcance,
  mhEstimadas,
  alArchivar,
}: ArchiveProjectFormProps) {
  const { state, dispatch, enviar } = useArchiveProject(alcance, mhEstimadas, alArchivar)

  const onSubmit = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault()
    void enviar()
  }

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <div className={styles.campo}>
        <NumberInput
          id="cierre-mh"
          size="sm"
          label="Meses-hombre reales"
          min={0}
          step={0.5}
          value={state.mhReales}
          onChange={(_e, { value }) =>
            dispatch({ type: 'mhCambiadas', valor: Number(value) || 0 })
          }
        />
      </div>
      <div className={styles.campo}>
        <NumberInput
          id="cierre-meses"
          size="sm"
          label="Meses reales"
          min={0}
          step={0.5}
          value={state.mesesReales}
          onChange={(_e, { value }) =>
            dispatch({ type: 'mesesCambiados', valor: Number(value) || 0 })
          }
        />
      </div>
      <div className={styles.campo}>
        <NumberInput
          id="cierre-personas"
          size="sm"
          label="Personas reales"
          min={0}
          step={0.5}
          value={state.personasReales}
          onChange={(_e, { value }) =>
            dispatch({ type: 'personasCambiadas', valor: Number(value) || 0 })
          }
        />
      </div>
      <div className={styles.campo}>
        <TextInput
          id="cierre-fecha"
          size="sm"
          labelText="Cerrado el"
          placeholder="2026-09-14"
          value={state.cerradoEn}
          onChange={(e) => dispatch({ type: 'fechaCambiada', valor: e.target.value })}
        />
      </div>
      <Button type="submit" size="sm" disabled={!esArchivable(state)}>
        {state.enviando ? 'Archivando…' : 'Archivar para calibrar'}
      </Button>

      <p className={styles.nota}>
        Se guarda una foto del alcance actual junto a las cifras reales. El modelo
        estima hoy <strong>{mhEstimadas.toFixed(1)} MH</strong> para este alcance.
      </p>

      {state.error ? (
        <InlineNotification
          kind="error"
          lowContrast
          title="No se pudo archivar"
          subtitle={state.error}
          onCloseButtonClick={() => dispatch({ type: 'avisoCerrado' })}
        />
      ) : null}
      {state.archivado ? (
        <InlineNotification
          kind="success"
          lowContrast
          title="Archivado"
          subtitle={`«${state.archivado}» ya cuenta para la calibración.`}
          onCloseButtonClick={() => dispatch({ type: 'avisoCerrado' })}
        />
      ) : null}
    </form>
  )
}
