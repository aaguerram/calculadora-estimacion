/** Un dataset público de referencia cargado en el esquema `benchmark`. */
export interface FuenteBenchmark {
  clave: string
  nombre: string
  descripcion: string
  nivel: 'proyecto' | 'tarea' | 'historia'
  unidadEsfuerzo: string
  nRegistros: number
  anio: number | null
  origenUrl: string
  /** Una sola organización o varias: cambia por completo la dispersión. */
  multiempresa: boolean
}

export const ETIQUETA_NIVEL: Record<FuenteBenchmark['nivel'], string> = {
  proyecto: 'Proyecto',
  tarea: 'Tarea',
  historia: 'Historia de usuario',
}

export function totalRegistros(fuentes: readonly FuenteBenchmark[]): {
  proyectos: number
  tareas: number
} {
  return fuentes.reduce(
    (t, f) =>
      f.nivel === 'proyecto'
        ? { ...t, proyectos: t.proyectos + f.nRegistros }
        : { ...t, tareas: t.tareas + f.nRegistros },
    { proyectos: 0, tareas: 0 },
  )
}
