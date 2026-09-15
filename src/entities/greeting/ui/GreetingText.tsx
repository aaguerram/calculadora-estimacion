import { formatGreeting } from '../lib/format-greeting'
import type { Greeting } from '../model/types'

import styles from './GreetingText.module.scss'

interface GreetingTextProps {
  greeting: Greeting
}

/**
 * Representacion visual canonica de la entidad `greeting`.
 * Es puramente presentacional: recibe datos, no dispara acciones.
 */
export function GreetingText({ greeting }: GreetingTextProps) {
  return (
    <div>
      <strong className={styles.greeting}>{formatGreeting(greeting)}</strong>
      <span className={styles.meta}>idioma: {greeting.language}</span>
    </div>
  )
}
