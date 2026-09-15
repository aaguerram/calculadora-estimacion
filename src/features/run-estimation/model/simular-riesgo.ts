import { factorOverhead } from '@/entities/estimation-model'
import type { CoeficientesModelo } from '@/entities/estimation-model'
import { crearRng, multiplicadorLognormal, muestraTriangular, percentil } from '@/shared/lib'

import type { BandaRiesgo, EsfuerzoDesarrollo, Jornada } from './types'

export interface OpcionesSimulacion {
  coeficientes: CoeficientesModelo
  jornada: Jornada
  nivelCompromiso: 50 | 80 | 90
  semilla: number
  iteraciones: number
}

/**
 * Monte Carlo sobre los items, con RIESGO COMUN.
 *
 * El factor lognormal por corrida es imprescindible: sumar decenas de items
 * independientes hace que el teorema central del limite colapse la varianza y
 * produzca una banda P50-P90 de +-3%, que nadie se cree. En la realidad los
 * sobrecostes estan correlacionados (doc §5).
 */
export function simularRiesgo(
  esfuerzo: EsfuerzoDesarrollo,
  opciones: OpcionesSimulacion,
): BandaRiesgo {
  const { coeficientes, jornada, nivelCompromiso, semilla, iteraciones } = opciones
  const aleatorio = crearRng(semilla)
  const sigma = coeficientes.riesgo.sigmaComun
  const overhead = factorOverhead(coeficientes)
  const horasMesHombre = jornada.horasDia * jornada.diasMes

  const corridas = new Float64Array(iteraciones)
  for (let i = 0; i < iteraciones; i++) {
    let suma = 0
    for (const item of esfuerzo.items) {
      suma += muestraTriangular(
        item.horasOptimista,
        item.horasModal,
        item.horasPesimista,
        aleatorio,
      )
    }
    corridas[i] = suma * esfuerzo.factorProyecto * multiplicadorLognormal(sigma, aleatorio)
  }

  const ordenadas = Array.from(corridas).sort((a, b) => a - b)
  const devP50Horas = percentil(ordenadas, 0.5)
  const devP80Horas = percentil(ordenadas, 0.8)
  const devP90Horas = percentil(ordenadas, 0.9)

  const comprometidoHoras =
    nivelCompromiso === 50 ? devP50Horas : nivelCompromiso === 90 ? devP90Horas : devP80Horas
  const totalHoras = comprometidoHoras * overhead

  return {
    devP50Horas,
    devP80Horas,
    devP90Horas,
    comprometidoHoras,
    totalHoras,
    totalMesesHombre: totalHoras / horasMesHombre,
    colchonSobreP50: devP50Horas > 0 ? comprometidoHoras / devP50Horas - 1 : 0,
  }
}

/**
 * Cuanto sube el esfuerzo al exigir el percentil comprometido en lugar del modal.
 * Se aplica a cada componente para repartir la banda entre los streams.
 */
export function escalaDeCompromiso(
  esfuerzo: EsfuerzoDesarrollo,
  riesgo: BandaRiesgo,
): number {
  if (esfuerzo.devNominalHoras <= 0) return 1
  return riesgo.comprometidoHoras / esfuerzo.devNominalHoras
}
