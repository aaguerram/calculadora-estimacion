import { COEFICIENTES_POR_DEFECTO } from '../config/defaults'

import type {
  CoeficientesModelo,
  NivelComplejidad,
  StackTecnologico,
  TipoComponente,
} from './types'
import { NIVELES_COMPLEJIDAD, TIPOS_COMPONENTE } from './types'

/** Una fila de `estimacion.modelo_coeficiente`, ya en dominio. */
export interface CoeficienteCalibrado {
  clave: string
  valor: number
}

const STACKS: readonly StackTecnologico[] = [
  'net8',
  'netcore',
  'netfx',
  'angular17',
  'angular12',
  'cobol',
  'otro-3gl',
]

const esTipo = (v: string): v is TipoComponente =>
  (TIPOS_COMPONENTE as readonly string[]).includes(v)
const esNivel = (v: string): v is NivelComplejidad =>
  (NIVELES_COMPLEJIDAD as readonly string[]).includes(v)
const esStack = (v: string): v is StackTecnologico => (STACKS as readonly string[]).includes(v)

function clonar(base: CoeficientesModelo): CoeficientesModelo {
  return {
    base: { ...base.base },
    cap: { ...base.cap },
    bootstrap: { ...base.bootstrap },
    complejidad: { ...base.complejidad },
    stack: { ...base.stack },
    integracion: {
      ...base.integracion,
      porComplejidad: { ...base.integracion.porComplejidad },
    },
    pert: Object.fromEntries(
      Object.entries(base.pert).map(([k, v]) => [k, { ...v }]),
    ) as CoeficientesModelo['pert'],
    pertIntegracion: { ...base.pertIntegracion },
    pertBootstrap: { ...base.pertBootstrap },
    puntosFuncion: { ...base.puntosFuncion },
    overhead: { ...base.overhead },
    equipo: { ...base.equipo },
    riesgo: { ...base.riesgo },
  }
}

/**
 * Aplica una clave `grupo.subclave` sobre los coeficientes.
 * Devuelve `false` si la clave no se reconoce (para poder avisarlo, no ignorarlo).
 */
function aplicar(destino: CoeficientesModelo, clave: string, valor: number): boolean {
  const separador = clave.indexOf('.')
  if (separador < 0) return false
  const grupo = clave.slice(0, separador)
  const sub = clave.slice(separador + 1)

  switch (grupo) {
    case 'base':
      if (!esTipo(sub)) return false
      destino.base[sub] = valor
      return true
    case 'cap':
      if (!esTipo(sub)) return false
      destino.cap[sub] = valor
      return true
    case 'bootstrap':
      if (!esTipo(sub)) return false
      destino.bootstrap[sub] = valor
      return true
    case 'complejidad':
      if (!esNivel(sub)) return false
      destino.complejidad[sub] = valor
      return true
    case 'stack':
      if (!esStack(sub)) return false
      destino.stack[sub] = valor
      return true
    case 'integracion':
      if (esNivel(sub)) {
        destino.integracion.porComplejidad[sub] = valor
        return true
      }
      if (sub === 'externa') {
        destino.integracion.recargoExterna = valor
        return true
      }
      if (sub === 'sin-sandbox') {
        destino.integracion.recargoSinSandbox = valor
        return true
      }
      if (sub === 'uso-extra') {
        destino.integracion.recargoUsoExtra = valor
        return true
      }
      return false
    case 'overhead':
      if (sub === 'documentacion') {
        destino.overhead.documentacion = valor
        return true
      }
      if (sub in destino.overhead) {
        destino.overhead[sub as keyof CoeficientesModelo['overhead']] = valor
        return true
      }
      return false
    case 'equipo':
      if (sub === 'gamma') {
        destino.equipo.gamma = valor
        return true
      }
      if (sub === 'delta') {
        destino.equipo.delta = valor
        return true
      }
      if (sub === 'onboarding') {
        destino.equipo.onboarding = valor
        return true
      }
      return false
    case 'riesgo':
      if (sub === 'sigma-comun') {
        destino.riesgo.sigmaComun = valor
        return true
      }
      return false
    case 'pf':
      if (sub === 'horas-por-punto') {
        destino.puntosFuncion.horasDevPorPunto = valor
        return true
      }
      return false
    // `jornada.*` describe la jornada del proyecto, no el modelo: se ignora aqui.
    case 'jornada':
      return true
    default:
      return false
  }
}

export interface ResultadoMerge {
  coeficientes: CoeficientesModelo
  /** Claves que la base trae y el modelo no entiende. Se avisan, no se tragan. */
  clavesDesconocidas: string[]
}

/**
 * Funde los coeficientes calibrados sobre los valores por defecto.
 * Cualquier clave ausente en la base conserva su valor semilla.
 */
export function fundirCoeficientes(
  calibrados: readonly CoeficienteCalibrado[],
  semilla: CoeficientesModelo = COEFICIENTES_POR_DEFECTO,
): ResultadoMerge {
  const coeficientes = clonar(semilla)
  const clavesDesconocidas: string[] = []

  for (const { clave, valor } of calibrados) {
    if (!Number.isFinite(valor)) {
      clavesDesconocidas.push(clave)
      continue
    }
    if (!aplicar(coeficientes, clave, valor)) clavesDesconocidas.push(clave)
  }

  return { coeficientes, clavesDesconocidas }
}
