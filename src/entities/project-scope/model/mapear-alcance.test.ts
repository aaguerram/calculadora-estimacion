import { describe, expect, it } from 'vitest'

import { CATALOGO_DRIVERS, posturaDeDelta } from './catalogo-drivers'
import { mapearAlcance, resumirAlcance } from './mapear-alcance'
import type { FilaScopeProyecto } from './mapear-alcance'

const FILA: FilaScopeProyecto = {
  id: 'p1',
  nombre: 'Banca',
  horas_dia: '6.00',
  dias_mes: 20,
  nivel_compromiso: 80,
  componente: [
    {
      id: 'c1',
      nombre: 'Core',
      tipo: 'micro-core',
      stack: 'net8',
      es_nuevo: true,
      cap_devs_override: null,
    },
    {
      id: 'c2',
      nombre: 'Legacy',
      tipo: 'monolito-netfx',
      stack: 'netfx',
      es_nuevo: false,
      cap_devs_override: 1,
    },
  ],
  feature: [
    {
      id: 'f2',
      nombre: 'Segunda',
      complejidad: 'm',
      categoria: 'reporte',
      orden: 2,
      feature_componente: [{ componente_id: 'c1', complejidad_override: 'a' }],
      feature_elemento: [{ elemento: 'rep.calculado', cantidad: 2, complejidad: 'a' }],
    },
    {
      id: 'f1',
      nombre: 'Primera',
      complejidad: 'a',
      categoria: null,
      orden: 1,
      feature_componente: [
        { componente_id: 'c1', complejidad_override: null },
        { componente_id: 'c2', complejidad_override: null },
      ],
      feature_elemento: null,
    },
  ],
  integracion: [
    {
      id: 'i1',
      nombre: 'Core bancario',
      complejidad: 'ma',
      componente_duenio_id: 'c1',
      es_externa: false,
      tiene_sandbox: false,
      usos: 3,
    },
  ],
  driver: [{ clave: 'claridad-requisitos', delta: '0.150' }],
}

describe('mapearAlcance', () => {
  const alcance = mapearAlcance(FILA)

  it('convierte los numeric de Postgres, que llegan como string', () => {
    expect(alcance.jornada.horasDia).toBe(6)
    expect(alcance.drivers.find((d) => d.clave === 'claridad-requisitos')?.delta).toBe(0.15)
  })

  it('ordena las features por su campo orden', () => {
    expect(alcance.features.map((f) => f.nombre)).toEqual(['Primera', 'Segunda'])
  })

  it('traduce la categoría (eje 1) y los elementos (eje 3)', () => {
    const segunda = alcance.features.find((f) => f.id === 'f2')!
    expect(segunda.categoria).toBe('reporte')
    expect(segunda.elementos).toEqual([
      { elemento: 'rep.calculado', cantidad: 2, complejidad: 'a' },
    ])
  })

  it('una feature sin clasificar deja la categoría en null y los elementos vacíos', () => {
    const primera = alcance.features.find((f) => f.id === 'f1')!
    expect(primera.categoria).toBeNull()
    expect(primera.elementos).toEqual([])
  })

  it('traduce los pares feature × componente', () => {
    expect(alcance.features[0].toca.map((t) => t.componenteId)).toEqual(['c1', 'c2'])
    expect(alcance.features[1].toca[0].complejidad).toBe('a')
  })

  it('omite el override de complejidad cuando es null, no lo pasa como undefined explícito', () => {
    expect('complejidad' in alcance.features[0].toca[0]).toBe(false)
  })

  it('respeta el cap de devs propio y omite el nulo', () => {
    expect(alcance.componentes[1].capDevs).toBe(1)
    expect('capDevs' in alcance.componentes[0]).toBe(false)
  })

  it('completa los drivers que faltan en postura nominal', () => {
    expect(alcance.drivers).toHaveLength(CATALOGO_DRIVERS.length)
    const madurez = alcance.drivers.find((d) => d.clave === 'madurez-dominio')
    expect(madurez?.delta).toBe(0)
    expect(madurez?.etiqueta).toBe('Madurez del equipo en el dominio')
  })

  it('descarta integraciones sin componente dueño: no caben en ningún stream', () => {
    const sinDuenio = mapearAlcance({
      ...FILA,
      integracion: [{ ...FILA.integracion![0], componente_duenio_id: null }],
    })
    expect(sinDuenio.integraciones).toEqual([])
  })

  it('tolera un proyecto sin nada embebido', () => {
    const vacio = mapearAlcance({
      ...FILA,
      componente: null,
      feature: null,
      integracion: null,
      driver: null,
    })
    expect(vacio.componentes).toEqual([])
    expect(vacio.features).toEqual([])
    expect(vacio.drivers).toHaveLength(CATALOGO_DRIVERS.length)
  })

  it('normaliza un nivel de compromiso inválido a P80', () => {
    expect(mapearAlcance({ ...FILA, nivel_compromiso: 73 }).nivelCompromiso).toBe(80)
    expect(mapearAlcance({ ...FILA, nivel_compromiso: 90 }).nivelCompromiso).toBe(90)
  })
})

describe('resumirAlcance', () => {
  it('cuenta los pares, que es la unidad real de estimación', () => {
    expect(resumirAlcance(mapearAlcance(FILA))).toEqual({
      componentes: 2,
      features: 2,
      integraciones: 1,
      pares: 3,
      sinClasificar: 1,
      elementos: 2,
    })
  })
})

describe('posturaDeDelta', () => {
  const claridad = CATALOGO_DRIVERS[1]

  it('reconoce las tres posturas por su delta', () => {
    expect(posturaDeDelta(claridad, -0.1)).toBe('favorable')
    expect(posturaDeDelta(claridad, 0)).toBe('nominal')
    expect(posturaDeDelta(claridad, 0.2)).toBe('adverso')
  })

  it('con un delta intermedio elige la postura más cercana', () => {
    expect(posturaDeDelta(claridad, 0.17)).toBe('adverso')
    expect(posturaDeDelta(claridad, 0.03)).toBe('nominal')
  })
})
