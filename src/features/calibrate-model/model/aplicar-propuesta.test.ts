import { COEFICIENTES_POR_DEFECTO } from '@/entities/estimation-model'
import type { PropuestaCalibracion } from '@/entities/historical-project'
import { describe, expect, it } from 'vitest'

import {
  aFilaCoeficiente,
  construirCambios,
  simularCambios,
  unidadDeCoeficiente,
} from './aplicar-propuesta'

const propuesta = (parcial: Partial<PropuestaCalibracion> = {}): PropuestaCalibracion => ({
  factorGlobal: 1.2,
  sigmaComun: 0.22,
  ajustes: [],
  advertencias: [],
  ...parcial,
})

const ajuste = (clave: string, factor: number, confianza: 'alta' | 'media' | 'baja') => ({
  clave,
  factor,
  pesoMedio: 0.2,
  proyectosConPeso: 5,
  confianza,
})

describe('construirCambios', () => {
  it('escala las horas base por el factor del tipo', () => {
    const cambios = construirCambios(
      COEFICIENTES_POR_DEFECTO,
      propuesta({ ajustes: [ajuste('micro-core', 1.25, 'alta')] }),
    )
    const core = cambios.find((c) => c.clave === 'base.micro-core')!
    expect(core.valorActual).toBe(60)
    expect(core.valorPropuesto).toBe(75)
    expect(core.variacion).toBeCloseTo(0.25, 10)
  })

  it('descarta los ajustes de confianza baja: son ruido, no calibración', () => {
    const cambios = construirCambios(
      COEFICIENTES_POR_DEFECTO,
      propuesta({ ajustes: [ajuste('bff', 1.8, 'baja')] }),
    )
    expect(cambios.some((c) => c.clave === 'base.bff')).toBe(false)
  })

  it('acepta confianza media', () => {
    const cambios = construirCambios(
      COEFICIENTES_POR_DEFECTO,
      propuesta({ ajustes: [ajuste('bff', 1.3, 'media')] }),
    )
    expect(cambios.some((c) => c.clave === 'base.bff')).toBe(true)
  })

  it('ignora buckets que no son tipos de componente', () => {
    const cambios = construirCambios(
      COEFICIENTES_POR_DEFECTO,
      propuesta({ ajustes: [ajuste('inventado', 1.5, 'alta')] }),
    )
    expect(cambios.some((c) => c.clave.includes('inventado'))).toBe(false)
  })

  it('propone siempre el sigma medido sobre los residuos', () => {
    const cambios = construirCambios(COEFICIENTES_POR_DEFECTO, propuesta())
    const sigma = cambios.find((c) => c.clave === 'riesgo.sigma-comun')!
    expect(sigma.valorActual).toBe(0.18)
    expect(sigma.valorPropuesto).toBe(0.22)
  })

  it('no propone un cambio que no cambia nada', () => {
    const cambios = construirCambios(
      COEFICIENTES_POR_DEFECTO,
      propuesta({ factorGlobal: 1, sigmaComun: 0.18, ajustes: [ajuste('micro-core', 1, 'alta')] }),
    )
    expect(cambios).toEqual([])
  })

  it('escala también el arranque del tipo: va en el mismo stream que las horas base', () => {
    const cambios = construirCambios(
      COEFICIENTES_POR_DEFECTO,
      propuesta({ factorGlobal: 1, ajustes: [ajuste('micro-core', 1.25, 'alta')] }),
    )
    expect(cambios.find((c) => c.clave === 'bootstrap.micro-core')?.valorPropuesto).toBe(70)
  })

  it('escala las integraciones con el factor GLOBAL: no pertenecen a un tipo', () => {
    const cambios = construirCambios(COEFICIENTES_POR_DEFECTO, propuesta({ factorGlobal: 1.2 }))
    expect(cambios.find((c) => c.clave === 'integracion.ma')?.valorPropuesto).toBe(115.2)
    expect(cambios.find((c) => c.clave === 'integracion.b')?.valorPropuesto).toBe(9.6)
  })

  it('no toca las integraciones si el factor global es despreciable', () => {
    const cambios = construirCambios(COEFICIENTES_POR_DEFECTO, propuesta({ factorGlobal: 1.01 }))
    expect(cambios.some((c) => c.clave.startsWith('integracion.'))).toBe(false)
  })
})

describe('simularCambios', () => {
  it('produce coeficientes nuevos sin tocar los vigentes', () => {
    const cambios = construirCambios(
      COEFICIENTES_POR_DEFECTO,
      propuesta({ ajustes: [ajuste('micro-core', 1.25, 'alta')] }),
    )
    const nuevos = simularCambios(COEFICIENTES_POR_DEFECTO, cambios)

    expect(nuevos.base['micro-core']).toBe(75)
    expect(nuevos.bootstrap['micro-core']).toBe(70)
    expect(nuevos.riesgo.sigmaComun).toBe(0.22)
    // El original queda intacto: es lo que permite comparar antes y después.
    expect(COEFICIENTES_POR_DEFECTO.base['micro-core']).toBe(60)
    expect(COEFICIENTES_POR_DEFECTO.riesgo.sigmaComun).toBe(0.18)
  })

  it('sin cambios devuelve una copia equivalente', () => {
    const nuevos = simularCambios(COEFICIENTES_POR_DEFECTO, [])
    expect(nuevos).toEqual(COEFICIENTES_POR_DEFECTO)
    expect(nuevos).not.toBe(COEFICIENTES_POR_DEFECTO)
  })
})

describe('aFilaCoeficiente', () => {
  it('deduce la unidad del prefijo de la clave', () => {
    expect(unidadDeCoeficiente('base.micro-core')).toBe('horas')
    expect(unidadDeCoeficiente('bootstrap.bff')).toBe('horas')
    expect(unidadDeCoeficiente('integracion.ma')).toBe('horas')
    expect(unidadDeCoeficiente('cap.micro-core')).toBe('devs')
    expect(unidadDeCoeficiente('riesgo.sigma-comun')).toBe('factor')
  })

  it('escribe la fila completa: unidad y descripción son NOT NULL en la tabla', () => {
    const [cambio] = construirCambios(
      COEFICIENTES_POR_DEFECTO,
      propuesta({ factorGlobal: 1, ajustes: [ajuste('micro-core', 1.25, 'alta')] }),
    )
    const fila = aFilaCoeficiente(cambio, 7, new Date('2026-09-15T00:00:00Z'))

    expect(fila.clave).toBe('base.micro-core')
    expect(fila.valor).toBe(75)
    expect(fila.unidad).toBe('horas')
    expect(fila.descripcion).toContain('2026-09-15')
    expect(fila.descripcion).toContain('7 proyecto')
  })
})
