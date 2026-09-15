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

/**
 * Un JWT sirve si se puede leer y no ha caducado.
 *
 * Sin esta comprobacion, un token viejo en localStorage TAPA al del entorno y la
 * aplicacion entera responde 401 sin explicacion. Pasa en cuanto se reinicia el
 * stack: la base se recrea, el token se regenera, y el navegador sigue mandando
 * el anterior.
 */
export function esTokenUtilizable(token: string): boolean {
  const partes = token.split('.')
  if (partes.length !== 3) return false
  try {
    const carga = JSON.parse(atob(partes[1])) as { exp?: number }
    if (typeof carga.exp !== 'number') return true
    return carga.exp * 1000 > Date.now()
  } catch {
    return false
  }
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

function borrarAlmacenado(): void {
  try {
    localStorage.removeItem(CLAVE)
  } catch {
    /* modo privado */
  }
}

function tokenInicial(): string {
  const guardado = leerAlmacenado()
  if (guardado && esTokenUtilizable(guardado)) return guardado
  // Un token guardado inservible se tira: nunca debe tapar al del entorno.
  if (guardado) borrarAlmacenado()
  return tokenDeEntorno()
}

let token = tokenInicial()

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
  if (limpio) {
    try {
      localStorage.setItem(CLAVE, limpio)
    } catch {
      /* modo privado: el token vive solo en memoria */
    }
  } else {
    borrarAlmacenado()
  }
  // Al borrar la sesion se vuelve al token del entorno, si lo hay.
  token = limpio || tokenDeEntorno()
  oyentes.forEach((o) => o(token))
}

/**
 * Descarta el token de sesion y vuelve al del entorno.
 * Devuelve `true` si de verdad habia otro al que volver.
 */
export function descartarTokenDeSesion(): boolean {
  const deEntorno = tokenDeEntorno()
  if (leerAlmacenado() === null || deEntorno === '' || deEntorno === token) return false
  borrarAlmacenado()
  token = deEntorno
  oyentes.forEach((o) => o(token))
  return true
}

export function suscribirToken(oyente: Oyente): () => void {
  oyentes.add(oyente)
  return () => oyentes.delete(oyente)
}
