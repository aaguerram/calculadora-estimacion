import { leerEnv } from '@/shared/config'

import { obtenerToken } from './token-store'

const BASE_URL: string = leerEnv('VITE_POSTGREST_URL') || 'http://localhost:3000'

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

  const respuesta = await fetch(`${BASE_URL}${ruta}`, {
    method: metodo,
    headers: cabeceras,
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    signal,
  })

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
