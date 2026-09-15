#!/usr/bin/env node
//
// Diagnostico de la conexion con Postgres, de fuera hacia dentro.
//
//   npm run diagnostico
//
// Existe porque «no se puede conectar» puede venir de seis sitios distintos y
// sin esto hay que adivinar cual.
//
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')
let env = ''
try {
  env = readFileSync(join(RAIZ, '.env'), 'utf8')
} catch {
  console.error('✗ No existe .env. Copia .env.example a .env y ejecuta: npm run stack:up')
  process.exit(1)
}
const leer = (k) => env.split('\n').find((l) => l.startsWith(`${k}=`))?.slice(k.length + 1).trim()

const WEB = `http://localhost:${leer('WEB_PORT') ?? 5173}`
const API = leer('VITE_POSTGREST_URL_ABSOLUTA') ?? 'http://localhost:3001'
const TOKEN = leer('VITE_POSTGREST_TOKEN') ?? ''

let problemas = 0
const ok = (t) => console.log(`  ✔ ${t}`)
const mal = (t, arreglo) => {
  problemas++
  console.log(`  ✘ ${t}`)
  if (arreglo) console.log(`      → ${arreglo}`)
}

async function estado(url, cabeceras = {}) {
  try {
    const r = await fetch(url, { headers: cabeceras, signal: AbortSignal.timeout(6000) })
    return r.status
  } catch (e) {
    return e.name === 'TimeoutError' ? 'timeout' : 'sin respuesta'
  }
}

console.log('\n1. El token del entorno')
if (!TOKEN) {
  mal('no hay VITE_POSTGREST_TOKEN en .env', 'npm run token:env')
} else {
  try {
    const carga = JSON.parse(Buffer.from(TOKEN.split('.')[1], 'base64url').toString())
    const caduca = new Date(carga.exp * 1000)
    if (caduca < new Date()) {
      mal(`caducó el ${caduca.toISOString().slice(0, 10)}`, 'npm run token:env && docker compose up -d web')
    } else {
      ok(`rol ${carga.role}, vigente hasta ${caduca.toISOString().slice(0, 10)}`)
    }
  } catch {
    mal('el token de .env no es un JWT legible', 'npm run token:env')
  }
}

console.log('\n2. PostgREST directamente')
const directo = await estado(`${API}/modelo_coeficiente?limit=1`)
if (directo === 200) ok(`${API} responde 200`)
else mal(`${API} responde ${directo}`, 'docker compose ps · docker compose logs postgrest')

console.log('\n3. El servidor web')
const web = await estado(WEB)
if (web === 200) ok(`${WEB} responde 200`)
else mal(`${WEB} responde ${web}`, 'docker compose up -d web · docker compose logs web')

console.log('\n4. La API por el mismo origen (que es la que usa el navegador)')
const proxy = await estado(`${WEB}/api/modelo_coeficiente?limit=1`)
if (proxy === 200) ok(`${WEB}/api responde 200`)
else mal(`${WEB}/api responde ${proxy}`, 'reinicia el web: docker compose up -d --build web')

console.log('\n5. Permisos con el token')
for (const [ruta, perfil] of [
  ['/proyecto', null],
  ['/proyecto_historico', null],
  ['/fuente', 'benchmark'],
]) {
  const cab = { Authorization: `Bearer ${TOKEN}` }
  if (perfil) cab['Accept-Profile'] = perfil
  const s = await estado(`${WEB}/api${ruta}`, cab)
  if (s === 200) ok(`${ruta} 200`)
  else if (s === 401) mal(`${ruta} 401`, 'el token no vale: npm run token:env && docker compose up -d web')
  else if (s === 403) mal(`${ruta} 403`, 'el rol del token no tiene permiso sobre esa tabla')
  else mal(`${ruta} ${s}`)
}

console.log(
  problemas === 0
    ? '\n✔ Todo en orden desde fuera. Si el navegador sigue fallando:\n' +
      '   · recarga forzando (Ctrl+Shift+R)\n' +
      '   · abre la consola del navegador y mira el error exacto\n' +
      '   · borra el almacenamiento del sitio y vuelve a cargar\n'
    : `\n✘ ${problemas} problema(s). Empieza por el primero: los siguientes suelen ser consecuencia.\n`,
)
process.exit(problemas === 0 ? 0 : 1)
