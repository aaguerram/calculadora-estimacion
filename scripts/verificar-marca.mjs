#!/usr/bin/env node
/**
 * Guardia de marca.
 *
 * Regla vinculante del proyecto: la identidad visual es IBM Carbon con el tema
 * claro cálido construido sobre la PALETA DE PRODUBANCO. Esta regla no se
 * confía a la memoria de nadie: se verifica.
 *
 * 1. Fuera del archivo de tema no puede existir NINGÚN color literal
 *    (hex, rgb(), hsl()) ni ninguna declaración `font-family`.
 * 2. Dentro del archivo de tema, cada color literal debe pertenecer a la
 *    paleta aprobada: los tonos del GDS de Produbanco más la rampa cálida
 *    hueso/arena que da la temperatura del tema.
 *
 * Uso: npm run lint:marca
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const RAIZ = new URL('..', import.meta.url).pathname
const SRC = join(RAIZ, 'src')
const TEMA = join(SRC, 'app/styles/_warm-light-theme.scss')
const EXTENSIONES = ['.scss', '.css', '.ts', '.tsx']

/** Paleta oficial del GDS de Produbanco (https://www.produbanco.com.ec). */
const PALETA_PRODUBANCO = {
  'verde primario': ['#002a18', '#003f24', '#00693c', '#338763', '#66a58a', '#99c3b1', '#cce1d8', '#e7f7ee'],
  'verde secundario': ['#2a4c10', '#549820', '#69be28', '#87cb53', '#a5d87e', '#c3e5a9', '#d4ecc1', '#eef7e6'],
  gris: ['#1e1e1e', '#3f3f3f', '#5d5d5d', '#717171', '#9a9a9a', '#949494', '#c4c4c4', '#d9d9d9', '#e9e9e9', '#f5f5f5'],
  estado: ['#c40000', '#ffe8e8', '#0f804f'],
  // Familia "*Graph" del GDS: cinco acentos de dato, rampa oficial 80/70/40/20.
  morado: ['#80379b', '#a069b4', '#bf9bcd', '#dfcde6'],
  rosa: ['#ea5084', '#ef7ca2', '#f4a7c1', '#fad3e0'],
  turquesa: ['#00a6a0', '#40bcb8', '#80d2cf', '#bfe9e7'],
  naranja: ['#e87300', '#ee9740', '#f4b880', '#f9dcbf'],
  'azul rey': ['#0f4dbc', '#4b79cd', '#87a7dd', '#c3d2ee'],
}

/** Neutros cálidos del proyecto: la única familia que no viene del GDS. */
const NEUTROS_CALIDOS = ['#fffdf8', '#faf7f0', '#f3efe5', '#ebe6d9', '#ddd7c8', '#c4bcab']

const APROBADOS = new Set([...Object.values(PALETA_PRODUBANCO).flat(), ...NEUTROS_CALIDOS])

const HEX = /#[0-9a-fA-F]{3,8}\b/g
// rgb()/hsl() cuyo primer argumento es un número o un hex: color escrito a mano.
// `rgba($token, .5)` está permitido: opacidad sobre un color ya aprobado.
const FUNCION_COLOR = /\b(?:rgba?|hsla?)\(\s*[#\d]/g
const FAMILIA_TIPOGRAFICA = /font-family\s*:/g

function* archivos(dir) {
  for (const entrada of readdirSync(dir)) {
    const ruta = join(dir, entrada)
    if (statSync(ruta).isDirectory()) yield* archivos(ruta)
    else if (EXTENSIONES.some((e) => entrada.endsWith(e))) yield ruta
  }
}

function coincidencias(texto, patron) {
  const lineas = texto.split('\n')
  const halladas = []
  lineas.forEach((linea, i) => {
    if (linea.trimStart().startsWith('//') || linea.trimStart().startsWith('///')) return
    for (const m of linea.matchAll(patron)) halladas.push({ linea: i + 1, texto: m[0], contenido: linea.trim() })
  })
  return halladas
}

const errores = []

for (const ruta of archivos(SRC)) {
  const texto = readFileSync(ruta, 'utf8')
  const rel = relative(RAIZ, ruta)

  if (ruta === TEMA) {
    for (const { linea, texto: hex, contenido } of coincidencias(texto, HEX)) {
      if (!APROBADOS.has(hex.toLowerCase())) {
        errores.push(`${rel}:${linea}  ${hex} no pertenece a la paleta Produbanco ni a los neutros cálidos\n      ${contenido}`)
      }
    }
    continue
  }

  for (const { linea, texto: hex, contenido } of coincidencias(texto, HEX)) {
    errores.push(`${rel}:${linea}  color literal ${hex} fuera del tema; usa un token de Carbon\n      ${contenido}`)
  }
  for (const { linea, contenido } of coincidencias(texto, FUNCION_COLOR)) {
    errores.push(`${rel}:${linea}  color literal rgb()/hsl() fuera del tema; usa un token de Carbon\n      ${contenido}`)
  }
  for (const { linea, contenido } of coincidencias(texto, FAMILIA_TIPOGRAFICA)) {
    errores.push(`${rel}:${linea}  font-family a mano; usa type.type-style()\n      ${contenido}`)
  }
}

if (errores.length > 0) {
  console.error(`\n✗ Marca Produbanco: ${errores.length} infracción(es)\n`)
  for (const e of errores) console.error(`   ${e}\n`)
  console.error('  La paleta vive solo en src/app/styles/_warm-light-theme.scss.')
  console.error('  Ver .claude/skills/carbon-warm-ui/SKILL.md\n')
  process.exit(1)
}

const total = Object.values(PALETA_PRODUBANCO).flat().length
console.log(`✓ Marca Produbanco: paleta intacta (${total} tonos GDS + ${NEUTROS_CALIDOS.length} neutros cálidos)`)
