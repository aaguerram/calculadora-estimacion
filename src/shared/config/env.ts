/**
 * Acceso seguro a las variables de entorno del bundler.
 *
 * `import.meta.env` solo existe cuando el codigo corre a traves de Vite o
 * Vitest. Los scripts de linea de comandos importan estos mismos modulos
 * directamente con Node, donde no existe: sin este resguardo, cualquier script
 * que toque la API revienta al arrancar.
 */
const ENTORNO = (import.meta.env ?? {}) as Record<string, unknown>

export function leerEnv(clave: string): string {
  const valor = ENTORNO[clave]
  return typeof valor === 'string' ? valor : ''
}

/** `true` solo en desarrollo servido por el bundler. Falso en build y en scripts. */
export const ES_DESARROLLO = ENTORNO.DEV === true
