import { COEFICIENTES_POR_DEFECTO } from '@/entities/estimation-model'

import { calcularEsfuerzo } from './calcular-esfuerzo'
import { contrastarConCocomo, detectarAlertas } from './detectar-alertas'
import { planificarEquipo } from './planificar-equipo'
import { escalaDeCompromiso, simularRiesgo } from './simular-riesgo'
import type { Alcance, Estimacion, OpcionesEstimacion } from './types'

export const SEMILLA_POR_DEFECTO = 20260914

/**
 * El motor completo. Puro y determinista: con la misma semilla produce
 * exactamente la misma estimacion, que es lo que permite auditarla y testearla.
 *
 * Pasos (doc §6.4):
 *   1. Esfuerzo por par (feature x componente) + arranques + integraciones
 *   2. Monte Carlo con riesgo comun -> banda P50/P80/P90
 *   3. Streams por componente -> ruta critica
 *   4. Punto fijo de coordinacion -> frontera equipo/tiempo/coste
 *   5. Contraste COCOMO + detectores de estimacion enferma
 */
export function ejecutarEstimacion(
  alcance: Alcance,
  opciones: Partial<OpcionesEstimacion> = {},
): Estimacion {
  const coeficientes = opciones.coeficientes ?? COEFICIENTES_POR_DEFECTO
  const semilla = opciones.semilla ?? SEMILLA_POR_DEFECTO
  const iteraciones = Math.max(100, opciones.iteraciones ?? coeficientes.riesgo.iteraciones)
  const horasPorMesHombre = alcance.jornada.horasDia * alcance.jornada.diasMes

  const esfuerzo = calcularEsfuerzo(alcance, coeficientes, opciones.catalogo)

  const riesgo = simularRiesgo(esfuerzo, {
    coeficientes,
    jornada: alcance.jornada,
    nivelCompromiso: alcance.nivelCompromiso,
    semilla,
    iteraciones,
  })

  // La banda se reparte proporcionalmente entre los streams.
  const escala = escalaDeCompromiso(esfuerzo, riesgo)
  const mesesHombrePorComponente: Record<string, number> = {}
  for (const [componenteId, horas] of Object.entries(esfuerzo.horasPorComponente)) {
    mesesHombrePorComponente[componenteId] =
      (horas * esfuerzo.factorProyecto * escala) / horasPorMesHombre
  }

  const horasArranque = esfuerzo.items
    .filter((i) => i.categoria === 'bootstrap')
    .reduce((t, i) => t + i.horasModal, 0)

  const equipo = planificarEquipo(alcance, {
    coeficientes,
    mesesHombrePorComponente,
    mesesHombreArranque: (horasArranque * esfuerzo.factorProyecto * escala) / horasPorMesHombre,
  })

  const contraste = contrastarConCocomo(
    riesgo.totalMesesHombre,
    equipo.recomendado.duracionMeses,
  )

  const alertas = detectarAlertas({
    alcance,
    esfuerzo,
    riesgo,
    equipo,
    contraste,
    coeficientes,
  })

  return {
    alcance: alcance.nombre,
    jornada: alcance.jornada,
    horasPorMesHombre,
    nivelCompromiso: alcance.nivelCompromiso,
    esfuerzo,
    riesgo,
    equipo,
    contraste,
    alertas,
  }
}
