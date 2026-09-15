import type { Greeting } from '../model/types'

const TEMPLATES: Record<Greeting['language'], (recipient: string) => string> = {
  es: (recipient) => `¡Hola, ${recipient}!`,
  en: (recipient) => `Hello, ${recipient}!`,
}

/**
 * Regla de negocio pura del dominio "greeting".
 * Sin React, sin DOM: testeable de forma aislada.
 */
export function formatGreeting({ recipient, language }: Greeting): string {
  const normalized = recipient.trim() || (language === 'es' ? 'Mundo' : 'World')
  return TEMPLATES[language](normalized)
}
