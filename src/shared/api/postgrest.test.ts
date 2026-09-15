import { afterEach, describe, expect, it, vi } from 'vitest'

import { ErrorPostgrest, postgrest } from './postgrest'

/**
 * Una Response NUEVA por llamada: el cuerpo de una Response solo se puede leer
 * una vez, así que reutilizar la misma instancia haría fallar la segunda.
 */
function responder(estado: number, cuerpo: string, tipo = 'application/json') {
  return vi.fn().mockImplementation(
    () =>
      new Response(cuerpo === '' ? null : cuerpo, {
        status: estado,
        headers: { 'Content-Type': tipo },
      }),
  )
}

afterEach(() => vi.unstubAllGlobals())

describe('postgrest', () => {
  it('devuelve el JSON cuando lo hay', async () => {
    vi.stubGlobal('fetch', responder(200, '[{"id":"1"}]'))
    await expect(postgrest('/x')).resolves.toEqual([{ id: '1' }])
  })

  it('no revienta con 201 y cuerpo vacío, que es lo que da `return=minimal`', async () => {
    vi.stubGlobal('fetch', responder(201, ''))
    await expect(
      postgrest('/x', { metodo: 'POST', prefer: 'return=minimal', cuerpo: {} }),
    ).resolves.toBeUndefined()
  })

  it('tolera un 204 sin cuerpo', async () => {
    vi.stubGlobal('fetch', responder(204, ''))
    await expect(postgrest('/x', { metodo: 'PATCH', cuerpo: {} })).resolves.toBeUndefined()
  })

  it('traduce el error de PostgREST conservando código y estado', async () => {
    vi.stubGlobal(
      'fetch',
      responder(403, '{"code":"42501","message":"permission denied for table x"}'),
    )
    await expect(postgrest('/x')).rejects.toThrowError(ErrorPostgrest)
    try {
      await postgrest('/x')
    } catch (e) {
      expect((e as ErrorPostgrest).estado).toBe(403)
      expect((e as ErrorPostgrest).codigo).toBe('42501')
      expect((e as ErrorPostgrest).message).toContain('permission denied')
    }
  })

  it('no se atraganta con un error sin cuerpo JSON', async () => {
    vi.stubGlobal('fetch', responder(502, '<html>bad gateway</html>', 'text/html'))
    await expect(postgrest('/x')).rejects.toThrowError(ErrorPostgrest)
  })

  it('selecciona el esquema con Accept-Profile en lecturas', async () => {
    const fetchMock = responder(200, '[]')
    vi.stubGlobal('fetch', fetchMock)
    await postgrest('/fuente', { perfil: 'benchmark' })
    const cabeceras = fetchMock.mock.calls[0][1].headers as Record<string, string>
    expect(cabeceras['Accept-Profile']).toBe('benchmark')
    expect(cabeceras['Content-Profile']).toBeUndefined()
  })

  it('y con Content-Profile en escrituras', async () => {
    const fetchMock = responder(201, '')
    vi.stubGlobal('fetch', fetchMock)
    await postgrest('/fuente', { metodo: 'POST', cuerpo: {}, perfil: 'benchmark' })
    const cabeceras = fetchMock.mock.calls[0][1].headers as Record<string, string>
    expect(cabeceras['Content-Profile']).toBe('benchmark')
  })
})
