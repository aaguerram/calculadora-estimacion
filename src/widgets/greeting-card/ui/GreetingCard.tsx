import { GreetingText } from '@/entities/greeting'
import { GreetVisitorForm, useGreetVisitor } from '@/features/greet-visitor'
import { PageSection } from '@/shared/ui'

import styles from './GreetingCard.module.scss'

/**
 * Widget: compone un feature (interaccion) con una entity (representacion).
 * Es el unico lugar donde ambos se conocen.
 */
export function GreetingCard() {
  const { state, dispatch } = useGreetVisitor()

  return (
    <PageSection
      title="Hola mundo"
      description="Demo mínima que recorre las cinco capas de Feature-Sliced Design."
    >
      <GreetVisitorForm state={state} dispatch={dispatch} />

      <div className={styles.result}>
        {state.hasBeenSubmitted ? (
          <GreetingText greeting={state.greeting} />
        ) : (
          <p className={styles.placeholder}>Escribe un nombre y pulsa «Saludar».</p>
        )}
      </div>
    </PageSection>
  )
}
