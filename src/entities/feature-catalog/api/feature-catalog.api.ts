import { postgrest } from '@/shared/api'

import type { Catalogo, TipoFp } from '../model/types'

interface FilaCategoria {
  clave: string
  nombre: string
  descripcion: string
  orden: number
}

interface FilaElemento {
  clave: string
  categoria: string
  nombre: string
  descripcion: string
  tipo_fp: TipoFp
  pf_simple: number
  pf_media: number
  pf_alta: number
  orden: number
}

/** El catálogo es lectura pública: `web_anon` tiene SELECT sobre ambas tablas. */
export async function cargarCatalogo(signal?: AbortSignal): Promise<Catalogo> {
  const [categorias, elementos] = await Promise.all([
    postgrest<FilaCategoria[]>(
      '/categoria_feature?select=clave,nombre,descripcion,orden&order=orden',
      { signal },
    ),
    postgrest<FilaElemento[]>(
      '/elemento_feature?select=clave,categoria,nombre,descripcion,tipo_fp,pf_simple,pf_media,pf_alta,orden&order=categoria,orden',
      { signal },
    ),
  ])

  return {
    categorias,
    elementos: elementos.map((e) => ({
      clave: e.clave,
      categoria: e.categoria,
      nombre: e.nombre,
      descripcion: e.descripcion,
      tipoFp: e.tipo_fp,
      pfSimple: e.pf_simple,
      pfMedia: e.pf_media,
      pfAlta: e.pf_alta,
      orden: e.orden,
    })),
  }
}
