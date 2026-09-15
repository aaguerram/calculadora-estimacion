import type { ErrorPorProyecto, MetricasCalidad } from './types'

/** Umbrales de la literatura de estimación (doc §8.2). */
export const UMBRALES = {
  mmre: 0.25,
  pred25: 0.75,
  sesgo: 0.1,
} as const

export interface ParEstimadoReal {
  id: string
  nombre: string
  estimado: number
  real: number
}

const mediana = (valores: number[]): number => {
  if (valores.length === 0) return Number.NaN
  const ordenados = [...valores].sort((a, b) => a - b)
  const medio = Math.floor(ordenados.length / 2)
  return ordenados.length % 2 === 0
    ? (ordenados[medio - 1] + ordenados[medio]) / 2
    : ordenados[medio]
}

/**
 * Error relativo por proyecto. Se divide por el REAL, no por el estimado:
 * es la convencion de la literatura (MRE) y evita que una estimacion
 * ridiculamente baja produzca un error acotado a 1.
 */
export function calcularErrores(pares: readonly ParEstimadoReal[]): ErrorPorProyecto[] {
  return pares
    .filter((p) => p.real > 0 && Number.isFinite(p.estimado) && Number.isFinite(p.real))
    .map((p) => {
      const mre = Math.abs(p.real - p.estimado) / p.real
      return {
        id: p.id,
        nombre: p.nombre,
        estimado: p.estimado,
        real: p.real,
        mre,
        ratio: p.estimado > 0 ? p.real / p.estimado : Number.NaN,
        dentroDePred25: mre < 0.25,
      }
    })
}

export function calcularMetricas(errores: readonly ErrorPorProyecto[]): MetricasCalidad {
  const n = errores.length
  if (n === 0) {
    return { n: 0, mmre: Number.NaN, mdmre: Number.NaN, pred25: Number.NaN, sesgo: Number.NaN, apto: false }
  }

  const mres = errores.map((e) => e.mre)
  const mmre = mres.reduce((a, b) => a + b, 0) / n
  const mdmre = mediana(mres)
  const pred25 = errores.filter((e) => e.dentroDePred25).length / n
  const sesgo = errores.reduce((t, e) => t + (e.estimado - e.real) / e.real, 0) / n

  return {
    n,
    mmre,
    mdmre,
    pred25,
    sesgo,
    // Con menos de 3 proyectos ninguna metrica es creible, por buena que salga.
    apto:
      n >= 3 &&
      mmre < UMBRALES.mmre &&
      pred25 > UMBRALES.pred25 &&
      Math.abs(sesgo) < UMBRALES.sesgo,
  }
}

/** Lista legible de por qué el modelo no pasa el corte. */
export function motivosDeNoApto(m: MetricasCalidad): string[] {
  const motivos: string[] = []
  if (m.n === 0) return ['No hay proyectos cerrados con alcance guardado.']
  if (m.n < 3) motivos.push(`Solo ${m.n} proyecto(s): ninguna métrica es creíble por debajo de 3.`)
  if (!(m.mmre < UMBRALES.mmre))
    motivos.push(`MMRE ${(m.mmre * 100).toFixed(0)} % supera el objetivo de ${UMBRALES.mmre * 100} %.`)
  if (!(m.pred25 > UMBRALES.pred25))
    motivos.push(`PRED(25) ${(m.pred25 * 100).toFixed(0)} % no llega al ${UMBRALES.pred25 * 100} %.`)
  if (!(Math.abs(m.sesgo) < UMBRALES.sesgo))
    motivos.push(
      `Sesgo ${(m.sesgo * 100).toFixed(0)} %: el modelo ${m.sesgo < 0 ? 'subestima' : 'sobreestima'} de forma sistemática.`,
    )
  return motivos
}
