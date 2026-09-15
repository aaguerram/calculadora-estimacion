import type {
  NivelComplejidad,
  StackTecnologico,
  TipoComponente,
} from '@/entities/estimation-model/@x/project-scope'
import { postgrest } from '@/shared/api'

import { mapearAlcance } from '../model/mapear-alcance'
import type { FilaScopeProyecto } from '../model/mapear-alcance'
import type { AlcanceDeProyecto } from '../model/types'

/**
 * Un solo `select` embebido trae el alcance completo.
 * PostgREST resuelve los joins por las claves foraneas del esquema.
 */
const SELECT_ALCANCE = [
  'id',
  'nombre',
  'horas_dia',
  'dias_mes',
  'nivel_compromiso',
  'componente(id,nombre,tipo,stack,es_nuevo,cap_devs_override)',
  'feature(id,nombre,complejidad,categoria,orden,feature_componente(componente_id,complejidad_override),feature_elemento(elemento,cantidad,complejidad))',
  'integracion(id,nombre,complejidad,componente_duenio_id,es_externa,tiene_sandbox,usos)',
  'driver(clave,delta)',
].join(',')

export async function cargarAlcance(
  proyectoId: string,
  signal?: AbortSignal,
): Promise<AlcanceDeProyecto | null> {
  const filas = await postgrest<FilaScopeProyecto[]>(
    `/proyecto?id=eq.${proyectoId}&select=${SELECT_ALCANCE}`,
    { signal },
  )
  return filas.length > 0 ? mapearAlcance(filas[0]) : null
}

// ------------------------------------------------------------- componentes

export interface NuevoComponente {
  nombre: string
  tipo: TipoComponente
  stack: StackTecnologico
  esNuevo: boolean
  capDevs?: number | null
}

export async function crearComponente(
  proyectoId: string,
  nuevo: NuevoComponente,
): Promise<void> {
  await postgrest<void>('/componente', {
    metodo: 'POST',
    prefer: 'return=minimal',
    cuerpo: {
      proyecto_id: proyectoId,
      nombre: nuevo.nombre.trim(),
      tipo: nuevo.tipo,
      stack: nuevo.stack,
      es_nuevo: nuevo.esNuevo,
      cap_devs_override: nuevo.capDevs ?? null,
    },
  })
}

export async function actualizarComponente(
  id: string,
  cambios: Partial<NuevoComponente>,
): Promise<void> {
  const cuerpo: Record<string, unknown> = {}
  if (cambios.nombre !== undefined) cuerpo.nombre = cambios.nombre.trim()
  if (cambios.tipo !== undefined) cuerpo.tipo = cambios.tipo
  if (cambios.stack !== undefined) cuerpo.stack = cambios.stack
  if (cambios.esNuevo !== undefined) cuerpo.es_nuevo = cambios.esNuevo
  if (cambios.capDevs !== undefined) cuerpo.cap_devs_override = cambios.capDevs
  await postgrest<void>(`/componente?id=eq.${id}`, {
    metodo: 'PATCH',
    prefer: 'return=minimal',
    cuerpo,
  })
}

export async function eliminarComponente(id: string): Promise<void> {
  await postgrest<void>(`/componente?id=eq.${id}`, {
    metodo: 'DELETE',
    prefer: 'return=minimal',
  })
}

// ----------------------------------------------------------------- features

export interface NuevaFeature {
  nombre: string
  complejidad: NivelComplejidad
  /** Eje 1. `null` deja la feature sin clasificar. */
  categoria?: string | null
  orden?: number
}

export async function crearFeature(proyectoId: string, nueva: NuevaFeature): Promise<void> {
  await postgrest<void>('/feature', {
    metodo: 'POST',
    prefer: 'return=minimal',
    cuerpo: {
      proyecto_id: proyectoId,
      nombre: nueva.nombre.trim(),
      complejidad: nueva.complejidad,
      categoria: nueva.categoria ?? null,
      orden: nueva.orden ?? 0,
    },
  })
}

export async function actualizarFeature(
  id: string,
  cambios: Partial<NuevaFeature>,
): Promise<void> {
  const cuerpo: Record<string, unknown> = {}
  if (cambios.nombre !== undefined) cuerpo.nombre = cambios.nombre.trim()
  if (cambios.complejidad !== undefined) cuerpo.complejidad = cambios.complejidad
  if (cambios.categoria !== undefined) cuerpo.categoria = cambios.categoria
  if (cambios.orden !== undefined) cuerpo.orden = cambios.orden
  await postgrest<void>(`/feature?id=eq.${id}`, {
    metodo: 'PATCH',
    prefer: 'return=minimal',
    cuerpo,
  })
}

export async function eliminarFeature(id: string): Promise<void> {
  await postgrest<void>(`/feature?id=eq.${id}`, { metodo: 'DELETE', prefer: 'return=minimal' })
}

// ------------------------------------------- pares feature x componente

export async function vincularFeatureComponente(
  featureId: string,
  componenteId: string,
): Promise<void> {
  await postgrest<void>('/feature_componente', {
    metodo: 'POST',
    prefer: 'return=minimal',
    cuerpo: { feature_id: featureId, componente_id: componenteId },
  })
}

export async function desvincularFeatureComponente(
  featureId: string,
  componenteId: string,
): Promise<void> {
  await postgrest<void>(
    `/feature_componente?feature_id=eq.${featureId}&componente_id=eq.${componenteId}`,
    { metodo: 'DELETE', prefer: 'return=minimal' },
  )
}

export async function fijarComplejidadDelPar(
  featureId: string,
  componenteId: string,
  complejidad: NivelComplejidad | null,
): Promise<void> {
  await postgrest<void>(
    `/feature_componente?feature_id=eq.${featureId}&componente_id=eq.${componenteId}`,
    {
      metodo: 'PATCH',
      prefer: 'return=minimal',
      cuerpo: { complejidad_override: complejidad },
    },
  )
}

// --------------------------------------- eje 1: categoria de la feature

export async function fijarCategoriaFeature(
  featureId: string,
  categoria: string | null,
): Promise<void> {
  await postgrest<void>(`/feature?id=eq.${featureId}`, {
    metodo: 'PATCH',
    prefer: 'return=minimal',
    cuerpo: { categoria },
  })
}

// ------------------------------------------ eje 3: elementos de la feature

export async function marcarElemento(featureId: string, elemento: string): Promise<void> {
  await postgrest<void>('/feature_elemento', {
    metodo: 'POST',
    prefer: 'resolution=merge-duplicates,return=minimal',
    cuerpo: { feature_id: featureId, elemento, cantidad: 1, complejidad: 'm' },
  })
}

export async function desmarcarElemento(featureId: string, elemento: string): Promise<void> {
  await postgrest<void>(
    `/feature_elemento?feature_id=eq.${featureId}&elemento=eq.${elemento}`,
    { metodo: 'DELETE', prefer: 'return=minimal' },
  )
}

export async function ajustarElemento(
  featureId: string,
  elemento: string,
  cambios: { cantidad?: number; complejidad?: NivelComplejidad },
): Promise<void> {
  await postgrest<void>(
    `/feature_elemento?feature_id=eq.${featureId}&elemento=eq.${elemento}`,
    { metodo: 'PATCH', prefer: 'return=minimal', cuerpo: cambios },
  )
}

// ------------------------------------------------------------ integraciones

export interface NuevaIntegracion {
  nombre: string
  complejidad: NivelComplejidad
  componenteDuenioId: string
  esExterna: boolean
  tieneSandbox: boolean
  usos: number
}

export async function crearIntegracion(
  proyectoId: string,
  nueva: NuevaIntegracion,
): Promise<void> {
  await postgrest<void>('/integracion', {
    metodo: 'POST',
    prefer: 'return=minimal',
    cuerpo: {
      proyecto_id: proyectoId,
      nombre: nueva.nombre.trim(),
      complejidad: nueva.complejidad,
      componente_duenio_id: nueva.componenteDuenioId,
      es_externa: nueva.esExterna,
      tiene_sandbox: nueva.tieneSandbox,
      usos: nueva.usos,
    },
  })
}

export async function actualizarIntegracion(
  id: string,
  cambios: Partial<NuevaIntegracion>,
): Promise<void> {
  const cuerpo: Record<string, unknown> = {}
  if (cambios.nombre !== undefined) cuerpo.nombre = cambios.nombre.trim()
  if (cambios.complejidad !== undefined) cuerpo.complejidad = cambios.complejidad
  if (cambios.componenteDuenioId !== undefined)
    cuerpo.componente_duenio_id = cambios.componenteDuenioId
  if (cambios.esExterna !== undefined) cuerpo.es_externa = cambios.esExterna
  if (cambios.tieneSandbox !== undefined) cuerpo.tiene_sandbox = cambios.tieneSandbox
  if (cambios.usos !== undefined) cuerpo.usos = cambios.usos
  await postgrest<void>(`/integracion?id=eq.${id}`, {
    metodo: 'PATCH',
    prefer: 'return=minimal',
    cuerpo,
  })
}

export async function eliminarIntegracion(id: string): Promise<void> {
  await postgrest<void>(`/integracion?id=eq.${id}`, {
    metodo: 'DELETE',
    prefer: 'return=minimal',
  })
}

// ------------------------------------------------------------------ drivers

/** `upsert` real: Prefer resolution=merge-duplicates usa la PK (proyecto_id, clave). */
export async function fijarDriver(
  proyectoId: string,
  clave: string,
  delta: number,
): Promise<void> {
  await postgrest<void>('/driver', {
    metodo: 'POST',
    prefer: 'resolution=merge-duplicates,return=minimal',
    cuerpo: { proyecto_id: proyectoId, clave, delta },
  })
}
