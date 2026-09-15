import type { Alcance } from '@/entities/project-scope/@x/historical-project'

import type { CierreDeProyecto } from '../api/historical-project.api'

export interface FilaImportada {
  fila: number
  cierre: CierreDeProyecto
  /** Sin alcance el proyecto se guarda, pero NO sirve para recalibrar. */
  calibra: boolean
}

export interface ErrorImportacion {
  fila: number
  campo: string
  motivo: string
}

export interface ResultadoImportacion {
  validos: FilaImportada[]
  errores: ErrorImportacion[]
}

const FECHA = /^\d{4}-\d{2}-\d{2}$/

function esObjeto(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/** Un alcance sirve para calibrar si tiene al menos un componente y una feature. */
export function alcanceUtilizable(valor: unknown): valor is Alcance {
  if (!esObjeto(valor)) return false
  const { componentes, features } = valor
  return (
    Array.isArray(componentes) &&
    componentes.length > 0 &&
    Array.isArray(features) &&
    features.length > 0
  )
}

function numero(
  origen: Record<string, unknown>,
  campo: string,
  fila: number,
  errores: ErrorImportacion[],
  opciones: { min?: number; obligatorio?: boolean } = {},
): number {
  const bruto = origen[campo]
  const { min = 0, obligatorio = true } = opciones
  if (bruto === undefined || bruto === null || bruto === '') {
    if (obligatorio) errores.push({ fila, campo, motivo: 'falta' })
    return 0
  }
  const n = typeof bruto === 'number' ? bruto : Number(String(bruto).replace(',', '.'))
  if (!Number.isFinite(n)) {
    errores.push({ fila, campo, motivo: `«${String(bruto)}» no es un número` })
    return 0
  }
  if (n <= min) {
    errores.push({ fila, campo, motivo: `debe ser mayor que ${min}` })
    return 0
  }
  return n
}

/**
 * Traduce lo pegado por el usuario en cierres cargables.
 *
 * Funcion pura y total: NUNCA lanza. Devuelve lo que se puede cargar y una lista
 * de motivos por los que el resto no. Tragarse una fila mal formada en silencio
 * es peor que rechazarla: contamina la calibracion sin que nadie se entere.
 */
export function parsearHistoricos(texto: string): ResultadoImportacion {
  const errores: ErrorImportacion[] = []
  const validos: FilaImportada[] = []

  let crudo: unknown
  try {
    crudo = JSON.parse(texto)
  } catch (e) {
    return {
      validos: [],
      errores: [
        { fila: 0, campo: 'json', motivo: e instanceof Error ? e.message : 'JSON inválido' },
      ],
    }
  }

  const lista = Array.isArray(crudo) ? crudo : [crudo]
  if (lista.length === 0) {
    return { validos: [], errores: [{ fila: 0, campo: 'json', motivo: 'la lista está vacía' }] }
  }

  lista.forEach((elemento, indice) => {
    const fila = indice + 1
    if (!esObjeto(elemento)) {
      errores.push({ fila, campo: '(fila)', motivo: 'no es un objeto' })
      return
    }

    const antes = errores.length
    const nombre = typeof elemento.nombre === 'string' ? elemento.nombre.trim() : ''
    if (nombre.length < 3) errores.push({ fila, campo: 'nombre', motivo: 'mínimo 3 caracteres' })

    const cerradoEn = String(elemento.cerradoEn ?? '')
    if (!FECHA.test(cerradoEn)) {
      errores.push({ fila, campo: 'cerradoEn', motivo: 'formato esperado AAAA-MM-DD' })
    }

    const mhEstimadas = numero(elemento, 'mhEstimadas', fila, errores)
    const mhReales = numero(elemento, 'mhReales', fila, errores)
    const mesesReales = numero(elemento, 'mesesReales', fila, errores)
    const personasReales = numero(elemento, 'personasReales', fila, errores)

    const calibra = alcanceUtilizable(elemento.alcance)
    if (elemento.alcance !== undefined && !calibra) {
      errores.push({
        fila,
        campo: 'alcance',
        motivo: 'necesita al menos un componente y una feature para poder recalibrar',
      })
    }

    if (errores.length !== antes) return

    validos.push({
      fila,
      calibra,
      cierre: {
        nombre,
        cerradoEn,
        mhEstimadas,
        mhReales,
        mesesReales,
        personasReales,
        alcance: (calibra ? elemento.alcance : {}) as Alcance,
      },
    })
  })

  return { validos, errores }
}

/** Ejemplo mínimo del formato, para que nadie tenga que adivinarlo. */
export const EJEMPLO_IMPORTACION = `[
  {
    "nombre": "Portal de clientes v1",
    "cerradoEn": "2025-03-31",
    "mhEstimadas": 48.5,
    "mhReales": 61.2,
    "mesesReales": 7.5,
    "personasReales": 8,
    "alcance": {
      "nombre": "Portal de clientes v1",
      "jornada": { "horasDia": 6, "diasMes": 20 },
      "nivelCompromiso": 80,
      "componentes": [
        { "id": "web", "nombre": "Portal", "tipo": "front-angular", "stack": "angular17", "esNuevo": true },
        { "id": "core", "nombre": "Core", "tipo": "micro-core", "stack": "net8", "esNuevo": false }
      ],
      "features": [
        {
          "id": "f1",
          "nombre": "Consulta de saldos",
          "complejidad": "m",
          "categoria": "pantalla",
          "toca": [{ "componenteId": "web" }, { "componenteId": "core" }],
          "elementos": [{ "elemento": "pant.listado", "cantidad": 2, "complejidad": "m" }]
        }
      ],
      "integraciones": [
        {
          "id": "i1",
          "nombre": "Core bancario",
          "complejidad": "a",
          "componenteDuenioId": "core",
          "esExterna": false,
          "tieneSandbox": true,
          "usos": 2
        }
      ],
      "drivers": [
        { "clave": "claridad-requisitos", "etiqueta": "Claridad de los requisitos", "delta": 0.15 }
      ]
    }
  }
]`
