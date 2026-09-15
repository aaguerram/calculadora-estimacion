import type { NivelComplejidad } from '@/entities/estimation-model/@x/feature-catalog'

/** Los cinco tipos de la descomposición IFPUG (ISO/IEC 20926). */
export type TipoFp = 'EI' | 'EO' | 'EQ' | 'ILF' | 'EIF'

export const ETIQUETA_FP: Record<TipoFp, string> = {
  EI: 'Entrada',
  EO: 'Salida',
  EQ: 'Consulta',
  ILF: 'Dato propio',
  EIF: 'Dato externo',
}

export const DESCRIPCION_FP: Record<TipoFp, string> = {
  EI: 'Entrada que altera datos: formularios, cargas.',
  EO: 'Salida con cálculo derivado: reportes, exportaciones.',
  EQ: 'Consulta sin derivación: listados, buscadores.',
  ILF: 'Dato que el sistema mantiene: entidades, parametría.',
  EIF: 'Dato leído de otro sistema, sin mantenerlo.',
}

/** Eje 1: qué es la feature. */
export interface CategoriaFeature {
  clave: string
  nombre: string
  descripcion: string
  orden: number
}

/** Eje 3: de qué está hecha. Pesos IFPUG oficiales en puntos función. */
export interface ElementoFeature {
  clave: string
  categoria: string
  nombre: string
  descripcion: string
  tipoFp: TipoFp
  pfSimple: number
  pfMedia: number
  pfAlta: number
  orden: number
}

export interface Catalogo {
  categorias: CategoriaFeature[]
  elementos: ElementoFeature[]
}

export const CATALOGO_VACIO: Catalogo = { categorias: [], elementos: [] }

/**
 * Puntos función de un elemento según la complejidad elegida.
 * IFPUG define tres niveles; los cinco del proyecto se agrupan de dos en dos.
 */
export function puntosDeElemento(
  elemento: ElementoFeature,
  complejidad: NivelComplejidad,
): number {
  switch (complejidad) {
    case 'mb':
    case 'b':
      return elemento.pfSimple
    case 'a':
    case 'ma':
      return elemento.pfAlta
    default:
      return elemento.pfMedia
  }
}

/** Elementos de una categoría, más los transversales, que aplican a todas. */
export function elementosDisponibles(
  catalogo: Catalogo,
  categoria: string | null,
): ElementoFeature[] {
  return catalogo.elementos
    .filter((e) => e.categoria === categoria || e.categoria === 'transversal')
    .sort((a, b) => {
      if (a.categoria !== b.categoria) return a.categoria === 'transversal' ? 1 : -1
      return a.orden - b.orden
    })
}
