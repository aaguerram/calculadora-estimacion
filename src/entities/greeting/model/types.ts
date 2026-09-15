/** Idiomas soportados por el saludo. */
export type GreetingLanguage = 'es' | 'en'

/** Unidad de negocio minima: a quien saludamos y en que idioma. */
export interface Greeting {
  recipient: string
  language: GreetingLanguage
}

export const DEFAULT_GREETING: Greeting = {
  recipient: 'Mundo',
  language: 'es',
}
