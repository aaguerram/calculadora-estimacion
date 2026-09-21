# Calculadora

Herramienta de estimación de esfuerzo de software: se carga el alcance de un
proyecto (componentes, features, integraciones y drivers) y devuelve una banda
P50/P80/P90, un plan de equipo y las alertas del modelo. Los coeficientes se
calibran contra proyectos cerrados, no se inventan.

React + TypeScript con **Feature-Sliced Design**, **IBM Carbon Design System**
sobre la paleta de marca de **Produbanco**, y **PostgREST** como API generada
directamente desde el esquema de Postgres — sin backend propio que mantener.

---

## Requisitos

### Software base

Todo el proyecto corre con la última versión estable de cada herramienta.
Estas son las versiones mínimas verificadas:

| Herramienta | Mínimo | Verificado con | Para qué |
|---|---|---|---|
| **Node.js** | 22 LTS | 24.21.0 | Ejecutar Vite, los tests y los scripts |
| **npm** | 10 | 11.19.0 | Gestión de dependencias |
| **Docker Engine** | 24 | 29.2.1 | Postgres + PostgREST + Swagger |
| **Docker Compose** | v2 | v5.0.2 | Orquestar el stack (`docker compose`, sin guion) |
| **Git** | 2.30 | — | Clonar el repositorio |

Docker es obligatorio **solo** para levantar la base de datos y la API. Si vas a
tocar únicamente la interfaz, basta con Node y npm.

```bash
node -v && npm -v && docker --version && docker compose version
```

### Stack del proyecto

Las versiones que instala `npm install` (todas la última estable a la fecha):

| Paquete | Versión | Rol |
|---|---|---|
| `react` · `react-dom` | 19.3.0 | Interfaz |
| `react-router` | 8.4.0 | Rutas (declaradas solo en `app/routing/`) |
| `@carbon/react` | 1.116.0 | Design system, tema claro cálido Produbanco |
| `typescript` | 7.0.2 | Tipado (compilador nativo, `tsc -b`) |
| `vite` · `@vitejs/plugin-react` | 8.3.0 · 6.1.1 | Dev server y build |
| `vitest` · `@vitest/coverage-v8` | 5.0.1 | Tests del código puro de `model/` |
| `oxlint` | 1.84.0 | Linter |
| `steiger` · `@feature-sliced/steiger-plugin` | 0.6.0 · 0.7.0 | Guarda la arquitectura FSD |
| `sass-embedded` | 1.104.1 | Compila los `*.module.scss` y el tema |
| `playwright` | 1.63.0 | Humo sobre la UI en un navegador real |
| `tsx` · `@types/node` | 4.23.15 · 26.6.2 | Scripts de mantenimiento |

Y las imágenes del stack en `docker-compose.yml`:

| Imagen | Versión |
|---|---|
| `postgres` | 16-alpine |
| `postgrest/postgrest` | v12.2.3 |
| `swaggerapi/swagger-ui` | v5.17.14 |

> **TypeScript 7** retiró la API JS heredada. Por eso la configuración de steiger
> vive en `steiger.config.js` y no en `.ts`: su cargador (cosmiconfig) llamaba a
> `typescript.findConfigFile`, que ya no existe.

### Puertos

El stack ocupa `5173` (React), `3000` (PostgREST), `8080` (Swagger) y `5432`
(Postgres). Si alguno está tomado, cámbialo en `.env` — todos son variables.

---

## Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/aaguerram/calculadora-estimacion.git
cd calculadora-estimacion
```

### 2. Crear el archivo de entorno

```bash
cp .env.example .env
```

`.env.example` está comentado línea por línea. Lo único que conviene revisar de
entrada son los puertos y, si vas a exponer el entorno, `PGRST_JWT_SECRET`
(mínimo 32 caracteres).

> `VITE_POSTGREST_TOKEN` lo genera un comando; no lo escribas a mano.

### 3. Instalar dependencias

```bash
npm install
```

### 4. Comprobar que la instalación quedó sana

```bash
npm run check
```

Encadena lint, validación FSD, guard de marca, typecheck y los 242 tests
unitarios. Debe terminar en verde antes de dar por buena la instalación — y
antes de entregar cualquier cambio.

---

## Ejecución

### Opción A — Todo en Docker (recomendada)

Levanta base de datos, API, Swagger y la interfaz de una sola vez:

```bash
npm run stack:up
```

`stack:up` ejecuta `token:env` antes de arrancar: genera un JWT de desarrollo, lo
escribe en `.env` como `VITE_POSTGREST_TOKEN` y arranca los contenedores. React
sale ya autenticado, no hay que pegar nada a mano.

| Servicio | URL |
|---|---|
| React | http://localhost:5173 |
| API (PostgREST) | http://localhost:3000 |
| Swagger UI | http://localhost:8080 |
| Postgres | localhost:5432 |

La base arranca **sin datos sintéticos**. Para explorar la interfaz con algo
dentro:

```bash
npm run seed         # alcance de muestra, idempotente
npm run benchmark    # datasets públicos reales (opcional, baja de internet)
```

Después, abre http://localhost:5173 y pulsa **Estimar** en un proyecto.

Para parar o reconstruir:

```bash
npm run stack:logs    # seguir los logs de todos los servicios
npm run stack:down    # parar
npm run stack:reset   # borrar el volumen y reconstruir (aplica cambios de db/init/)
```

### Opción B — Solo la interfaz

Sin Docker, contra una API que ya esté levantada en otro lado:

```bash
npm install
npm run dev
```

### Opción C — Contra el Postgres corporativo on-prem

1. El DBA ejecuta `db/init/*.sql` una sola vez contra esa base.
2. Pon `PGRST_DB_URI` en `.env` con el usuario `authenticator` y su clave de bóveda.
3. Levanta sin Postgres local:

```bash
docker compose -f docker-compose.yml -f docker-compose.onprem.yml up -d
```

PostgREST apunta directo al servidor corporativo; no se arranca ninguna base local.

### Build de producción

```bash
npm run build     # typecheck + bundle en dist/
npm run preview   # sirve dist/ para revisarlo
```

> `VITE_POSTGREST_TOKEN` queda **horneado en el bundle** y es público para quien
> abra el inspector. Por eso `token-store.ts` lo ignora cuando
> `import.meta.env.DEV` es falso: en un build de producción el token no existe y
> lo aporta el OIDC corporativo en tiempo de ejecución.

### Si algo no conecta

```bash
npm run diagnostico
```

Revisa el token, PostgREST, el servidor web, el proxy y los permisos por tabla, y
dice qué comando arregla cada fallo.

La API se sirve **por el mismo origen** que la aplicación (`/api`), vía proxy de
Vite en desarrollo y de nginx en producción. Así funciona se abra desde donde se
abra —`localhost`, `127.0.0.1`, la IP de la máquina u otro equipo de la red— y no
hay CORS de por medio.

---

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Typecheck + build de producción |
| `npm run preview` | Sirve el build de `dist/` |
| `npm run lint` | oxlint |
| `npm run lint:fsd` | steiger — valida que la arquitectura FSD se respete |
| `npm run lint:marca` | Verifica que la paleta Produbanco se respeta |
| `npm run check` | Los cinco anteriores + typecheck y tests, en orden |
| `npm run stack:up` | Levanta Postgres + PostgREST + Swagger + React |
| `npm run stack:down` | Para el stack |
| `npm run stack:reset` | Borra el volumen y reconstruye (aplica cambios de `db/init/`) |
| `npm run stack:logs` | Logs de todos los servicios |
| `npm run test` | vitest (242 tests sobre el motor y la estadística) |
| `npm run test:watch` | vitest en modo watch |
| `npm run token` | Imprime un JWT de desarrollo |
| `npm run token:env` | Lo escribe en `.env` como `VITE_POSTGREST_TOKEN` (30 días) |
| `npm run seed` | Carga el alcance de referencia en Postgres (idempotente) |
| `npm run benchmark:descargar` | Baja los datasets públicos desde su origen |
| `npm run benchmark:cargar` | Los carga en el esquema `benchmark` |
| `npm run benchmark` | Los dos anteriores |
| `npm run seed:all` | Alcance de referencia + datasets de benchmark |
| `npm run test:e2e` | Integración contra el stack real (exige `stack:up`) |
| `npm run ui:revisar` | Humo sobre la interfaz en un navegador real (`-- --sucio` simula un token viejo) |
| `npm run diagnostico` | Comprueba la conexión de fuera hacia dentro y dice qué arreglar |

## Flujo de uso

Con el stack levantado (ver [Ejecución](#ejecución)) abre
http://localhost:5173 y pulsa **Estimar** en un proyecto: aparece el ABM de su
alcance —componentes, features con sus pares, integraciones y drivers—. Cada
cambio se escribe en Postgres y la estimación se recalcula al instante.

La base arranca **sin datos sintéticos**: no hay proyectos de ejemplo ni
histórico inventado. `npm run seed` carga un alcance de muestra si quieres
explorar la UI, y se borra desde la propia pantalla de Proyectos.

## El ABM de alcance

El alcance se edita contra PostgREST, sin backend propio:

| Editor | Tabla | Qué controla del modelo |
|---|---|---|
| Componentes | `componente` | Horas base, factor de stack, arranque y **máx. devs** (el tope de paralelización) |
| Features | `feature` + `feature_componente` | Los **pares estimables**, con complejidad propia por componente |
| Integraciones | `integracion` | Recargos por contraparte externa (×1.4), falta de sandbox (×1.3) y reutilización |
| Drivers | `driver` | Los cinco deltas **aditivos** del factor de proyecto |

El contrato `Alcance` vive en `entities/project-scope` —no en el motor— porque lo
comparten quien lo persiste y quien lo calcula. Un solo `select` embebido de
PostgREST trae todo el alcance en una petición.

## Datos de referencia reales

12 datasets públicos de estimación (PROMISE, SiP, Desharnais, China…) que suman
**1 086 proyectos y 12 925 tareas** con esfuerzo real. No se versionan aquí —no
declaran licencia de redistribución—, se obtienen con un comando:

```bash
npm run benchmark   # los descarga y los carga en el esquema `benchmark`
```
 Procedencia y licencia en
[`datasets/PROCEDENCIA.md`](./datasets/PROCEDENCIA.md); qué dicen, en
[`datasets/HALLAZGOS.md`](./datasets/HALLAZGOS.md).

No fijan los coeficientes del modelo — acotan rangos y validan el método:

- La productividad va de **6.3 a 23.7 h/punto función** entre organizaciones.
- Acotar a una empresa **y** un stack baja el MMRE de 77 % a 28 %.
- Una empresa real acertó ±25 % en el **42 %** de sus 12 299 tareas.
- El 3GL cuesta **4.4×** lo que un lenguaje de generación superior, medido dentro
  de una misma empresa. De ahí sale `stack.cobol = 2.6`.

Se consultan por PostgREST con la cabecera `Accept-Profile: benchmark`.

## Ingresar un proyecto desde la web

`/ingresar` guía la carga completa en seis pasos — proyecto, componentes,
features, integraciones, drivers y revisión — y en cada paso explica qué aporta
al cálculo. Cada campo lleva un desplegable con **qué es** y **qué efecto tiene
sobre la estimación**, para que alguien que no conoce el modelo pueda cargar un
proyecto entero y entender por qué sale lo que sale.

Reutiliza los mismos editores que la pantalla de alcance: lo que añade es el
orden y la explicación.

## Taxonomía de features

Tres ejes para describir el alcance:

| Eje | Dónde vive | Qué responde |
|---|---|---|
| **Categoría** | `estimacion.categoria_feature` | Qué es: pantalla, reporte, batch, API, integración, evento, migración, motor de reglas, **componente 3GL**, transversal |
| **Naturaleza técnica** | `componente.tipo` | Dónde vive: front, BFF, micro de experiencia/negocio/core, monolito, **componente 3GL** |
| **Elementos** | `estimacion.elemento_feature` | De qué está hecha: formulario, listado, buscador, exportación… (selección múltiple) |

Los elementos siguen la descomposición **IFPUG (ISO/IEC 20926)** con sus pesos
oficiales en puntos función. Las horas salen de un solo coeficiente calibrable,
`pf.horas-por-punto` (5.2 h de desarrollo por punto), que es donde está toda la
varianza real.

### Los dos métodos de medida

Una feature se puede medir de dos formas, y **nunca se suman**:

| Método | Cómo | Cuándo manda |
|---|---|---|
| **Estructural** | `base(tipo) × complejidad × stack` por cada componente que toca | Cuando la feature no tiene elementos marcados |
| **Puntos función** | Los elementos del eje 3, pesados con IFPUG, × horas por punto | Cuando sí los tiene |

En el editor de alcance cada feature muestra su conversión (`26 PF → 135 h`) y la
cabecera el total, así que se ve el efecto de marcar un elemento antes de bajar
a la estimación.

El esfuerzo por puntos función se reparte entre los componentes en la proporción
que da el método estructural: así el motor conserva los streams y la ruta crítica.
Cada feature muestra las dos cifras y su divergencia — si no se parecen, o sobran
elementos marcados o la complejidad está mal puesta.

## Cargar el histórico

`/historico` permite cargar proyectos cerrados de tres formas: uno a uno con un
formulario, varios de golpe pegando JSON (con revisión previa fila por fila), o
archivando un proyecto que ya tengas en la herramienta.

Guía completa, con el formato exacto y de dónde sacar cada cifra:
[`docs/cargar-historico.md`](./docs/cargar-historico.md).

## Calibración con el histórico

Los coeficientes de arranque son suposiciones. Lo que los convierte en algo
defendible es medirlos contra proyectos cerrados:

1. **Cerrar un proyecto** guarda una foto inmutable de su alcance (jsonb) junto a
   sus meses-hombre, meses y personas reales.
2. **Backtest**: se re-estima cada proyecto cerrado con los coeficientes de hoy y
   se compara con lo que costó. Salen MMRE, MdMRE, PRED(25) y sesgo, con los
   umbrales de la literatura (MMRE < 25 %, PRED(25) > 75 %, |sesgo| < 10 %).
3. **Propuesta**: factor global por media geométrica de los ratios, factores por
   tipo de componente con encogimiento hacia el global, y σ del riesgo común
   medido sobre los residuos.
4. **Refinamiento**: los ajustes interactúan (subir horas base sube el esfuerzo,
   pero estrechar σ baja el percentil comprometido), así que la propuesta se
   itera hasta anular el sesgo residual.
5. **Aplicar**: solo si el MMRE baja sobre el propio histórico y hay ≥ 3
   proyectos. Escribir coeficientes exige el rol `calibrador`.

El backtest re-estima con el **catálogo de elementos**, así que las features que
se archivaron con sus elementos marcados se vuelven a medir por puntos función,
igual que en su día. Y `pf.horas-por-punto` entra en la propuesta — pero solo si
al menos el 20 % del histórico usa puntos función: mover un coeficiente que el
dato no ejercita sería inventar. La pantalla muestra esa cobertura.

El test de integración lo verifica de punta a punta con un histórico de prueba
que crea y borra él mismo (sesgo sembrado ×1.22):

```
MMRE      17.8 %  ->  3.6 %
sesgo    -17.8 %  ->  -0.3 %
factor global recuperado: ×1.219     convergió en 2 rondas
```

## El motor de estimación

Vive en `src/features/run-estimation/model/` y es **puro y determinista**: misma
entrada y misma semilla producen exactamente la misma estimación, que es lo que
permite auditarla y testearla sin montar React.

```
calcular-esfuerzo.ts    pares (feature × componente), arranques e integraciones
simular-riesgo.ts       Monte Carlo con riesgo común → banda P50/P80/P90
planificar-equipo.ts    streams por componente, ruta crítica y frontera
detectar-alertas.ts     contraste COCOMO II + detectores de estimación enferma
run-estimation.ts       orquestador
```

Los coeficientes salen de `estimacion.modelo_coeficiente` (Postgres) y caen en
las semillas de `entities/estimation-model` si la base no responde.

Detalle del modelo y su validación: [`docs/modelo-estimacion.md`](./docs/modelo-estimacion.md).

## Datos: PostgREST, sin backend propio

PostgREST genera la API REST leyendo el esquema `estimacion`. No hay código de
servidor que mantener: **el esquema es la API**.

Por eso **toda la seguridad vive en Postgres**:

| Rol | Sin/con token | Puede |
|---|---|---|
| `web_anon` | sin token | leer `modelo_coeficiente` |
| `estimador` | con token | CRUD de proyectos de su organización (RLS) |
| `calibrador` | con token | escribir coeficientes e histórico |

`owner_id` y `org_id` los pone un trigger desde los claims del JWT: el cliente no
los puede falsear. Ningún credencial de base de datos llega al navegador.

```
db/init/01-roles.sh      roles de PostgREST
db/init/02-schema.sql    tablas, vistas, triggers  -> define la API
db/init/03-seguridad.sql RLS, policies y grants    -> define quién ve qué
db/init/04-seed.sql      coeficientes del modelo de estimación
```

## Navegación

| Ruta | Sección |
|---|---|
| `/` | Proyectos — elegir o crear el que se va a estimar |
| `/ingresar` | Alta guiada: todo un proyecto desde la web, paso a paso |
| `/proyecto/:id` | Alcance (los tres ejes), estimación y cierre |
| `/historico` | Cargar y revisar los proyectos cerrados que calibran |
| `/calibracion` | Calibración con el histórico |
| `/fuentes` | Las 11 fuentes de datos de referencia |

## Estructura

```
src/
├── app/                        Inicialización (no tiene ui/)
│   ├── styles/
│   │   ├── _warm-light-theme.scss   ← ÚNICO archivo con colores literales
│   │   └── index.scss               ← ÚNICO archivo que emite tema y estilos globales
│   ├── theme/ThemeProvider.tsx
│   └── App.tsx                      Composition root
│
├── pages/home/                 Pantalla: ensambla widgets
│   └── ui/HomePage.tsx
│
├── widgets/greeting-card/      Bloque autónomo: feature + entity
│   └── ui/GreetingCard.tsx
│
├── features/greet-visitor/     Acción del usuario (patrón MVI)
│   ├── model/greet-visitor.reducer.ts   State + Intent + reducer puro
│   ├── model/use-greet-visitor.ts       único useReducer
│   └── ui/GreetVisitorForm.tsx          sólo renderiza y despacha
│
├── entities/greeting/          Concepto de negocio
│   ├── model/types.ts
│   ├── lib/format-greeting.ts           regla pura
│   └── ui/GreetingText.tsx              presentacional
│
└── shared/                     Sin conocimiento del dominio
    ├── config/  lib/  ui/
```

**Regla de dependencia:** `app → pages → widgets → features → entities → shared`.
Nunca al revés, y nunca entre slices de la misma capa.

El demo "hola mundo" existe para mostrar el recorrido completo por las cinco capas.
Es el patrón a copiar al añadir funcionalidad real.

## Reglas para agentes de IA y para el equipo

- [`CLAUDE.md`](./CLAUDE.md) — reglas vinculantes (también accesible como `AGENTS.md`).
- [`.claude/skills/fsd-architecture/SKILL.md`](./.claude/skills/fsd-architecture/SKILL.md)
  — dónde va cada archivo, qué puede importar cada capa, patrón MVI.
- [`.claude/skills/carbon-warm-ui/SKILL.md`](./.claude/skills/carbon-warm-ui/SKILL.md)
  — componentes, tokens, paleta cálida, tipografía y accesibilidad.

## Tema Warm Light — paleta Produbanco

Parte del tema `white` de Carbon y sobrescribe tokens semánticos con la paleta de
marca de Produbanco sobre neutros cálidos hueso/arena:

| Rol | Hex |
|---|---|
| Verde primario (marca) | `#00693c` — hover `#003f24`, activo `#002a18` |
| Verde secundario (lima, solo acento) | `#69be28` |
| Texto / iconos | `#1e1e1e`, `#5d5d5d`, `#717171` |
| Error · éxito · aviso · info | `#c40000` · `#0f804f` · `#e87300` · `#0f4dbc` |
| Neutros cálidos (fondo, tarjeta, borde) | `#faf7f0`, `#f3efe5`, `#fffdf8`, `#ddd7c8` |

Todos los literales viven en un solo archivo,
`src/app/styles/_warm-light-theme.scss`. Los componentes **nunca** escriben
colores: consumen `$text-primary`, `$layer-01`, `$button-primary`,
`$spacing-06`, `type-style('body-01')`, etc. La tipografía sigue siendo IBM Plex
Sans: la marca entra por el color, no por la fuente.

`npm run lint:marca` lo verifica en cada `npm run check`. Si falla, la solución es
cambiar el color — nunca relajar la regla.
