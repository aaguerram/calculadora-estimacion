# Calculadora

Esqueleto React + TypeScript con **Feature-Sliced Design** e **IBM Carbon Design System**
(tema claro cálido "Warm Light").

## Arranque

### Todo en docker (recomendado)

```bash
cp .env.example .env          # ajusta puertos si alguno está ocupado
npm run stack:up              # genera el token, lo pone en .env y levanta todo
```

`stack:up` ejecuta `token:env` antes de arrancar, así que React ya sale
autenticado: no hay que pegar nada a mano.

> `VITE_POSTGREST_TOKEN` queda **horneado en el bundle** y es público para quien
> abra el inspector. Por eso `token-store.ts` lo ignora cuando
> `import.meta.env.DEV` es falso: en un build de producción el token no existe y
> lo aporta el OIDC corporativo en tiempo de ejecución.

| Servicio | URL |
|---|---|
| React | http://localhost:5173 |
| API (PostgREST) | http://localhost:3000 |
| Swagger UI | http://localhost:8080 |
| Postgres | localhost:5432 |

### Solo el front

```bash
npm install
npm run dev
```

### Contra el Postgres corporativo on-prem

1. Ejecuta `db/init/*.sql` una sola vez contra esa base (lo aplica el DBA).
2. Pon `PGRST_DB_URI` en `.env` con el usuario `authenticator` y su clave de bóveda.
3. `docker compose -f docker-compose.yml -f docker-compose.onprem.yml up -d`

No se levanta Postgres local: PostgREST apunta directo al servidor corporativo.

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Typecheck + build de producción |
| `npm run lint` | oxlint |
| `npm run lint:fsd` | steiger — valida que la arquitectura FSD se respete |
| `npm run check` | Los tres anteriores |
| `npm run stack:up` | Levanta Postgres + PostgREST + Swagger + React |
| `npm run stack:reset` | Borra el volumen y reconstruye (aplica cambios de `db/init/`) |
| `npm run stack:logs` | Logs de todos los servicios |
| `npm run test` | vitest (88 tests sobre el motor y la estadística) |
| `npm run token` | Imprime un JWT de desarrollo |
| `npm run token:env` | Lo escribe en `.env` como `VITE_POSTGREST_TOKEN` |
| `npm run seed` | Carga el alcance de referencia en Postgres (idempotente) |
| `npm run seed:historico` | Siembra 7 proyectos cerrados sintéticos para probar la calibración |
| `npm run benchmark:cargar` | Carga 1 086 proyectos y 12 925 tareas reales públicas |
| `npm run seed:all` | Los tres anteriores |
| `npm run test:e2e` | Integración contra el stack real (exige `stack:up`) |
| `npm run ui:revisar` | Humo sobre la interfaz en un navegador real (`-- --sucio` simula un token viejo) |

## Flujo de uso

```bash
npm run stack:up     # levanta todo y precarga el token
npm run benchmark:cargar   # datos públicos reales (opcional)
```

La base arranca **sin datos sintéticos**: no hay proyectos de ejemplo ni histórico
inventado. `npm run seed` carga un alcance de muestra si quieres explorar la UI,
y se borra desde la propia pantalla de Proyectos.

Abre http://localhost:5173, pulsa **Estimar** en un proyecto y aparece el ABM de
su alcance: componentes, features con sus pares, integraciones y drivers. Cada
cambio se escribe en Postgres y la estimación se recalcula al instante.

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

`datasets/raw/` guarda 12 datasets públicos de estimación (PROMISE, SiP, Desharnais,
China…), cargados en el esquema `benchmark`: **1 086 proyectos y 12 925 tareas**
con esfuerzo real. Procedencia y licencia en
[`datasets/PROCEDENCIA.md`](./datasets/PROCEDENCIA.md); qué dicen, en
[`datasets/HALLAZGOS.md`](./datasets/HALLAZGOS.md).

No fijan los coeficientes del modelo — acotan rangos y validan el método:

- La productividad va de **6.3 a 23.7 h/punto función** entre organizaciones.
- Acotar a una empresa **y** un stack baja el MMRE de 77 % a 28 %.
- Una empresa real acertó ±25 % en el **42 %** de sus 12 299 tareas.
- El 3GL cuesta **4.4×** lo que un lenguaje de generación superior, medido dentro
  de una misma empresa. De ahí sale `stack.cobol = 2.6`.

Se consultan por PostgREST con la cabecera `Accept-Profile: benchmark`.

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
| `/proyecto/:id` | Alcance (los tres ejes), estimación y cierre |
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

## Tema Warm Light

Parte del tema `white` de Carbon y sobrescribe tokens semánticos:
crema `#fcf7f1` de fondo, superficies arena `#f6ede3`, texto cacao `#2c211b`
y acento terracota `#a8480f`. Los botones se ajustan vía *component tokens*.

Los componentes **nunca** escriben colores: consumen `$text-primary`, `$layer-01`,
`$button-primary`, `$spacing-06`, `type-style('body-01')`, etc.
