import { Button, ProgressIndicator, ProgressStep } from '@carbon/react'

import {
  DESCRIPCION_PASOS,
  PASOS,
  indiceDe,
  puedeIrA,
} from '../model/wizard.reducer'
import type { WizardIntent, WizardState } from '../model/wizard.reducer'

import styles from './PasosGuiados.module.scss'

interface PasosGuiadosProps {
  state: WizardState
  dispatch: (intent: WizardIntent) => void
}

/** Barra de pasos con la explicación de qué aporta el paso actual al cálculo. */
export function PasosGuiados({ state, dispatch }: PasosGuiadosProps) {
  const actual = DESCRIPCION_PASOS[state.paso]
  const indice = indiceDe(state.paso)

  return (
    <>
      <div className={styles.pasos}>
        <ProgressIndicator
          currentIndex={indice}
          spaceEqually
          onChange={(i: number) => dispatch({ type: 'irA', paso: PASOS[i] })}
        >
          {PASOS.map((paso) => (
            // Sin `secondaryLabel`: Carbon la recorta a dos líneas y además
            // duplicaría el resumen, que sale completo en el bloque de abajo.
            <ProgressStep
              key={paso}
              label={DESCRIPCION_PASOS[paso].titulo}
              description={DESCRIPCION_PASOS[paso].resumen}
              disabled={!puedeIrA(state, paso)}
            />
          ))}
        </ProgressIndicator>
      </div>

      <div className={styles.explicacion}>
        <p className={styles.titulo}>{actual.titulo}</p>
        <p className={styles.resumen}>{actual.resumen}</p>
        <span className={styles.etiquetaPorQue}>Por qué importa</span>
        <p className={styles.porQue}>{actual.porQue}</p>
      </div>
    </>
  )
}

/** Botones de avance. Separados para poder ponerlos al final del contenido. */
export function NavegacionPasos({ state, dispatch }: PasosGuiadosProps) {
  const indice = indiceDe(state.paso)
  const ultimo = indice === PASOS.length - 1

  return (
    <div className={styles.navegacion}>
      <Button
        kind="tertiary"
        type="button"
        disabled={indice === 0}
        onClick={() => dispatch({ type: 'anterior' })}
      >
        Anterior
      </Button>
      <span className={styles.contador}>
        Paso {indice + 1} de {PASOS.length}
      </span>
      <Button
        type="button"
        disabled={ultimo || !puedeIrA(state, PASOS[indice + 1])}
        onClick={() => dispatch({ type: 'siguiente' })}
      >
        {ultimo ? 'Terminado' : 'Siguiente'}
      </Button>
    </div>
  )
}
