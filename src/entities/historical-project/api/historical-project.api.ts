import type { Alcance } from '@/entities/project-scope/@x/historical-project'
import { postgrest } from '@/shared/api'

import type { ProyectoHistorico } from '../model/types'

interface FilaHistorico {
  id: string
  nombre: string
  cerrado_en: string
  mh_estimadas: number | string
  mh_reales: number | string
  meses_reales: number | string
  personas_reales: number | string
  alcance: Alcance | Record<string, never> | null
}

const COLUMNAS =
  'id,nombre,cerrado_en,mh_estimadas,mh_reales,meses_reales,personas_reales,alcance'

function aDominio(fila: FilaHistorico): ProyectoHistorico {
  const alcance = fila.alcance
  const tieneAlcance =
    alcance !== null && typeof alcance === 'object' && 'componentes' in alcance

  return {
    id: fila.id,
    nombre: fila.nombre,
    cerradoEn: fila.cerrado_en,
    mhEstimadas: Number(fila.mh_estimadas),
    mhReales: Number(fila.mh_reales),
    mesesReales: Number(fila.meses_reales),
    personasReales: Number(fila.personas_reales),
    alcance: tieneAlcance ? (alcance as Alcance) : null,
  }
}

export async function listarHistoricos(signal?: AbortSignal): Promise<ProyectoHistorico[]> {
  const filas = await postgrest<FilaHistorico[]>(
    `/proyecto_historico?select=${COLUMNAS}&order=cerrado_en.desc`,
    { signal },
  )
  return filas.map(aDominio)
}

export interface CierreDeProyecto {
  nombre: string
  cerradoEn: string
  mhEstimadas: number
  mhReales: number
  mesesReales: number
  personasReales: number
  /** Foto del alcance en el cierre. Sin ella el proyecto no sirve para calibrar. */
  alcance: Alcance
}

/**
 * Archiva un proyecto cerrado. El alcance se guarda como jsonb: es un registro
 * historico inmutable, no una vista de las tablas vivas, que seguiran cambiando.
 */
export async function archivarProyecto(cierre: CierreDeProyecto): Promise<void> {
  await postgrest<void>('/proyecto_historico', {
    metodo: 'POST',
    prefer: 'return=minimal',
    cuerpo: {
      nombre: cierre.nombre,
      cerrado_en: cierre.cerradoEn,
      mh_estimadas: cierre.mhEstimadas,
      mh_reales: cierre.mhReales,
      meses_reales: cierre.mesesReales,
      personas_reales: cierre.personasReales,
      alcance: cierre.alcance,
    },
  })
}

export async function eliminarHistorico(id: string): Promise<void> {
  await postgrest<void>(`/proyecto_historico?id=eq.${id}`, {
    metodo: 'DELETE',
    prefer: 'return=minimal',
  })
}

export interface CoeficienteAEscribir {
  clave: string
  valor: number
  unidad: string
  descripcion: string
}

/**
 * Escribe los coeficientes recalibrados. Exige el rol `calibrador`:
 * cambiar un coeficiente altera TODA estimacion futura.
 *
 * `unidad` y `descripcion` son obligatorios aunque la fila ya exista: Postgres
 * valida la tupla del INSERT ANTES de resolver el conflicto, asi que un upsert
 * parcial falla con 23502 (not-null violation), no con un UPDATE silencioso.
 */
export async function aplicarCoeficientes(
  cambios: ReadonlyArray<CoeficienteAEscribir>,
): Promise<void> {
  if (cambios.length === 0) return
  await postgrest<void>('/modelo_coeficiente', {
    metodo: 'POST',
    prefer: 'resolution=merge-duplicates,return=minimal',
    cuerpo: cambios.map((c) => ({
      clave: c.clave,
      valor: c.valor,
      unidad: c.unidad,
      descripcion: c.descripcion,
      actualizado_en: new Date().toISOString(),
    })),
  })
}
