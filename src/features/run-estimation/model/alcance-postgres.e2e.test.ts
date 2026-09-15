//
// Test de INTEGRACION: exige el stack levantado (`npm run stack:up`).
// Se ejecuta con `npm run test:e2e`.
//
// AUTOCONTENIDO: crea su propio proyecto con alcance completo (los tres ejes),
// lo lee de vuelta y comprueba que estima igual que el alcance en memoria.
// Al terminar lo borra: no deja datos sinteticos en la base.
//
import type { Catalogo } from '@/entities/feature-catalog'
import { cargarCatalogo } from '@/entities/feature-catalog'
import { crearProyecto, eliminarProyecto } from '@/entities/estimation-project'
import {
  cargarAlcance,
  crearComponente,
  crearFeature,
  crearIntegracion,
  fijarCategoriaFeature,
  fijarDriver,
  marcarElemento,
  vincularFeatureComponente,
} from '@/entities/project-scope'
import type { AlcanceDeProyecto } from '@/entities/project-scope'
import { fijarToken } from '@/shared/api'
import { leerEnv } from '@/shared/config'
import { afterAll, beforeAll, expect, it } from 'vitest'

import { ejecutarEstimacion } from './run-estimation'

const NOMBRE = `e2e-alcance ${Date.now()}`
let proyectoId = ''
let catalogo: Catalogo
let alcance: AlcanceDeProyecto | null = null

beforeAll(async () => {
  fijarToken(leerEnv('VITE_POSTGREST_TOKEN'))
  catalogo = await cargarCatalogo()

  const proyecto = await crearProyecto({ nombre: NOMBRE, cliente: 'e2e' })
  proyectoId = proyecto.id

  await crearComponente(proyectoId, {
    nombre: 'Portal', tipo: 'front-angular', stack: 'angular17', esNuevo: true,
  })
  await crearComponente(proyectoId, {
    nombre: 'Core', tipo: 'micro-core', stack: 'net8', esNuevo: false,
  })
  await crearComponente(proyectoId, {
    nombre: 'Host', tipo: 'componente-3gl', stack: 'cobol', esNuevo: false,
  })

  const cargado = await cargarAlcance(proyectoId)
  const idPorNombre = new Map(cargado!.componentes.map((c) => [c.nombre, c.id]))

  await crearFeature(proyectoId, { nombre: 'Consulta de saldos', complejidad: 'm', orden: 1 })
  await crearFeature(proyectoId, { nombre: 'Transferencia', complejidad: 'a', orden: 2 })

  const conFeatures = await cargarAlcance(proyectoId)
  const feaPorNombre = new Map(conFeatures!.features.map((f) => [f.nombre, f.id]))
  const saldos = feaPorNombre.get('Consulta de saldos')!
  const transferencia = feaPorNombre.get('Transferencia')!

  for (const c of ['Portal', 'Core']) {
    await vincularFeatureComponente(saldos, idPorNombre.get(c)!)
  }
  for (const c of ['Portal', 'Core', 'Host']) {
    await vincularFeatureComponente(transferencia, idPorNombre.get(c)!)
  }

  // Eje 1 y eje 3 solo en la primera: la segunda debe caer al metodo estructural.
  await fijarCategoriaFeature(saldos, 'pantalla')
  await marcarElemento(saldos, 'pant.listado')
  await marcarElemento(saldos, 'pant.buscador')

  await crearIntegracion(proyectoId, {
    nombre: 'Core bancario', complejidad: 'a', componenteDuenioId: idPorNombre.get('Core')!,
    esExterna: false, tieneSandbox: false, usos: 2,
  })
  await fijarDriver(proyectoId, 'claridad-requisitos', 0.15)

  alcance = await cargarAlcance(proyectoId)
}, 180000)

afterAll(async () => {
  if (proyectoId) await eliminarProyecto(proyectoId)
  expect(await cargarAlcance(proyectoId), 'el test debe dejar la base como la encontró').toBeNull()
}, 60000)

it('el alcance vuelve de Postgres con los tres ejes intactos', () => {
  expect(alcance).not.toBeNull()
  expect(alcance!.componentes).toHaveLength(3)
  expect(alcance!.features).toHaveLength(2)
  expect(alcance!.integraciones).toHaveLength(1)

  const saldos = alcance!.features.find((f) => f.nombre === 'Consulta de saldos')!
  expect(saldos.categoria).toBe('pantalla')
  expect(saldos.toca).toHaveLength(2)
  expect(saldos.elementos.map((e) => e.elemento).sort()).toEqual([
    'pant.buscador',
    'pant.listado',
  ])

  const host = alcance!.componentes.find((c) => c.nombre === 'Host')!
  expect(host.tipo).toBe('componente-3gl')
  expect(host.stack).toBe('cobol')
})

it('estima igual leído de Postgres que en memoria, y es reproducible', () => {
  const a = ejecutarEstimacion(alcance!, { catalogo, iteraciones: 6000 })
  const b = ejecutarEstimacion(alcance!, { catalogo, iteraciones: 6000 })
  expect(a.esfuerzo.devBrutoHoras).toBeCloseTo(b.esfuerzo.devBrutoHoras, 6)
  expect(a.riesgo.totalMesesHombre).toBeCloseTo(b.riesgo.totalMesesHombre, 6)
})

it('mide con puntos función la feature marcada y con el método estructural la otra', () => {
  const { esfuerzo } = ejecutarEstimacion(alcance!, { catalogo, iteraciones: 2000 })

  const saldos = esfuerzo.medidas.find((m) => m.nombre === 'Consulta de saldos')!
  const transferencia = esfuerzo.medidas.find((m) => m.nombre === 'Transferencia')!

  expect(saldos.metodo).toBe('puntos-funcion')
  expect(saldos.puntosFuncion).toBe(8) // listado 4 + buscador 4, ambos a media
  expect(transferencia.metodo).toBe('estructural')
  expect(transferencia.puntosFuncion).toBe(0)

  console.log(
    `PF total ${esfuerzo.puntosFuncionTotales} · ${esfuerzo.featuresPorPuntos}/${esfuerzo.medidas.length} por puntos · dev ${esfuerzo.devBrutoHoras.toFixed(0)} h`,
  )
})
