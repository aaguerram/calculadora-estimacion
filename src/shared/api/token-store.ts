import { ES_DESARROLLO, leerEnv } from '@/shared/config'

const CLAVE = 'calculadora.postgrest.token'

/**
 * Token precargado desde el entorno.
 *
 * SOLO en desarrollo: lo que entra en `import.meta.env.VITE_*` queda HORNEADO en
 * el bundle y es publico para quien abra el inspector. En produccion el token lo
 * deja el flujo OIDC corporativo en tiempo de ejecucion, y esta via se ignora.
 */
function tokenDeEntorno(): string {
  if (!ES_DESARROLLO) return ''
  return leerEnv('VITE_POSTGREST_TOKEN').trim()
}

type Oyente = (token: string) => void
const oyentes = new Set<Oyente>()

function leerAlmacenado(): string | null {
  try {
    return localStorage.getItem(CLAVE)
  } catch {
    return null
  }
}

// Lo que el usuario haya puesto a mano gana sobre el token del entorno.
let token = leerAlmacenado() ?? tokenDeEntorno()

export function obtenerToken(): string {
  return token
}

/** `true` si el token activo viene de VITE_POSTGREST_TOKEN y no de una sesion. */
export function tokenVieneDelEntorno(): boolean {
  const deEntorno = tokenDeEntorno()
  return deEntorno.length > 0 && token === deEntorno && leerAlmacenado() === null
}

export function fijarToken(valor: string): void {
  const limpio = valor.trim()
  try {
    if (limpio) localStorage.setItem(CLAVE, limpio)
    else localStorage.removeItem(CLAVE)
  } catch {
    /* modo privado: el token vive solo en memoria */
  }
  // Al borrar la sesion se vuelve al token del entorno, si lo hay.
  token = limpio || tokenDeEntorno()
  oyentes.forEach((o) => o(token))
}

export function suscribirToken(oyente: Oyente): () => void {
  oyentes.add(oyente)
  return () => oyentes.delete(oyente)
}
