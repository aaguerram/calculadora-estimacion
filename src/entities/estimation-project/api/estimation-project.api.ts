import { postgrest } from '@/shared/api'

import type { EstimationProject, NuevoEstimationProject } from '../model/types'

/** Forma cruda que devuelve PostgREST (snake_case, numeric como string o number). */
interface FilaProyecto {
  id: string
  nombre: string
  cliente: string | null
  org_id: string
  owner_id: string
  horas_dia: number | string
  dias_mes: number
  nivel_compromiso: number
  notas: string | null
  creado_en: string
}

const COLUMNAS =
  'id,nombre,cliente,org_id,owner_id,horas_dia,dias_mes,nivel_compromiso,notas,creado_en'

function aDominio(fila: FilaProyecto): EstimationProject {
  return {
    id: fila.id,
    nombre: fila.nombre,
    cliente: fila.cliente,
    orgId: fila.org_id,
    ownerId: fila.owner_id,
    horasDia: Number(fila.horas_dia),
    diasMes: fila.dias_mes,
    nivelCompromiso: fila.nivel_compromiso as EstimationProject['nivelCompromiso'],
    notas: fila.notas,
    creadoEn: fila.creado_en,
  }
}

export async function listarProyectos(signal?: AbortSignal): Promise<EstimationProject[]> {
  const filas = await postgrest<FilaProyecto[]>(
    `/proyecto?select=${COLUMNAS}&order=creado_en.desc`,
    { signal },
  )
  return filas.map(aDominio)
}

export async function crearProyecto(nuevo: NuevoEstimationProject): Promise<EstimationProject> {
  const [fila] = await postgrest<FilaProyecto[]>(`/proyecto?select=${COLUMNAS}`, {
    metodo: 'POST',
    cuerpo: {
      nombre: nuevo.nombre,
      cliente: nuevo.cliente || null,
      horas_dia: nuevo.horasDia ?? 6,
      dias_mes: nuevo.diasMes ?? 20,
      nivel_compromiso: nuevo.nivelCompromiso ?? 80,
    },
  })
  return aDominio(fila)
}

export async function eliminarProyecto(id: string): Promise<void> {
  await postgrest<void>(`/proyecto?id=eq.${id}`, { metodo: 'DELETE', prefer: 'return=minimal' })
}
