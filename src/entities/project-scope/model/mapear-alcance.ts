import type {
  NivelComplejidad,
  StackTecnologico,
  TipoComponente,
} from '@/entities/estimation-model/@x/project-scope'

import { completarDrivers } from './catalogo-drivers'
import type { AlcanceDeProyecto } from './types'

/**
 * Filas crudas de PostgREST. Esta forma NO sale de este archivo:
 * renombrar una columna toca aqui y en ningun otro sitio.
 */
export interface FilaScopeProyecto {
  id: string
  nombre: string
  horas_dia: number | string
  dias_mes: number
  nivel_compromiso: number
  componente: Array<{
    id: string
    nombre: string
    tipo: TipoComponente
    stack: StackTecnologico
    es_nuevo: boolean
    cap_devs_override: number | null
  }> | null
  feature: Array<{
    id: string
    nombre: string
    complejidad: NivelComplejidad
    categoria: string | null
    orden: number
    feature_componente: Array<{
      componente_id: string
      complejidad_override: NivelComplejidad | null
    }> | null
    feature_elemento: Array<{
      elemento: string
      cantidad: number
      complejidad: NivelComplejidad
    }> | null
  }> | null
  integracion: Array<{
    id: string
    nombre: string
    complejidad: NivelComplejidad
    componente_duenio_id: string | null
    es_externa: boolean
    tiene_sandbox: boolean
    usos: number
  }> | null
  driver: Array<{ clave: string; delta: number | string }> | null
}

function nivelCompromisoValido(valor: number): 50 | 80 | 90 {
  return valor === 50 || valor === 90 ? valor : 80
}

/** Traduce la respuesta embebida de PostgREST al contrato del motor. */
export function mapearAlcance(fila: FilaScopeProyecto): AlcanceDeProyecto {
  const componentes = (fila.componente ?? []).map((c) => ({
    id: c.id,
    nombre: c.nombre,
    tipo: c.tipo,
    stack: c.stack,
    esNuevo: c.es_nuevo,
    ...(c.cap_devs_override === null ? {} : { capDevs: c.cap_devs_override }),
  }))

  const features = [...(fila.feature ?? [])]
    .sort((a, b) => a.orden - b.orden || a.nombre.localeCompare(b.nombre))
    .map((f) => ({
      id: f.id,
      nombre: f.nombre,
      complejidad: f.complejidad,
      categoria: f.categoria ?? null,
      toca: (f.feature_componente ?? []).map((t) => ({
        componenteId: t.componente_id,
        ...(t.complejidad_override === null ? {} : { complejidad: t.complejidad_override }),
      })),
      elementos: (f.feature_elemento ?? []).map((e) => ({
        elemento: e.elemento,
        cantidad: e.cantidad,
        complejidad: e.complejidad,
      })),
    }))

  const integraciones = (fila.integracion ?? [])
    // Una integracion sin componente dueño no puede entrar en ningun stream.
    .filter((i) => i.componente_duenio_id !== null)
    .map((i) => ({
      id: i.id,
      nombre: i.nombre,
      complejidad: i.complejidad,
      componenteDuenioId: i.componente_duenio_id as string,
      esExterna: i.es_externa,
      tieneSandbox: i.tiene_sandbox,
      usos: i.usos,
    }))

  const drivers = completarDrivers(
    (fila.driver ?? []).map((d) => ({ clave: d.clave, etiqueta: '', delta: Number(d.delta) })),
  )

  return {
    proyectoId: fila.id,
    nombre: fila.nombre,
    jornada: { horasDia: Number(fila.horas_dia), diasMes: fila.dias_mes },
    nivelCompromiso: nivelCompromisoValido(fila.nivel_compromiso),
    componentes,
    features,
    integraciones,
    drivers,
  }
}

/** Cuenta de elementos del alcance, para mostrar el tamaño de un vistazo. */
export function resumirAlcance(alcance: AlcanceDeProyecto) {
  return {
    componentes: alcance.componentes.length,
    features: alcance.features.length,
    integraciones: alcance.integraciones.length,
    pares: alcance.features.reduce((t, f) => t + f.toca.length, 0),
    sinClasificar: alcance.features.filter((f) => f.categoria === null).length,
    elementos: alcance.features.reduce(
      (t, f) => t + f.elementos.reduce((s, e) => s + e.cantidad, 0),
      0,
    ),
  }
}
