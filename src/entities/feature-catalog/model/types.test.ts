import { describe, expect, it } from 'vitest'

import { elementosDisponibles, puntosDeElemento } from './types'
import type { Catalogo, ElementoFeature } from './types'

const elemento = (clave: string, categoria: string, orden = 0): ElementoFeature => ({
  clave,
  categoria,
  nombre: clave,
  descripcion: '',
  tipoFp: 'EI',
  pfSimple: 3,
  pfMedia: 4,
  pfAlta: 6,
  orden,
})

describe('puntosDeElemento', () => {
  const e = elemento('x', 'pantalla')

  it('agrupa los cinco niveles del proyecto en los tres de IFPUG', () => {
    expect(puntosDeElemento(e, 'mb')).toBe(3)
    expect(puntosDeElemento(e, 'b')).toBe(3)
    expect(puntosDeElemento(e, 'm')).toBe(4)
    expect(puntosDeElemento(e, 'a')).toBe(6)
    expect(puntosDeElemento(e, 'ma')).toBe(6)
  })

  it('es monótono: más complejidad nunca son menos puntos', () => {
    const niveles = ['mb', 'b', 'm', 'a', 'ma'] as const
    const puntos = niveles.map((n) => puntosDeElemento(e, n))
    for (let i = 1; i < puntos.length; i++) {
      expect(puntos[i]).toBeGreaterThanOrEqual(puntos[i - 1])
    }
  })
})

describe('elementosDisponibles', () => {
  const catalogo: Catalogo = {
    categorias: [],
    elementos: [
      elemento('pant.form', 'pantalla', 1),
      elemento('pant.lista', 'pantalla', 2),
      elemento('api.get', 'servicio-api', 1),
      elemento('dat.entidad', 'transversal', 1),
    ],
  }

  it('ofrece los de la categoría más los transversales', () => {
    const claves = elementosDisponibles(catalogo, 'pantalla').map((e) => e.clave)
    expect(claves).toEqual(['pant.form', 'pant.lista', 'dat.entidad'])
  })

  it('deja los transversales al final', () => {
    const ultimo = elementosDisponibles(catalogo, 'servicio-api').at(-1)
    expect(ultimo?.categoria).toBe('transversal')
  })

  it('sin categoría solo quedan los transversales', () => {
    expect(elementosDisponibles(catalogo, null).map((e) => e.clave)).toEqual(['dat.entidad'])
  })
})
