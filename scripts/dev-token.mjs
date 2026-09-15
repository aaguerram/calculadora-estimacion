#!/usr/bin/env node
//
// Genera un JWT HS256 de desarrollo para hablar con PostgREST.
//
//   node scripts/dev-token.mjs                      imprime el token
//   node scripts/dev-token.mjs --write              lo escribe en .env como VITE_POSTGREST_TOKEN
//   node scripts/dev-token.mjs --write angel@x.ec otium --role estimador --days 30
//
// En produccion NO se usa: el token lo emite el IdP corporativo (OIDC) y
// PostgREST lo valida con la clave publica del emisor (RS256).
//
import { createHmac } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'

const RUTA_ENV = new URL('../.env', import.meta.url)

function leerEnv() {
  try {
    return readFileSync(RUTA_ENV, 'utf8')
  } catch {
    return null
  }
}

function valorDeEnv(contenido, clave) {
  const linea = contenido?.split('\n').find((l) => l.startsWith(`${clave}=`))
  return linea ? linea.slice(clave.length + 1).trim() : undefined
}

// ---------------------------------------------------------------- argumentos
const argv = process.argv.slice(2)
const escribir = argv.includes('--write')
const posicionales = argv.filter((a) => !a.startsWith('--'))
const opcion = (nombre, porDefecto) => {
  const i = argv.indexOf(`--${nombre}`)
  return i >= 0 && argv[i + 1] ? argv[i + 1] : porDefecto
}

const sub = posicionales[0] ?? 'dev@local'
const org = posicionales[1] ?? 'default'
// En desarrollo se usa `calibrador`, que HEREDA `estimador`: asi un solo token
// sirve para el ABM y para aplicar una recalibracion. En produccion los emite el
// IdP y cada persona lleva el rol que le corresponde.
const rol = opcion('role', escribir ? 'calibrador' : 'estimador')
const dias = Number(opcion('days', escribir ? '30' : '1'))

// ------------------------------------------------------------------ secreto
const contenidoEnv = leerEnv()
const secreto = process.env.PGRST_JWT_SECRET ?? valorDeEnv(contenidoEnv, 'PGRST_JWT_SECRET')

if (!secreto) {
  console.error('Falta PGRST_JWT_SECRET (variable de entorno o .env).')
  console.error('Copia .env.example a .env y pon un secreto de al menos 32 caracteres.')
  process.exit(1)
}
if (secreto.length < 32) {
  console.error(`PGRST_JWT_SECRET tiene ${secreto.length} caracteres; PostgREST exige 32 o más.`)
  process.exit(1)
}

// -------------------------------------------------------------------- firma
const b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url')
const ahora = Math.floor(Date.now() / 1000)
const header = b64({ alg: 'HS256', typ: 'JWT' })
const payload = b64({
  role: rol, // <- PostgREST hace SET ROLE con este claim
  sub,
  org,
  iat: ahora,
  exp: ahora + 60 * 60 * 24 * dias,
})
const firma = createHmac('sha256', secreto).update(`${header}.${payload}`).digest('base64url')
const token = `${header}.${payload}.${firma}`

// -------------------------------------------------------------------- salida
if (!escribir) {
  console.log(token)
  process.exit(0)
}

if (contenidoEnv === null) {
  console.error('No existe .env. Copia .env.example primero.')
  process.exit(1)
}

const lineas = contenidoEnv.split('\n')
const indice = lineas.findIndex((l) => l.startsWith('VITE_POSTGREST_TOKEN='))
if (indice >= 0) {
  lineas[indice] = `VITE_POSTGREST_TOKEN=${token}`
} else {
  lineas.push('', '# Token de desarrollo (lo regenera `npm run token:env`).', `VITE_POSTGREST_TOKEN=${token}`)
}
writeFileSync(RUTA_ENV, lineas.join('\n'))

const caduca = new Date((ahora + 60 * 60 * 24 * dias) * 1000)
console.log(`VITE_POSTGREST_TOKEN escrito en .env`)
console.log(`  rol      ${rol}`)
console.log(`  sub      ${sub}`)
console.log(`  org      ${org}`)
console.log(`  caduca   ${caduca.toISOString().slice(0, 16).replace('T', ' ')} UTC`)
