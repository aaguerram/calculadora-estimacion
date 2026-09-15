import type { AjustePorBucket, ErrorPorProyecto, PropuestaCalibracion } from './types'

/**
 * Observacion de un proyecto para calibrar: cuanto pesa cada bucket (tipo de
 * componente) en su esfuerzo estimado, y que factor habria hecho falta.
 *
 * Los buckets se identifican por `string` a proposito: esto es estadistica sobre
 * cubetas etiquetadas, no logica de dominio, y asi no arrastra los tipos del
 * modelo hasta aqui.
 */
export interface ObservacionCalibracion {
  id: string
  /** Horas estimadas por bucket. Se normaliza a proporciones internamente. */
  horasPorBucket: Record<string, number>
  /** real / estimado: el factor que el modelo necesitaba para acertar. */
  ratio: number
}

/** Media geometrica: minimiza el error en escala logaritmica. */
export function mediaGeometrica(valores: readonly number[]): number {
  const validos = valores.filter((v) => Number.isFinite(v) && v > 0)
  if (validos.length === 0) return 1
  return Math.exp(validos.reduce((t, v) => t + Math.log(v), 0) / validos.length)
}

/** Desviacion tipica muestral de los logaritmos: el sigma de una lognormal. */
export function sigmaLogaritmica(valores: readonly number[]): number {
  const logs = valores.filter((v) => Number.isFinite(v) && v > 0).map(Math.log)
  if (logs.length < 2) return 0
  const media = logs.reduce((a, b) => a + b, 0) / logs.length
  const varianza = logs.reduce((t, l) => t + (l - media) ** 2, 0) / (logs.length - 1)
  return Math.sqrt(varianza)
}

const LIMITE_FACTOR = { min: 0.5, max: 3 } as const
const ITERACIONES = 300

function acotar(v: number): number {
  return Math.min(LIMITE_FACTOR.max, Math.max(LIMITE_FACTOR.min, v))
}

/**
 * Factores por bucket con encogimiento (ridge) hacia el factor global.
 *
 * Modelo: ratio_i ≈ Σ_t proporcion_it · k_t.
 * Con 5 proyectos y 7 tipos el sistema esta INDETERMINADO, asi que resolverlo a
 * pelo produce factores absurdos. Se regulariza hacia el factor global con una
 * fuerza inversa al dato disponible: un tipo con un solo proyecto apenas se
 * mueve del global; uno presente en toda la muestra se ajusta de verdad.
 *
 * Se resuelve por descenso por coordenadas (Gauss-Seidel), que para esta forma
 * converge en pocas decenas de pasos.
 */
export function ajustarPorBucket(
  observaciones: readonly ObservacionCalibracion[],
  factorGlobal: number,
): AjustePorBucket[] {
  const claves = [
    ...new Set(observaciones.flatMap((o) => Object.keys(o.horasPorBucket))),
  ].sort()
  if (claves.length === 0 || observaciones.length === 0) return []

  // Proporciones por proyecto: cada fila suma 1.
  const filas = observaciones.map((o) => {
    const total = claves.reduce((t, c) => t + (o.horasPorBucket[c] ?? 0), 0)
    const proporciones = Object.fromEntries(
      claves.map((c) => [c, total > 0 ? (o.horasPorBucket[c] ?? 0) / total : 0]),
    )
    return { ratio: o.ratio, proporciones }
  })

  const pesoMedio: Record<string, number> = {}
  const proyectosConPeso: Record<string, number> = {}
  for (const clave of claves) {
    pesoMedio[clave] = filas.reduce((t, f) => t + f.proporciones[clave], 0) / filas.length
    proyectosConPeso[clave] = filas.filter((f) => f.proporciones[clave] > 0.05).length
  }

  const k: Record<string, number> = Object.fromEntries(claves.map((c) => [c, factorGlobal]))

  for (let iteracion = 0; iteracion < ITERACIONES; iteracion++) {
    for (const clave of claves) {
      let numerador = 0
      let denominador = 0
      for (const fila of filas) {
        const a = fila.proporciones[clave]
        if (a === 0) continue
        const restoPredicho = claves
          .filter((c) => c !== clave)
          .reduce((t, c) => t + fila.proporciones[c] * k[c], 0)
        numerador += a * (fila.ratio - restoPredicho)
        denominador += a * a
      }
      if (denominador === 0) {
        k[clave] = factorGlobal
        continue
      }
      // rho: cuanto se encoge hacia el global. Mas dato -> menos encogimiento.
      const rho = Math.max(0.35, 3 / Math.max(1, proyectosConPeso[clave]))
      k[clave] = acotar((numerador / denominador + rho * factorGlobal) / (1 + rho))
    }
  }

  return claves.map((clave) => ({
    clave,
    factor: k[clave],
    pesoMedio: pesoMedio[clave],
    proyectosConPeso: proyectosConPeso[clave],
    confianza:
      proyectosConPeso[clave] >= 5 && pesoMedio[clave] >= 0.1
        ? 'alta'
        : proyectosConPeso[clave] >= 3
          ? 'media'
          : 'baja',
  }))
}

/** Propuesta completa de recalibracion a partir del backtest. */
export function proponerCalibracion(
  errores: readonly ErrorPorProyecto[],
  observaciones: readonly ObservacionCalibracion[],
): PropuestaCalibracion {
  const ratios = errores.map((e) => e.ratio)
  const factorGlobal = acotar(mediaGeometrica(ratios))
  const sigmaComun = sigmaLogaritmica(ratios)
  const advertencias: string[] = []

  if (errores.length < 3) {
    advertencias.push(
      `Con ${errores.length} proyecto(s) la propuesta es orientativa: hacen falta 5 para calibrar con criterio.`,
    )
  }
  if (Math.abs(factorGlobal - 1) < 0.03) {
    advertencias.push('El factor global está a menos del 3 % de 1: el modelo ya no tiene sesgo sistemático.')
  }
  if (sigmaComun > 0.35) {
    advertencias.push(
      `La dispersión (σ ${sigmaComun.toFixed(2)}) es muy alta: el modelo acierta en media pero falla por proyecto. Revisa la clasificación de complejidad antes de tocar coeficientes.`,
    )
  }

  const ajustes = ajustarPorBucket(observaciones, factorGlobal)
  const bajaConfianza = ajustes.filter((a) => a.confianza === 'baja')
  if (bajaConfianza.length > 0) {
    advertencias.push(
      `Sin dato suficiente para ajustar: ${bajaConfianza.map((a) => a.clave).join(', ')}. Se dejan en el factor global.`,
    )
  }

  return { factorGlobal, sigmaComun, ajustes, advertencias }
}
