#!/usr/bin/env node
//
// Humo sobre la interfaz real: abre cada ruta en un navegador de verdad y
// reporta avisos de error, peticiones fallidas y errores de consola.
//
//   npm run ui:revisar            navegador limpio
//   npm run ui:revisar -- --sucio  simula un token viejo en localStorage
//
// Existe porque probar la API por curl NO detecta los fallos del navegador:
// asi se encontro que un token caducado en localStorage tapaba al del entorno
// y dejaba toda la aplicacion en 401.
//
import { firefox } from 'playwright'

const RUTAS = ['/', '/ingresar', '/historico', '/calibracion', '/fuentes']
const BASE = process.env.UI_BASE ?? 'http://localhost:5173'
const SUCIO = process.argv.includes('--sucio')

/** Token vigente pero firmado con otro secreto: lo que queda tras un reset del stack. */
const TOKEN_MUERTO =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiZXN0aW1hZG9yIiwic3ViIjoidmllam9AbG9jYWwiLCJvcmciOiJkZWZhdWx0IiwiaWF0IjoxNzAwMDAwMDAwLCJleHAiOjE4MDAwMDAwMDB9.firma-invalida'

const navegador = await firefox.launch()
const contexto = await navegador.newContext({ viewport: { width: 1360, height: 1000 } })
const pagina = await contexto.newPage()

if (SUCIO) {
  await pagina.goto(BASE)
  await pagina.evaluate((t) => localStorage.setItem('calculadora.postgrest.token', t), TOKEN_MUERTO)
}

let problemas = 0
const consola = []
pagina.on('console', (m) => {
  if (m.type() === 'error') consola.push(m.text().slice(0, 160))
})

for (const ruta of RUTAS) {
  consola.length = 0
  await pagina.goto(`${BASE}${ruta}`, { waitUntil: 'networkidle', timeout: 45000 })
  await pagina.waitForTimeout(900)

  const avisos = await pagina.locator('.cds--inline-notification').allInnerTexts()
  const errores = avisos.filter((a) => /no se pud|error|401|403|caduc/i.test(a))
  const titulo = await pagina.locator('h1, h2').first().innerText().catch(() => '?')

  console.log(`\n  ${ruta.padEnd(14)} ${titulo.replace(/\n/g, ' ')}`)
  if (errores.length) {
    problemas += errores.length
    for (const e of errores) console.log(`    ✘ ${e.replace(/\n/g, ' | ')}`)
  } else {
    console.log('    ✔ sin avisos de error')
  }
  for (const c of consola) {
    problemas++
    console.log(`    ✘ consola: ${c}`)
  }
}

await navegador.close()
console.log(
  problemas === 0
    ? `\n✔ ${RUTAS.length} rutas sin problemas${SUCIO ? ' (con token viejo: se recuperó solo)' : ''}`
    : `\n✘ ${problemas} problema(s)`,
)
process.exit(problemas === 0 ? 0 : 1)
