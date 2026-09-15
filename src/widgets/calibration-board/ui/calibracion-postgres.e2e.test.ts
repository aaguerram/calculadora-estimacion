//
// Test de INTEGRACION: exige el stack levantado (`npm run stack:up`).
// Se ejecuta con `npm run test:e2e`.
//
// Es AUTOCONTENIDO: crea su propio historico de prueba con un sesgo conocido,
// verifica que la calibracion lo recupera, y lo borra al terminar. Asi no deja
// datos sinteticos en la base, que contaminarian la calibracion real.
//
import { COEFICIENTES_POR_DEFECTO } from '@/entities/estimation-model'
import type { CoeficientesModelo } from '@/entities/estimation-model'
import { cargarCatalogo } from '@/entities/feature-catalog'
import type { Catalogo } from '@/entities/feature-catalog'
import {
  archivarProyecto,
  ejecutarBacktest,
  eliminarHistorico,
  listarHistoricos,
  proponerCalibracion,
} from '@/entities/historical-project'
import type { Estimador } from '@/entities/historical-project'
import type { Alcance } from '@/entities/project-scope'
import { refinarCambios, simularCambios } from '@/features/calibrate-model'
import { ALCANCE_DEMO, ejecutarEstimacion } from '@/features/run-estimation'
import { fijarToken, fijarUrlBase } from '@/shared/api'
import { leerEnv } from '@/shared/config'
import { afterAll, beforeAll, expect, it } from 'vitest'

let catalogo: Catalogo = { categorias: [], elementos: [] }
const MARCA = 'e2e-calibracion'
/** El modelo subestima un 22 %: es lo que la calibración tiene que recuperar. */
const SESGO = 1.22

const estimadorCon =
  (coeficientes: CoeficientesModelo): Estimador =>
  (historico) => {
    const e = ejecutarEstimacion(historico.alcance!, { coeficientes, catalogo, iteraciones: 3000 })
    const medidas = e.esfuerzo.medidas
    return {
      mesesHombre: e.riesgo.totalMesesHombre,
      horasPorBucket: e.esfuerzo.horasPorTipo as Record<string, number>,
      fraccionPorPuntos: medidas.length ? e.esfuerzo.featuresPorPuntos / medidas.length : 0,
    }
  }

/** Variantes del alcance de referencia: distinto tamaño y distinta mezcla. */
function variantes(): Alcance[] {
  const recortar = (nombre: string, nFeatures: number, quitar: string[]): Alcance => {
    const componentes = ALCANCE_DEMO.componentes.filter((c) => !quitar.includes(c.id))
    const validos = new Set(componentes.map((c) => c.id))
    return {
      ...ALCANCE_DEMO,
      nombre: `${MARCA} ${nombre}`,
      componentes,
      // Se marcan elementos en la mitad de las features para que el historico
      // ejercite de verdad la ruta de puntos funcion.
      features: ALCANCE_DEMO.features.slice(0, nFeatures).map((f, i) => ({
        ...f,
        toca: f.toca.filter((t) => validos.has(t.componenteId)),
        elementos:
          i % 2 === 0
            ? [
                { elemento: 'pant.listado', cantidad: 2, complejidad: 'm' as const },
                { elemento: 'dat.entidad', cantidad: 1, complejidad: 'm' as const },
              ]
            : [],
      })),
      integraciones: ALCANCE_DEMO.integraciones.filter((i) =>
        validos.has(i.componenteDuenioId),
      ),
    }
  }
  return [
    recortar('A', 6, ['legacy']),
    recortar('B', 8, ['neg-b']),
    recortar('C', 5, ['web', 'neg-b']),
    recortar('D', 10, []),
    recortar('E', 9, ['neg-b']),
    recortar('F', 12, []),
  ]
}

const creados: string[] = []

beforeAll(async () => {
  // En Node no hay origen: la base relativa `/api` no resuelve.
  fijarUrlBase(leerEnv('VITE_POSTGREST_URL_ABSOLUTA'))
  fijarToken(leerEnv('VITE_POSTGREST_TOKEN'))
  catalogo = await cargarCatalogo()

  let i = 0
  for (const alcance of variantes()) {
    const estimado = ejecutarEstimacion(alcance, {
      coeficientes: COEFICIENTES_POR_DEFECTO,
      catalogo,
      iteraciones: 4000,
    }).riesgo.totalMesesHombre

    // Ruido determinista: ±6 % alternando, sin azar que haga el test inestable.
    const ruido = 1 + ((i % 3) - 1) * 0.06
    await archivarProyecto({
      nombre: alcance.nombre,
      cerradoEn: `202${4 + (i % 3)}-0${1 + (i % 9)}-15`,
      mhEstimadas: estimado,
      mhReales: estimado * SESGO * ruido,
      mesesReales: 10,
      personasReales: 8,
      alcance,
    })
    i++
  }

  for (const h of await listarHistoricos()) {
    if (h.nombre.startsWith(MARCA)) creados.push(h.id)
  }
}, 120000)

afterAll(async () => {
  for (const id of creados) await eliminarHistorico(id)
  const quedan = (await listarHistoricos()).filter((h) => h.nombre.startsWith(MARCA))
  expect(quedan, 'el test debe dejar la base como la encontró').toEqual([])
}, 60000)

it('la calibración recupera el sesgo y baja el MMRE', async () => {
  const historicos = (await listarHistoricos()).filter((h) => h.nombre.startsWith(MARCA))
  expect(historicos.length).toBe(6)

  const antes = ejecutarBacktest(historicos, estimadorCon(COEFICIENTES_POR_DEFECTO))
  const propuesta = proponerCalibracion(antes.errores, antes.observaciones)
  const { cambios, convergio, rondas } = refinarCambios(
    COEFICIENTES_POR_DEFECTO,
    propuesta,
    (candidatos) => ejecutarBacktest(historicos, estimadorCon(candidatos)).errores,
    antes.fraccionPorPuntos,
  )
  const despues = ejecutarBacktest(
    historicos,
    estimadorCon(simularCambios(COEFICIENTES_POR_DEFECTO, cambios)),
  )

  const pct = (v: number) => `${(v * 100).toFixed(1)} %`
  console.log(`proyectos: ${antes.metricas.n}  ·  refinamiento: ${rondas} ronda(s)`)
  console.log(`cobertura de puntos función: ${(antes.fraccionPorPuntos * 100).toFixed(0)} %`)
  const pfCambio = cambios.find((c) => c.clave === 'pf.horas-por-punto')
  console.log(
    `pf.horas-por-punto: ${pfCambio ? `${pfCambio.valorActual} -> ${pfCambio.valorPropuesto} (${pfCambio.confianza})` : 'NO PROPUESTO'}`,
  )
  console.log(`MMRE   ${pct(antes.metricas.mmre)}  ->  ${pct(despues.metricas.mmre)}`)
  console.log(`sesgo  ${pct(antes.metricas.sesgo)}  ->  ${pct(despues.metricas.sesgo)}`)
  console.log(`factor global propuesto: x${propuesta.factorGlobal.toFixed(3)} (sembrado x${SESGO})`)

  expect(propuesta.factorGlobal).toBeGreaterThan(1.15)
  expect(propuesta.factorGlobal).toBeLessThan(1.3)
  expect(despues.metricas.mmre).toBeLessThan(antes.metricas.mmre)
  expect(convergio).toBe(true)
  expect(Math.abs(despues.metricas.sesgo)).toBeLessThan(0.03)

  // Lo nuevo: el historico usa puntos funcion y la calibracion los corrige.
  expect(antes.fraccionPorPuntos).toBeGreaterThan(0.2)
  expect(cambios.some((c) => c.clave === 'pf.horas-por-punto')).toBe(true)
}, 120000)
