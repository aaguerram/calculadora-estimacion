import { COEFICIENTES_POR_DEFECTO } from '@/entities/estimation-model'
import type { Catalogo } from '@/entities/feature-catalog'
import { describe, expect, it } from 'vitest'

import { calcularEsfuerzo, puntosDeFeature } from './calcular-esfuerzo'
import { ejecutarEstimacion } from './run-estimation'
import type { Alcance, FeatureAlcance } from './types'

const C = COEFICIENTES_POR_DEFECTO
const HPP = C.puntosFuncion.horasDevPorPunto // 5.2

const CATALOGO: Catalogo = {
  categorias: [
    { clave: 'pantalla', nombre: 'Pantalla', descripcion: '', orden: 1 },
    { clave: 'transversal', nombre: 'Transversal', descripcion: '', orden: 98 },
  ],
  elementos: [
    { clave: 'pant.form', categoria: 'pantalla', nombre: 'Formulario', descripcion: '', tipoFp: 'EI', pfSimple: 3, pfMedia: 4, pfAlta: 6, orden: 1 },
    { clave: 'pant.lista', categoria: 'pantalla', nombre: 'Listado', descripcion: '', tipoFp: 'EQ', pfSimple: 3, pfMedia: 4, pfAlta: 6, orden: 2 },
    { clave: 'dat.entidad', categoria: 'transversal', nombre: 'Entidad', descripcion: '', tipoFp: 'ILF', pfSimple: 7, pfMedia: 10, pfAlta: 15, orden: 1 },
  ],
}

function alcance(features: FeatureAlcance[]): Alcance {
  return {
    nombre: 'test',
    jornada: { horasDia: 6, diasMes: 20 },
    nivelCompromiso: 80,
    componentes: [
      { id: 'web', nombre: 'Web', tipo: 'front-angular', stack: 'angular17', esNuevo: false },
      { id: 'core', nombre: 'Core', tipo: 'micro-core', stack: 'net8', esNuevo: false },
    ],
    features,
    integraciones: [],
    drivers: [],
  }
}

const feature = (parcial: Partial<FeatureAlcance> = {}): FeatureAlcance => ({
  id: 'f1',
  nombre: 'F1',
  complejidad: 'm',
  categoria: 'pantalla',
  toca: [{ componenteId: 'web' }, { componenteId: 'core' }],
  elementos: [],
  ...parcial,
})

describe('puntosDeFeature', () => {
  it('suma cantidad × peso IFPUG del nivel elegido', () => {
    const f = feature({
      elementos: [
        { elemento: 'pant.form', cantidad: 1, complejidad: 'm' }, // 4
        { elemento: 'pant.lista', cantidad: 3, complejidad: 'a' }, // 3 × 6 = 18
        { elemento: 'dat.entidad', cantidad: 1, complejidad: 'm' }, // 10
      ],
    })
    expect(puntosDeFeature(f, CATALOGO)).toBe(32)
  })

  it('ignora elementos que no están en el catálogo', () => {
    const f = feature({ elementos: [{ elemento: 'fantasma', cantidad: 5, complejidad: 'a' }] })
    expect(puntosDeFeature(f, CATALOGO)).toBe(0)
  })

  it('sin elementos son cero puntos', () => {
    expect(puntosDeFeature(feature(), CATALOGO)).toBe(0)
  })
})

describe('calcularEsfuerzo con puntos función', () => {
  const conElementos = feature({
    elementos: [
      { elemento: 'pant.form', cantidad: 1, complejidad: 'm' },
      { elemento: 'dat.entidad', cantidad: 1, complejidad: 'm' },
    ],
  }) // 4 + 10 = 14 PF

  it('sin catálogo cae al método estructural', () => {
    const r = calcularEsfuerzo(alcance([conElementos]), C)
    expect(r.medidas[0].metodo).toBe('estructural')
    expect(r.featuresPorPuntos).toBe(0)
    // 40 (front) + 60 (core), ambos a complejidad media
    expect(r.devBrutoHoras).toBeCloseTo(100, 6)
  })

  it('con catálogo y elementos manda el método de puntos función', () => {
    const r = calcularEsfuerzo(alcance([conElementos]), C, CATALOGO)
    expect(r.medidas[0].metodo).toBe('puntos-funcion')
    expect(r.puntosFuncionTotales).toBe(14)
    expect(r.devBrutoHoras).toBeCloseTo(14 * HPP, 6)
  })

  it('NO suma los dos métodos: eso contaría el trabajo dos veces', () => {
    const r = calcularEsfuerzo(alcance([conElementos]), C, CATALOGO)
    const estructural = r.medidas[0].horasEstructural
    const porPuntos = r.medidas[0].horasPorPuntos
    expect(r.devBrutoHoras).not.toBeCloseTo(estructural + porPuntos, 1)
    expect(r.devBrutoHoras).toBeCloseTo(porPuntos, 6)
  })

  it('reparte las horas entre componentes en la proporción estructural', () => {
    const r = calcularEsfuerzo(alcance([conElementos]), C, CATALOGO)
    // El reparto conserva 40:60, que es lo que sostiene los streams.
    expect(r.horasPorComponente.web / r.horasPorComponente.core).toBeCloseTo(40 / 60, 6)
    expect(r.horasPorComponente.web + r.horasPorComponente.core).toBeCloseTo(14 * HPP, 6)
  })

  it('una feature sin elementos sigue siendo estructural aunque haya catálogo', () => {
    const r = calcularEsfuerzo(alcance([feature({ id: 'f2' })]), C, CATALOGO)
    expect(r.medidas[0].metodo).toBe('estructural')
    expect(r.devBrutoHoras).toBeCloseTo(100, 6)
  })

  it('mezcla ambos métodos cuando unas features están marcadas y otras no', () => {
    const r = calcularEsfuerzo(
      alcance([conElementos, feature({ id: 'f2', nombre: 'F2' })]),
      C,
      CATALOGO,
    )
    expect(r.featuresPorPuntos).toBe(1)
    expect(r.devBrutoHoras).toBeCloseTo(14 * HPP + 100, 6)
  })

  it('con elementos pero sin componentes no hay dónde repartir: no aporta esfuerzo', () => {
    const r = calcularEsfuerzo(
      alcance([feature({ toca: [], elementos: conElementos.elementos })]),
      C,
      CATALOGO,
    )
    expect(r.medidas[0].metodo).toBe('estructural')
    expect(r.devBrutoHoras).toBe(0)
  })

  it('deja trazado el método usado y lo que decía el otro', () => {
    const [medida] = calcularEsfuerzo(alcance([conElementos]), C, CATALOGO).medidas
    expect(medida.puntosFuncion).toBe(14)
    expect(medida.horasEstructural).toBeCloseTo(100, 6)
    expect(medida.horasPorPuntos).toBeCloseTo(14 * HPP, 6)
    expect(medida.divergencia).toBeCloseTo((14 * HPP) / 100 - 1, 6)
  })

  it('más elementos marcados es más esfuerzo', () => {
    const pocos = calcularEsfuerzo(alcance([conElementos]), C, CATALOGO).devBrutoHoras
    const muchos = calcularEsfuerzo(
      alcance([
        feature({
          elementos: [
            ...conElementos.elementos,
            { elemento: 'pant.lista', cantidad: 4, complejidad: 'a' },
          ],
        }),
      ]),
      C,
      CATALOGO,
    ).devBrutoHoras
    expect(muchos).toBeGreaterThan(pocos)
  })
})

describe('alerta de divergencia entre métodos', () => {
  it('avisa cuando los dos métodos no se parecen', () => {
    // 1 formulario simple contra dos componentes pesados: los métodos discrepan.
    const r = ejecutarEstimacion(
      alcance([feature({ elementos: [{ elemento: 'pant.form', cantidad: 1, complejidad: 'mb' }] })]),
      { catalogo: CATALOGO, iteraciones: 500 },
    )
    expect(r.alertas.map((a) => a.clave)).toContain('divergencia-medida:f1')
  })

  it('avisa si solo una parte del alcance está marcada', () => {
    const r = ejecutarEstimacion(
      alcance([
        feature({ elementos: [{ elemento: 'pant.form', cantidad: 1, complejidad: 'm' }] }),
        feature({ id: 'f2', nombre: 'F2' }),
      ]),
      { catalogo: CATALOGO, iteraciones: 500 },
    )
    expect(r.alertas.map((a) => a.clave)).toContain('medida-mixta')
  })

  it('no avisa cuando los dos métodos coinciden', () => {
    // 100 h estructurales ≈ 19.2 PF × 5.2
    const r = ejecutarEstimacion(
      alcance([
        feature({
          elementos: [
            { elemento: 'dat.entidad', cantidad: 1, complejidad: 'a' }, // 15
            { elemento: 'pant.form', cantidad: 1, complejidad: 'm' }, // 4
          ],
        }),
      ]),
      { catalogo: CATALOGO, iteraciones: 500 },
    )
    expect(r.alertas.map((a) => a.clave)).not.toContain('divergencia-medida:f1')
  })
})
