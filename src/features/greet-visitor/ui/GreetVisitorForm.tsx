import { Button, RadioButton, RadioButtonGroup, TextInput } from '@carbon/react'
import type { FormEvent } from 'react'

import type { GreetingLanguage } from '@/entities/greeting'

import type { GreetVisitorIntent, GreetVisitorState } from '../model/greet-visitor.reducer'

import styles from './GreetVisitorForm.module.scss'

interface GreetVisitorFormProps {
  state: GreetVisitorState
  dispatch: (intent: GreetVisitorIntent) => void
}

/**
 * Vista (V de MVI): renderiza el estado y traduce eventos del usuario a intents.
 * No calcula nada; toda la logica vive en el reducer.
 */
export function GreetVisitorForm({ state, dispatch }: GreetVisitorFormProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    dispatch({ type: 'submitted' })
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <TextInput
        id="greet-visitor-recipient"
        labelText="¿A quién saludamos?"
        placeholder="Mundo"
        value={state.draftRecipient}
        onChange={(event) =>
          dispatch({ type: 'recipientChanged', recipient: event.target.value })
        }
      />

      <RadioButtonGroup
        legendText="Idioma"
        name="greet-visitor-language"
        valueSelected={state.greeting.language}
        onChange={(value) =>
          dispatch({ type: 'languageChanged', language: value as GreetingLanguage })
        }
      >
        <RadioButton labelText="Español" value="es" id="greet-visitor-language-es" />
        <RadioButton labelText="English" value="en" id="greet-visitor-language-en" />
      </RadioButtonGroup>

      <div className={styles.actions}>
        <Button type="submit">Saludar</Button>
        <Button kind="tertiary" type="button" onClick={() => dispatch({ type: 'reset' })}>
          Reiniciar
        </Button>
      </div>
    </form>
  )
}
