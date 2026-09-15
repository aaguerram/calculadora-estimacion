/**
 * Constantes de configuracion de la aplicacion.
 * `shared` no conoce ningun dominio de negocio: solo valores y utilidades genericas.
 */
export const APP_CONFIG = {
  name: 'Calculadora',
  locale: 'es-EC',
  repositoryLayer: 'feature-sliced-design',
} as const

export type AppConfig = typeof APP_CONFIG
