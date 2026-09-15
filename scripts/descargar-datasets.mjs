#!/usr/bin/env node
//
// Descarga los datasets publicos de estimacion a datasets/raw/.
//
//   npm run benchmark:descargar
//
// NO se versionan en este repositorio: son datos de investigacion de terceros
// SIN licencia de redistribucion declarada. Se usan citando a sus autores, y
// cada quien los obtiene de su origen. Ver datasets/PROCEDENCIA.md.
//
import { mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')
const DESTINO = join(RAIZ, 'datasets', 'raw')
const BASE = 'https://raw.githubusercontent.com/Derek-Jones/Software-estimation-datasets/master'

const FICHEROS = [
  ['china.arff', `${BASE}/china.arff`],
  ['albrecht.arff', `${BASE}/albrecht.arff`],
  ['Desharnais.csv', `${BASE}/Desharnais.csv`],
  ['kitchenham.arff', `${BASE}/kitchenham.arff`],
  ['maxwell.arff', `${BASE}/maxwell.arff`],
  ['nasa93.arff', `${BASE}/nasa93.arff`],
  ['finnish.arff', `${BASE}/finnish.arff`],
  ['miyazaki94.arff', `${BASE}/miyazaki94.arff`],
  ['COCOMO-81.csv', `${BASE}/COCOMO-81.csv`],
  ['UCP_Dataset.csv', `${BASE}/UCP_Dataset.csv`],
  ['Sip-task-info.csv', `${BASE}/SiP/Sip-task-info.csv`],
  ['story-info.csv', `${BASE}/Project-22/story-info.csv`],
]

mkdirSync(DESTINO, { recursive: true })

let bajados = 0
let yaEstaban = 0
for (const [nombre, url] of FICHEROS) {
  const ruta = join(DESTINO, nombre)
  if (existsSync(ruta) && !process.argv.includes('--forzar')) {
    yaEstaban++
    continue
  }
  const res = await fetch(url)
  if (!res.ok) {
    console.error(`  ✗ ${nombre}: ${res.status} ${url}`)
    continue
  }
  const datos = Buffer.from(await res.arrayBuffer())
  writeFileSync(ruta, datos)
  console.log(`  ${nombre.padEnd(22)} ${String(datos.length).padStart(8)} bytes`)
  bajados++
}

console.log(
  `\n${bajados} descargado(s), ${yaEstaban} ya estaban. Ahora: npm run benchmark:cargar`,
)
console.log('Origen y autoría de cada uno en datasets/PROCEDENCIA.md.')
