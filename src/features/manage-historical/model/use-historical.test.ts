import { describe, expect, it } from 'vitest'

import { historicalReducer, initialHistoricalState } from './use-historical'
import type { HistoricalState } from './use-historical'

const listo: HistoricalState = {
  estado: 'listo',
  historicos: [],
  guardando: false,
  error: null,
  cargados: 0,
}

describe('historicalReducer', () => {
  it('limpia el error al empezar una carga', () => {
    expect(historicalReducer({ ...listo, error: 'x' }, { type: 'cargaIniciada' }).error).toBeNull()
  })

  it('una carga resuelta apaga el flag de guardado', () => {
    const r = historicalReducer({ ...listo, guardando: true }, { type: 'cargaResuelta', historicos: [] })
    expect(r.guardando).toBe(false)
  })

  it('un fallo al guardar conserva lo que ya estaba cargado', () => {
    const conDatos = { ...listo, historicos: [{ id: 'a' }] } as HistoricalState
    const r = historicalReducer(conDatos, { type: 'guardadoFallido', error: 'conflicto' })
    expect(r.historicos).toHaveLength(1)
    expect(r.error).toBe('conflicto')
  })

  it('recuerda cuántos se cargaron para poder avisarlo', () => {
    expect(historicalReducer(listo, { type: 'guardadoResuelto', cargados: 5 }).cargados).toBe(5)
  })

  it('cerrar el aviso borra error y contador', () => {
    const conAviso = { ...listo, error: 'x', cargados: 3 }
    expect(historicalReducer(conAviso, { type: 'avisoCerrado' })).toMatchObject({
      error: null,
      cargados: 0,
    })
  })

  it('ignora intents desconocidos', () => {
    // @ts-expect-error se comprueba el comportamiento en runtime
    expect(historicalReducer(listo, { type: 'inventado' })).toBe(listo)
  })

  it('el estado inicial está cargando y vacío', () => {
    expect(initialHistoricalState).toMatchObject({ estado: 'cargando', historicos: [], cargados: 0 })
  })
})
