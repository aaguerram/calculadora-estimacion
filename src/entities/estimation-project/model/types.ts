/** Percentil que se compromete ante el cliente (doc §5). */
export type NivelCompromiso = 50 | 80 | 90

/** Un proyecto a estimar. Refleja la tabla `estimacion.proyecto`. */
export interface EstimationProject {
  id: string
  nombre: string
  cliente: string | null
  orgId: string
  ownerId: string
  horasDia: number
  diasMes: number
  nivelCompromiso: NivelCompromiso
  notas: string | null
  creadoEn: string
}

/** Campos que el cliente puede enviar. `owner_id` y `org_id` los pone el token. */
export interface NuevoEstimationProject {
  nombre: string
  cliente?: string
  horasDia?: number
  diasMes?: number
  nivelCompromiso?: NivelCompromiso
}

/** Horas que contiene un mes-hombre con la jornada del proyecto. */
export function horasPorMesHombre(proyecto: Pick<EstimationProject, 'horasDia' | 'diasMes'>): number {
  return proyecto.horasDia * proyecto.diasMes
}
