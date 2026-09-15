import { postgrest } from '@/shared/api'

import type { FuenteBenchmark } from '../model/types'

interface FilaFuente {
  clave: string
  nombre: string
  descripcion: string
  nivel: FuenteBenchmark['nivel']
  unidad_esfuerzo: string
  n_registros: number
  anio: number | null
  origen_url: string
  multiempresa: boolean
}

/** Lectura pública: los datos de referencia no llevan RLS. */
export async function listarFuentes(signal?: AbortSignal): Promise<FuenteBenchmark[]> {
  const filas = await postgrest<FilaFuente[]>(
    '/fuente?select=clave,nombre,descripcion,nivel,unidad_esfuerzo,n_registros,anio,origen_url,multiempresa&order=n_registros.desc',
    { perfil: 'benchmark', signal },
  )
  return filas.map((f) => ({
    clave: f.clave,
    nombre: f.nombre,
    descripcion: f.descripcion,
    nivel: f.nivel,
    unidadEsfuerzo: f.unidad_esfuerzo,
    nRegistros: f.n_registros,
    anio: f.anio,
    origenUrl: f.origen_url,
    multiempresa: f.multiempresa,
  }))
}
