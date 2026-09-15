import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { esTokenUtilizable } from './token-store'

/** Construye un JWT de mentira con la caducidad pedida. `btoa` existe en ambos entornos. */
function jwt(expSegundos: number | null): string {
  const b64 = (o: unknown) => btoa(JSON.stringify(o))
  const carga = expSegundos === null ? { sub: 'x' } : { sub: 'x', exp: expSegundos }
  return `${b64({ alg: 'HS256' })}.${b64(carga)}.firma`
}

describe('esTokenUtilizable', () => {
  const AHORA = 1_800_000_000_000

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(AHORA)
  })
  afterEach(() => vi.useRealTimers())

  it('acepta un token vigente', () => {
    expect(esTokenUtilizable(jwt(AHORA / 1000 + 3600))).toBe(true)
  })

  it('rechaza un token caducado: es lo que dejaba toda la app en 401', () => {
    expect(esTokenUtilizable(jwt(AHORA / 1000 - 1))).toBe(false)
  })

  it('rechaza basura que no es un JWT', () => {
    expect(esTokenUtilizable('no-es-un-token')).toBe(false)
    expect(esTokenUtilizable('a.b')).toBe(false)
    expect(esTokenUtilizable('')).toBe(false)
  })

  it('rechaza un JWT con carga ilegible', () => {
    expect(esTokenUtilizable('aaa.no-es-base64-json.ccc')).toBe(false)
  })

  it('acepta un token sin exp: no hay motivo para descartarlo', () => {
    expect(esTokenUtilizable(jwt(null))).toBe(true)
  })

  it('no juzga la firma: eso lo hace PostgREST, y el 401 dispara el reintento', () => {
    // Firmado con otro secreto pero vigente: se usa, falla con 401, y el cliente
    // lo descarta y reintenta con el del entorno.
    expect(esTokenUtilizable(jwt(AHORA / 1000 + 3600))).toBe(true)
  })
})
