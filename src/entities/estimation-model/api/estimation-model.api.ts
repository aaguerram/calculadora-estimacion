import { postgrest } from '@/shared/api'

import { fundirCoeficientes } from '../model/merge-coeficientes'
import type { ResultadoMerge } from '../model/merge-coeficientes'

interface FilaCoeficiente {
  clave: string
  valor: number | string
}

/**
 * Lee la tabla calibrable y la funde sobre las semillas.
 * Es lectura publica: `web_anon` tiene SELECT sobre `modelo_coeficiente`.
 */
export async function cargarCoeficientes(signal?: AbortSignal): Promise<ResultadoMerge> {
  const filas = await postgrest<FilaCoeficiente[]>(
    '/modelo_coeficiente?select=clave,valor&order=clave.asc',
    { signal },
  )
  return fundirCoeficientes(filas.map((f) => ({ clave: f.clave, valor: Number(f.valor) })))
}
