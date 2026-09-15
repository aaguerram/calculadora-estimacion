#!/usr/bin/env node
//
// Carga los datasets publicos de datasets/raw/ en el esquema `benchmark`.
//
//   npm run benchmark:cargar
//
// Idempotente: borra la fuente antes de recargarla (cascade limpia sus filas).
//
import { createHmac } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')
const env = readFileSync(join(RAIZ, '.env'), 'utf8')
const leerEnv = (k) => {
  const l = env.split('\n').find((x) => x.startsWith(`${k}=`))
  return l ? l.slice(k.length + 1).trim() : undefined
}

const BASE = leerEnv('VITE_POSTGREST_URL_ABSOLUTA') ?? 'http://localhost:3000'
const secreto = leerEnv('PGRST_JWT_SECRET')
if (!secreto) {
  console.error('Falta PGRST_JWT_SECRET en .env')
  process.exit(1)
}

// Cargar datos de referencia exige `calibrador`.
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url')
const ahora = Math.floor(Date.now() / 1000)
const h = b64({ alg: 'HS256', typ: 'JWT' })
const p = b64({ role: 'calibrador', sub: 'benchmark-loader', org: 'default', iat: ahora, exp: ahora + 1800 })
const TOKEN = `${h}.${p}.${createHmac('sha256', secreto).update(`${h}.${p}`).digest('base64url')}`

async function api(ruta, init = {}) {
  const res = await fetch(`${BASE}${ruta}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
      // Con PGRST_DB_SCHEMAS=estimacion,benchmark el primero es el que manda;
      // estas cabeceras seleccionan explicitamente el esquema de referencia.
      'Accept-Profile': 'benchmark',
      'Content-Profile': 'benchmark',
      ...(init.headers ?? {}),
    },
  })
  if (!res.ok) throw new Error(`${init.method ?? 'GET'} ${ruta} -> ${res.status} ${(await res.text()).slice(0, 300)}`)
  const t = await res.text()
  return t.length === 0 ? null : JSON.parse(t)
}

// ----------------------------------------------------------------- parsers
const ruta = (f) => join(RAIZ, 'datasets', 'raw', f)
const leer = (f) => readFileSync(ruta(f), 'latin1')

/** Numero o null; '?' y '' son ausentes en ARFF. */
const num = (v) => {
  if (v === undefined || v === null) return null
  const s = String(v).trim().replace(/^'|'$/g, '')
  if (s === '' || s === '?' || s.toUpperCase() === 'NA') return null
  const n = Number(s.replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

function parseArff(archivo) {
  const atributos = []
  const filas = []
  let enDatos = false
  for (const bruta of leer(archivo).split('\n')) {
    const l = bruta.trim()
    if (!l || l.startsWith('%')) continue
    if (/^@attribute/i.test(l)) atributos.push(l.split(/\s+/)[1].replace(/^'|'$/g, ''))
    else if (/^@data/i.test(l)) enDatos = true
    else if (enDatos) filas.push(l.split(',').map((c) => c.trim().replace(/^'|'$/g, '')))
  }
  return filas.map((f) => Object.fromEntries(atributos.map((a, i) => [a, f[i]])))
}

function parseCsv(archivo, sep = ',') {
  const lineas = leer(archivo).split('\n').filter((l) => l.trim())
  const cab = lineas[0].split(sep).map((c) => c.trim().replace(/^"|"$/g, ''))
  return lineas.slice(1).map((l) => {
    // Respeta comillas: los resumenes de SiP llevan comas dentro.
    const celdas = []
    let actual = ''
    let entreComillas = false
    for (const ch of l) {
      if (ch === '"') entreComillas = !entreComillas
      else if (ch === sep && !entreComillas) { celdas.push(actual); actual = '' }
      else actual += ch
    }
    celdas.push(actual)
    return Object.fromEntries(cab.map((c, i) => [c, (celdas[i] ?? '').trim()]))
  })
}

/** Meses-hombre -> horas. 152 h/mes es la convencion de COCOMO. */
const HORAS_POR_MES_COCOMO = 152
const deMesesHombre = (mm) => (mm === null ? null : mm * HORAS_POR_MES_COCOMO)

// --------------------------------------------------------------- catalogo
const FUENTES = [
  {
    clave: 'china', nombre: 'China', nivel: 'proyecto', unidad_esfuerzo: 'horas',
    anio: 2010, multiempresa: true,
    origen_url: 'https://github.com/Derek-Jones/Software-estimation-datasets/blob/master/china.arff',
    descripcion: '499 proyectos con la descomposición IFPUG completa: entradas, salidas, consultas, ficheros e interfaces, con esfuerzo, duración y tamaño de equipo.',
    cargar: () => parseArff('china.arff').map((r) => ({
      ref_externa: r.ID,
      esfuerzo_horas: num(r.Effort),
      duracion_meses: num(r.Duration),
      equipo_personas: num(r.Resource),
      puntos_funcion: num(r.AFP),
      entradas: num(r.Input), salidas: num(r.Output), consultas: num(r.Enquiry),
      ficheros: num(r.File), interfaces: num(r.Interface),
      tipo_desarrollo: r['Dev.Type'],
      atributos: { added: num(r.Added), changed: num(r.Changed), deleted: num(r.Deleted), pdr_ufp: num(r.PDR_UFP) },
    })),
  },
  {
    clave: 'albrecht', nombre: 'Albrecht & Gaffney', nivel: 'proyecto', unidad_esfuerzo: 'horas',
    anio: 1983, multiempresa: false,
    origen_url: 'https://github.com/Derek-Jones/Software-estimation-datasets/blob/master/albrecht.arff',
    descripcion: 'Los 24 proyectos IBM con los que nació el método de puntos función. Esfuerzo original en miles de horas-persona.',
    cargar: () => parseArff('albrecht.arff').map((r, i) => ({
      ref_externa: `A${i + 1}`,
      esfuerzo_horas: num(r.Effort) === null ? null : num(r.Effort) * 1000,
      puntos_funcion: num(r.AdjFP),
      entradas: num(r.Input), salidas: num(r.Output), consultas: num(r.Inquiry), ficheros: num(r.File),
      atributos: { fp_adj: num(r.FPAdj), raw_fp: num(r.RawFPcounts), unidad_original: 'miles de horas' },
    })),
  },
  {
    clave: 'desharnais', nombre: 'Desharnais', nivel: 'proyecto', unidad_esfuerzo: 'horas',
    anio: 1989, multiempresa: false,
    origen_url: 'https://github.com/Derek-Jones/Software-estimation-datasets/blob/master/Desharnais.csv',
    descripcion: '81 proyectos de UNA sola consultora canadiense. Es la referencia de cuánto mejora la predicción dentro de una misma organización.',
    cargar: () => parseCsv('Desharnais.csv').map((r) => ({
      ref_externa: r.Project,
      esfuerzo_horas: num(r.Effort),
      duracion_meses: num(r.Length),
      puntos_funcion: num(r.PointsAjust),
      entradas: num(r.Transactions),
      ficheros: num(r.Entities),
      lenguaje: r.Language ? `lenguaje-${r.Language}` : null,
      atributos: { team_exp: num(r.TeamExp), manager_exp: num(r.ManagerExp), year_end: num(r.YearEnd), points_no_ajust: num(r.PointsNonAdjust) },
    })),
  },
  {
    clave: 'kitchenham', nombre: 'Kitchenham', nivel: 'proyecto', unidad_esfuerzo: 'horas',
    anio: 2002, multiempresa: false,
    origen_url: 'https://github.com/Derek-Jones/Software-estimation-datasets/blob/master/kitchenham.arff',
    descripcion: '145 proyectos de una consultora, con la primera estimación registrada y el método con que se hizo. Permite ver el error real de estimación.',
    cargar: () => parseArff('kitchenham.arff').map((r) => ({
      ref_externa: r.Project,
      esfuerzo_horas: num(r['Actual.effort']),
      duracion_meses: num(r['Actual.duration']) === null ? null : num(r['Actual.duration']) / 30,
      puntos_funcion: num(r['Adjusted.function.points']),
      tipo_desarrollo: r['Project.type'],
      atributos: {
        cliente: r['Client.code'],
        primera_estimacion: num(r['First.estimate']),
        metodo_primera_estimacion: r['First.estimate.method'],
        duracion_dias: num(r['Actual.duration']),
      },
    })),
  },
  {
    clave: 'miyazaki94', nombre: 'Miyazaki', nivel: 'proyecto', unidad_esfuerzo: 'horas',
    anio: 1994, multiempresa: true,
    origen_url: 'https://github.com/Derek-Jones/Software-estimation-datasets/blob/master/miyazaki94.arff',
    descripcion: '48 proyectos COBOL japoneses contando PANTALLAS y FORMULARIOS por separado. Es el único dataset público que mide directamente lo que aquí se llama «pantalla».',
    cargar: () => parseArff('miyazaki94.arff').map((r) => ({
      ref_externa: r.ID,
      esfuerzo_horas: deMesesHombre(num(r.MM)),
      atributos: {
        kloc: num(r.KLOC),
        pantallas: num(r.SCRN), formularios: num(r.FORM), ficheros: num(r.FILE),
        elementos_pantalla: num(r.ESCRN), elementos_formulario: num(r.EFORM), elementos_fichero: num(r.EFILE),
        meses_hombre: num(r.MM), factor_conversion: HORAS_POR_MES_COCOMO,
      },
    })),
  },
  {
    clave: 'maxwell', nombre: 'Maxwell', nivel: 'proyecto', unidad_esfuerzo: 'horas',
    anio: 2002, multiempresa: true,
    origen_url: 'https://github.com/Derek-Jones/Software-estimation-datasets/blob/master/maxwell.arff',
    descripcion: '62 proyectos de banca finlandesa con 15 factores de productividad.',
    cargar: () => parseArff('maxwell.arff').map((r, i) => ({
      ref_externa: `M${i + 1}`,
      esfuerzo_horas: num(r.Effort),
      duracion_meses: num(r.Duration),
      puntos_funcion: num(r.Size),
      sector: 'banca',
      atributos: Object.fromEntries(Object.entries(r).filter(([k]) => /^T\d+$|^App$|^Har$|^Source$|^Nlan$/.test(k))),
    })),
  },
  {
    clave: 'nasa93', nombre: 'NASA 93', nivel: 'proyecto', unidad_esfuerzo: 'horas',
    anio: 1993, multiempresa: false,
    origen_url: 'https://github.com/Derek-Jones/Software-estimation-datasets/blob/master/nasa93.arff',
    descripcion: '93 proyectos NASA con los 15 cost drivers de COCOMO. Esfuerzo original en meses-hombre.',
    cargar: () => parseArff('nasa93.arff').map((r) => ({
      ref_externa: r.recordnumber,
      esfuerzo_horas: deMesesHombre(num(r.act_effort)),
      sector: r.center ? `centro-${r.center}` : null,
      tipo_desarrollo: r.mode,
      atributos: { kloc: num(r.equivphyskloc), proyecto: r.projectname, anio: num(r.year), modo: r.mode, meses_hombre: num(r.act_effort), factor_conversion: HORAS_POR_MES_COCOMO },
    })),
  },
  {
    clave: 'cocomo81', nombre: 'COCOMO 81', nivel: 'proyecto', unidad_esfuerzo: 'horas',
    anio: 1981, multiempresa: true,
    origen_url: 'https://github.com/Derek-Jones/Software-estimation-datasets/blob/master/COCOMO-81.csv',
    descripcion: 'Los 63 proyectos originales de Boehm. Esfuerzo en meses-hombre.',
    cargar: () => parseCsv('COCOMO-81.csv').map((r) => ({
      ref_externa: r.num,
      esfuerzo_horas: deMesesHombre(num(r.actual)),
      tipo_desarrollo: r.dev_mode,
      atributos: { kloc: num(r.loc), meses_hombre: num(r.actual), factor_conversion: HORAS_POR_MES_COCOMO },
    })),
  },
  {
    clave: 'ucp', nombre: 'Use Case Points', nivel: 'proyecto', unidad_esfuerzo: 'horas',
    anio: 2017, multiempresa: true,
    origen_url: 'https://github.com/Derek-Jones/Software-estimation-datasets/blob/master/UCP_Dataset.csv',
    descripcion: '70 proyectos medidos con Use Case Points, con sector, lenguaje y esfuerzo real.',
    cargar: () => parseCsv('UCP_Dataset.csv', ';').map((r) => ({
      ref_externa: r.Project_No,
      esfuerzo_horas: num(r.Real_Effort_Person_Hours),
      lenguaje: r.Language || null,
      sector: r.Sector || null,
      tipo_desarrollo: r.ApplicationType || null,
      atributos: { uaw: num(r.UAW), uucw: num(r.UUCW), tcf: num(r.TCF), ecf: num(r.ECF), metodologia: r.Methodology },
    })),
  },
]

const FUENTES_TAREA = [
  {
    clave: 'sip', nombre: 'SiP (empresa comercial)', nivel: 'tarea', unidad_esfuerzo: 'horas',
    anio: 2019, multiempresa: false,
    origen_url: 'https://github.com/Derek-Jones/SiP_dataset',
    descripcion: '12 299 tareas reales de una empresa de software durante 6 años, con horas estimadas y horas reales. Es la referencia de cuánto acierta de verdad una organización estimando a nivel de tarea.',
    cargar: () => parseCsv('Sip-task-info.csv').map((r) => ({
      ref_externa: r.TaskNumber,
      resumen: (r.Summary || '').slice(0, 500),
      categoria: r.Category || null,
      subcategoria: r.SubCategory || null,
      horas_estimadas: num(r.HoursEstimate),
      horas_reales: num(r.HoursActual),
      atributos: { proyecto: r.ProjectCode, prioridad: num(r.Priority), estado: r.StatusCode },
    })),
  },
  {
    clave: 'project22', nombre: 'Project-22 (ágil)', nivel: 'historia', unidad_esfuerzo: 'horas',
    anio: 2021, multiempresa: false,
    origen_url: 'https://github.com/Derek-Jones/Software-estimation-datasets/tree/master/Project-22',
    descripcion: '626 historias de usuario con story points y tiempo dedicado por desarrollador.',
    cargar: () => parseCsv('story-info.csv').map((r, i) => ({
      ref_externa: `S${i + 1}`,
      puntos_historia: num(r.StoryPoints),
      // D1..D3 son dias-persona por desarrollador; Total es la suma.
      horas_reales: num(r.Total) === null ? null : num(r.Total) * 8,
      categoria: r.Phase || null,
      atributos: { branch: r.Branch, dias_total: num(r.Total), es_programacion: r['Is.Programming'] },
    })),
  },
]

// -------------------------------------------------------------------- carga
async function enLotes(ruta, filas, tam = 500) {
  for (let i = 0; i < filas.length; i += tam) {
    await api(ruta, { method: 'POST', body: JSON.stringify(filas.slice(i, i + tam)) })
  }
}

let totalProyectos = 0
let totalTareas = 0

for (const f of [...FUENTES, ...FUENTES_TAREA]) {
  const filas = f.cargar().filter((r) => r.esfuerzo_horas !== null || r.puntos_historia !== null)
  await api(`/fuente?clave=eq.${f.clave}`, { method: 'DELETE' })
  await api('/fuente', {
    method: 'POST',
    body: JSON.stringify({
      clave: f.clave, nombre: f.nombre, descripcion: f.descripcion, nivel: f.nivel,
      unidad_esfuerzo: f.unidad_esfuerzo, n_registros: filas.length, anio: f.anio,
      origen_url: f.origen_url, multiempresa: f.multiempresa,
    }),
  })

  const destino = f.nivel === 'proyecto' ? '/proyecto_externo' : '/tarea_externa'
  await enLotes(destino, filas.map((r) => ({ ...r, fuente: f.clave })))

  if (f.nivel === 'proyecto') totalProyectos += filas.length
  else totalTareas += filas.length
  console.log(`  ${f.clave.padEnd(12)} ${String(filas.length).padStart(6)} registros  (${f.nivel})`)
}

console.log(`\n${totalProyectos} proyectos y ${totalTareas} tareas/historias cargados en el esquema benchmark.`)
