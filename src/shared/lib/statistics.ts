/**
 * Utilidades estadisticas genericas. Sin dominio: no saben que es una estimacion.
 */

/** Generador pseudoaleatorio con semilla (mulberry32): hace los tests deterministas. */
export function crearRng(semilla: number): () => number {
  let estado = semilla >>> 0
  return function siguiente(): number {
    estado = (estado + 0x6d2b79f5) >>> 0
    let t = estado
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Muestra de una distribucion triangular (o, moda, p) por transformada inversa.
 * Si el rango es degenerado devuelve la moda.
 */
export function muestraTriangular(
  optimista: number,
  moda: number,
  pesimista: number,
  aleatorio: () => number,
): number {
  if (pesimista <= optimista) return moda
  const u = aleatorio()
  const corte = (moda - optimista) / (pesimista - optimista)
  return u < corte
    ? optimista + Math.sqrt(u * (pesimista - optimista) * (moda - optimista))
    : pesimista - Math.sqrt((1 - u) * (pesimista - optimista) * (pesimista - moda))
}

/** Normal estandar por Box-Muller. */
export function muestraNormalEstandar(aleatorio: () => number): number {
  let u = 0
  let v = 0
  while (u === 0) u = aleatorio()
  while (v === 0) v = aleatorio()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

/**
 * Multiplicador lognormal de media 1 y desviacion log `sigma`.
 * Se usa para el riesgo comun: afecta a toda una corrida por igual.
 */
export function multiplicadorLognormal(sigma: number, aleatorio: () => number): number {
  if (sigma <= 0) return 1
  return Math.exp(sigma * muestraNormalEstandar(aleatorio) - (sigma * sigma) / 2)
}

/**
 * Percentil por interpolacion lineal sobre una muestra YA ORDENADA ascendentemente.
 * `q` en [0, 1].
 */
export function percentil(ordenados: readonly number[], q: number): number {
  if (ordenados.length === 0) return Number.NaN
  if (ordenados.length === 1) return ordenados[0]
  const posicion = Math.min(Math.max(q, 0), 1) * (ordenados.length - 1)
  const bajo = Math.floor(posicion)
  const alto = Math.ceil(posicion)
  if (bajo === alto) return ordenados[bajo]
  return ordenados[bajo] + (ordenados[alto] - ordenados[bajo]) * (posicion - bajo)
}

/** Media aritmetica. Devuelve 0 para una muestra vacia. */
export function media(valores: readonly number[]): number {
  if (valores.length === 0) return 0
  return valores.reduce((a, b) => a + b, 0) / valores.length
}
