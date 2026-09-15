import type { DriverAlcance } from './types'

export type PosturaDriver = 'favorable' | 'nominal' | 'adverso'

export interface DefinicionDriver {
  clave: string
  etiqueta: string
  ayuda: string
  valores: Record<PosturaDriver, number>
}

/**
 * Los cinco drivers del modelo (doc §4). Sus deltas se SUMAN, no se multiplican.
 * La base guarda `clave` y `delta`; la etiqueta vive aqui porque es vocabulario.
 */
export const CATALOGO_DRIVERS: readonly DefinicionDriver[] = [
  {
    clave: 'madurez-dominio',
    etiqueta: 'Madurez del equipo en el dominio',
    ayuda: '¿El equipo ya construyó algo parecido en este negocio?',
    valores: { favorable: -0.1, nominal: 0, adverso: 0.2 },
  },
  {
    clave: 'claridad-requisitos',
    etiqueta: 'Claridad de los requisitos',
    ayuda: '¿Están escritos y validados, o se van descubriendo?',
    valores: { favorable: -0.1, nominal: 0, adverso: 0.2 },
  },
  {
    clave: 'exigencia-nf',
    etiqueta: 'Exigencia no funcional',
    ayuda: 'Seguridad, performance, disponibilidad, recuperación ante desastres.',
    valores: { favorable: 0, nominal: 0.05, adverso: 0.15 },
  },
  {
    clave: 'deuda-tecnica',
    etiqueta: 'Deuda técnica del entorno',
    ayuda: '¿Hay legado que frena cada cambio?',
    valores: { favorable: 0, nominal: 0.06, adverso: 0.18 },
  },
  {
    clave: 'terceros',
    etiqueta: 'Dependencia de terceros',
    ayuda: '¿Cuánto depende el avance de gente fuera del equipo?',
    valores: { favorable: 0, nominal: 0.05, adverso: 0.15 },
  },
]

export const ETIQUETA_POSTURA: Record<PosturaDriver, string> = {
  favorable: 'Favorable',
  nominal: 'Nominal',
  adverso: 'Adverso',
}

/** Postura cuyo delta coincide (o mas se acerca) al valor guardado. */
export function posturaDeDelta(definicion: DefinicionDriver, delta: number): PosturaDriver {
  const posturas: PosturaDriver[] = ['favorable', 'nominal', 'adverso']
  return posturas.reduce((mejor, postura) =>
    Math.abs(definicion.valores[postura] - delta) <
    Math.abs(definicion.valores[mejor] - delta)
      ? postura
      : mejor,
  )
}

/** Completa el alcance con los drivers que falten, en postura nominal. */
export function completarDrivers(guardados: readonly DriverAlcance[]): DriverAlcance[] {
  return CATALOGO_DRIVERS.map((definicion) => {
    const guardado = guardados.find((d) => d.clave === definicion.clave)
    return {
      clave: definicion.clave,
      etiqueta: definicion.etiqueta,
      delta: guardado?.delta ?? definicion.valores.nominal,
    }
  })
}
