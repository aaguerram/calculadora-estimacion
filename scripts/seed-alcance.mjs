#!/usr/bin/env node
//
// Carga el alcance de referencia (docs/modelo-estimacion.md §7) en Postgres
// usando los MISMOS endpoints de PostgREST que usa el ABM de la interfaz.
//
//   npm run seed
//
import { readFileSync } from 'node:fs'

const env = readFileSync(new URL('../.env', import.meta.url), 'utf8')
const leer = (clave) => {
  const linea = env.split('\n').find((l) => l.startsWith(`${clave}=`))
  return linea ? linea.slice(clave.length + 1).trim() : undefined
}

const BASE = leer('VITE_POSTGREST_URL_ABSOLUTA') ?? 'http://localhost:3000'
const TOKEN = leer('VITE_POSTGREST_TOKEN')
if (!TOKEN) {
  console.error('Falta VITE_POSTGREST_TOKEN en .env. Ejecuta `npm run token:env`.')
  process.exit(1)
}

async function api(ruta, { metodo = 'GET', cuerpo, prefer } = {}) {
  const res = await fetch(`${BASE}${ruta}`, {
    method: metodo,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: 'application/json',
      ...(cuerpo ? { 'Content-Type': 'application/json' } : {}),
      Prefer: prefer ?? (metodo === 'GET' ? '' : 'return=representation'),
    },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  })
  if (!res.ok) {
    throw new Error(`${metodo} ${ruta} -> ${res.status} ${await res.text()}`)
  }
  // `return=minimal` responde 201 con cuerpo vacio: no se puede parsear a ciegas.
  const texto = await res.text()
  return texto.length === 0 ? null : JSON.parse(texto)
}

const COMPONENTES = [
  ['Portal web', 'front-angular', 'angular17', true],
  ['BFF web', 'bff', 'net8', true],
  ['Micro de experiencia', 'micro-experiencia', 'net8', true],
  ['Micro clientes', 'micro-negocio', 'net8', true],
  ['Micro notificaciones', 'micro-negocio', 'net8', false],
  ['Micro core cuentas', 'micro-core', 'net8', true],
  ['Monolito legado', 'monolito-netfx', 'netfx', false],
]

const FEATURES = [
  ['Alta de cliente', 'a', ['Portal web', 'BFF web', 'Micro de experiencia', 'Micro clientes', 'Micro core cuentas']],
  ['Consulta de saldos', 'm', ['Portal web', 'BFF web', 'Micro de experiencia', 'Micro core cuentas']],
  ['Transferencia interna', 'ma', [['Portal web', 'a'], 'BFF web', 'Micro de experiencia', 'Micro clientes', 'Micro core cuentas', 'Monolito legado']],
  ['Historial de movimientos', 'm', ['Portal web', 'BFF web', 'Micro core cuentas']],
  ['Gestión de beneficiarios', 'm', ['Portal web', 'BFF web', 'Micro notificaciones']],
  ['Notificaciones', 'b', ['BFF web', 'Micro notificaciones']],
  ['Login y MFA', 'a', ['Portal web', 'BFF web', 'Micro de experiencia', 'Monolito legado']],
  ['Perfil y preferencias', 'b', ['Portal web', 'BFF web', 'Micro notificaciones']],
  ['Reportes descargables', 'm', ['Portal web', 'BFF web', 'Micro clientes']],
  ['Bloqueo de tarjeta', 'a', ['Portal web', 'BFF web', 'Micro de experiencia', 'Micro core cuentas', 'Monolito legado']],
  ['Onboarding biométrico', 'ma', ['Portal web', 'BFF web', 'Micro de experiencia', 'Micro clientes']],
  ['Panel de administración', 'm', ['Portal web', 'BFF web', 'Micro notificaciones']],
]

const INTEGRACIONES = [
  ['Core bancario (SOAP)', 'ma', 'Micro core cuentas', false, false, 5],
  ['Buró de crédito', 'a', 'Micro clientes', true, true, 2],
  ['Proveedor de biometría', 'a', 'Micro de experiencia', true, false, 1],
  ['Pasarela de notificaciones', 'm', 'Micro notificaciones', true, true, 2],
  ['IAM corporativo (OIDC)', 'm', 'BFF web', false, true, 12],
  ['Bus de eventos interno', 'b', 'Micro core cuentas', false, true, 4],
]

const DRIVERS = [
  ['madurez-dominio', 0],
  ['claridad-requisitos', 0.15],
  ['exigencia-nf', 0.1],
  ['deuda-tecnica', 0.12],
  ['terceros', 0.08],
]

const NOMBRE = 'Banca digital — referencia'

// Idempotente: si ya existe, se borra y se vuelve a crear (cascade limpia el resto).
const existentes = await api(`/proyecto?nombre=eq.${encodeURIComponent(NOMBRE)}&select=id`)
for (const p of existentes) {
  await api(`/proyecto?id=eq.${p.id}`, { metodo: 'DELETE', prefer: 'return=minimal' })
  console.log(`  proyecto anterior eliminado (${p.id})`)
}

const [proyecto] = await api('/proyecto', {
  metodo: 'POST',
  cuerpo: { nombre: NOMBRE, cliente: 'Banco X', horas_dia: 6, dias_mes: 20, nivel_compromiso: 80 },
})
console.log(`proyecto ${proyecto.id}`)

const idPorNombre = new Map()
for (const [nombre, tipo, stack, esNuevo] of COMPONENTES) {
  const [c] = await api('/componente', {
    metodo: 'POST',
    cuerpo: { proyecto_id: proyecto.id, nombre, tipo, stack, es_nuevo: esNuevo },
  })
  idPorNombre.set(nombre, c.id)
}
console.log(`  ${COMPONENTES.length} componentes`)

let pares = 0
for (const [indice, [nombre, complejidad, toca]] of FEATURES.entries()) {
  const [f] = await api('/feature', {
    metodo: 'POST',
    cuerpo: { proyecto_id: proyecto.id, nombre, complejidad, orden: indice + 1 },
  })
  // Una entrada puede ser "Nombre" o ["Nombre", complejidadPropia].
  const enlaces = toca.map((entrada) => {
    const [nombreComponente, override] = Array.isArray(entrada) ? entrada : [entrada, null]
    return {
      feature_id: f.id,
      componente_id: idPorNombre.get(nombreComponente),
      complejidad_override: override,
    }
  })
  await api('/feature_componente', { metodo: 'POST', cuerpo: enlaces, prefer: 'return=minimal' })
  pares += enlaces.length
}
console.log(`  ${FEATURES.length} features · ${pares} pares estimables`)

for (const [nombre, complejidad, duenio, externa, sandbox, usos] of INTEGRACIONES) {
  await api('/integracion', {
    metodo: 'POST',
    prefer: 'return=minimal',
    cuerpo: {
      proyecto_id: proyecto.id,
      nombre,
      complejidad,
      componente_duenio_id: idPorNombre.get(duenio),
      es_externa: externa,
      tiene_sandbox: sandbox,
      usos,
    },
  })
}
console.log(`  ${INTEGRACIONES.length} integraciones`)

await api('/driver', {
  metodo: 'POST',
  prefer: 'resolution=merge-duplicates,return=minimal',
  cuerpo: DRIVERS.map(([clave, delta]) => ({ proyecto_id: proyecto.id, clave, delta })),
})
console.log(`  ${DRIVERS.length} drivers`)
console.log('\nAlcance de referencia cargado. Selecciónalo en la interfaz con «Estimar».')
