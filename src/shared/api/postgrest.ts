import { leerEnv } from '@/shared/config'

import { descartarTokenDeSesion, obtenerToken } from './token-store'

/**
 * Base de la API. Relativa por defecto: la sirve el mismo origen que la
 * aplicacion, via proxy de Vite en desarrollo y de nginx en produccion.
 *
 * Los scripts y los tests de integracion corren en Node, donde una ruta
 * relativa no significa nada, asi que la fijan con `fijarUrlBase()`.
 */
let baseUrl: string = leerEnv('VITE_POSTGREST_URL') || '/api'

export function fijarUrlBase(url: string): void {
  baseUrl = url.replace(/\/$/, '')
}

export function obtenerUrlBase(): string {
  return baseUrl
}

export class ErrorPostgrest extends Error {
  // Campos explicitos: `erasableSyntaxOnly` prohibe las propiedades de constructor.
  readonly estado: number
  readonly codigo: string | undefined

  constructor(estado: number, codigo: string | undefined, mensaje: string) {
    super(mensaje)
    this.name = 'ErrorPostgrest'
    this.estado = estado
    this.codigo = codigo
  }
}

interface OpcionesPeticion {
  metodo?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  cuerpo?: unknown
  /** `return=representation` devuelve la fila escrita; es el default en escrituras. */
  prefer?: string
  /**
   * Esquema de Postgres al que dirigir la peticion. Sin esto manda el primero
   * de PGRST_DB_SCHEMAS, que es `estimacion`.
   */
  perfil?: string
  signal?: AbortSignal
}

/**
 * Cliente minimo de PostgREST.
 * `shared` no conoce el dominio: recibe una ruta y devuelve JSON.
 */
export async function postgrest<T>(ruta: string, opciones: OpcionesPeticion = {}): Promise<T> {
  return peticion<T>(ruta, opciones, true)
}

async function peticion<T>(
  ruta: string,
  opciones: OpcionesPeticion,
  permitirReintento: boolean,
): Promise<T> {
  const { metodo = 'GET', cuerpo, prefer, perfil, signal } = opciones

  const cabeceras: Record<string, string> = { Accept: 'application/json' }
  const token = obtenerToken()
  if (token) cabeceras.Authorization = `Bearer ${token}`
  if (cuerpo !== undefined) cabeceras['Content-Type'] = 'application/json'
  if (prefer) cabeceras.Prefer = prefer
  else if (metodo !== 'GET') cabeceras.Prefer = 'return=representation'
  if (perfil) {
    cabeceras[metodo === 'GET' ? 'Accept-Profile' : 'Content-Profile'] = perfil
  }

  const respuesta = await fetch(`${baseUrl}${ruta}`, {
    method: metodo,
    headers: cabeceras,
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    signal,
  })

  if (respuesta.status === 401 && permitirReintento && descartarTokenDeSesion()) {
    // El token de sesion no vale (caducado, o firmado con un secreto ya muerto).
    // Se tira y se reintenta UNA vez con el del entorno, en vez de dejar toda la
    // aplicacion en 401 sin que se entienda por que.
    return peticion<T>(ruta, opciones, false)
  }

  if (!respuesta.ok) {
    let codigo: string | undefined
    let mensaje = `${respuesta.status} ${respuesta.statusText}`
    try {
      const error = (await respuesta.json()) as { code?: string; message?: string }
      codigo = error.code
      if (error.message) mensaje = error.message
    } catch {
      /* el cuerpo no era JSON */
    }
    throw new ErrorPostgrest(respuesta.status, codigo, mensaje)
  }

  // `Prefer: return=minimal` responde 201 con el cuerpo VACIO. Llamar a .json()
  // a ciegas lanza SyntaxError y rompe toda escritura que no pida representacion.
  const texto = await respuesta.text()
  if (texto.length === 0) return undefined as T
  return JSON.parse(texto) as T
}
