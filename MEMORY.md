# Memory — calculadora

> Generated: 2026-09-23 20:50:30  
> Total memories: **88**  
> Breakdown: instruction: 19, fact: 9, decision: 12, goal: 1, commitment: 1, preference: 1, context: 1, learning: 44

---

## Instructions

*Standing rules, constraints, and guidelines to always follow.*

### The 'calculadora' React project encodes its archit...

> The 'calculadora' React project encodes its architecture and design rules in CLAUDE.md (symlinked as AGENTS.md) plus two skills under .claude/skills/: fsd-architecture and carbon-warm-ui; read them before creating or moving any file in src/.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T03:05:43 | Tags: `fsd`, `carbon-design`, `project-rules`, `claude-md`*

### UI: IBM Carbon Design System con el tema claro cal...

> UI: IBM Carbon Design System con el tema claro calido del proyecto, cuya paleta es la de la marca Produbanco (ver la instruccion dedicada a la paleta). Ningun color, tamano ni tipografia se escribe a mano: todo sale de tokens. El tema vive solo en app/styles/_warm-light-theme.scss. Prohibido instalar MUI, Bootstrap, Tailwind o Chakra.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T10:31:46 | Tags: `carbon`, `ui`, `tema`, `tokens`, `produbanco`*

### Frontend React projects must follow Feature-Sliced...

> Frontend React projects must follow Feature-Sliced Design (FSD) with the layer order app > pages > widgets > features > entities > shared; a layer may only import from layers strictly below it and slices within the same layer must never import each other.

*Confidence: 1.0 | Status: expired | Created: 2026-09-15T02:53:14 | Tags: `fsd`, `react`, `architecture`, `layering`*

### Arquitectura: Feature-Sliced Design con el orden a...

> Arquitectura: Feature-Sliced Design con el orden app > pages > widgets > features > entities > shared. Una capa solo importa de capas estrictamente inferiores y dos slices de la misma capa nunca se importan entre si. Todo import cruza por el index.ts del slice. Se valida con steiger en 'npm run lint:fsd'.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T10:31:46 | Tags: `fsd`, `arquitectura`, `steiger`, `capas`*

### Cross-imports entre entities solo por la notacion ...

> Cross-imports entre entities solo por la notacion @x de FSD, con un archivo por consumidor (entities/a/@x/b.ts) y solo para tipos y vocabulario. Si hacen falta tres o mas entre las mismas dos entities, eran una sola. Alternativa preferida: bajar el contrato compartido a la entity que de verdad lo posee.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T10:31:46 | Tags: `fsd`, `cross-import`, `arroba-x`, `entities`*

### La paleta visual del proyecto calculadora es la de...

> La paleta visual del proyecto calculadora es la de la marca Produbanco (GDS): verde primario #00693c (hover #003f24, activo #002a18), verde secundario lima #69be28 solo como acento y nunca como texto, grises de marca #1e1e1e/#5d5d5d/#717171 para texto e iconos, y estados #c40000 error, #0f804f exito, #e87300 aviso, #0f4dbc info. Los unicos colores que no son de marca son los neutros calidos hueso/arena (#fffdf8, #faf7f0, #f3efe5, #ebe6d9, #ddd7c8, #c4bcab) que dan al tema Carbon su caracter claro y calido. Ningun color se inventa: un tono intermedio se obtiene con color.mix() desde un color de marca. Toda la paleta vive solo en src/app/styles/_warm-light-theme.scss y se verifica con 'npm run lint:marca' dentro de 'npm run check'. La tipografia sigue siendo IBM Plex Sans de Carbon: la marca entra por el color, no por la fuente.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T16:25:27 | Tags: `produbanco`, `marca`, `paleta`, `carbon`, `tokens`*

### La base de la aplicacion queda SIEMPRE sin datos s...

> La base de la aplicacion queda SIEMPRE sin datos sinteticos: proyecto, componente, feature, feature_componente, feature_elemento, integracion, driver, estimacion_corrida y proyecto_historico a cero. Lo unico que persiste es configuracion (modelo_coeficiente, categoria_feature, elemento_feature) y el esquema benchmark con datasets publicos reales.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T13:05:50 | Tags: `datos`, `limpieza`, `sinteticos`*

### Business logic belongs in pure MVI reducers inside...

> Business logic belongs in pure MVI reducers inside a slice's model/ segment (State + Intent union + reducer function), with a single use-<slice>.ts hook bridging to React; UI components only render state and dispatch intents.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T03:05:43 | Tags: `mvi`, `reducer`, `react-state`, `fsd`*

### Pure model/ code in this project must have colocat...

> Pure model/ code in this project must have colocated vitest tests (calcular-esfuerzo.ts -> calcular-esfuerzo.test.ts); randomness enters through a seeded RNG so the estimation engine is deterministic and auditable.

*Confidence: 1.0 | Status: expired | Created: 2026-09-15T04:31:43 | Tags: `testing`, `vitest`, `fsd`, `determinismo`*

### Todo codigo puro de un segmento model/ lleva tests...

> Todo codigo puro de un segmento model/ lleva tests vitest junto al archivo. El azar entra por una semilla (crearRng) para que el motor sea determinista y auditable. Los *.e2e.test.ts exigen Docker y datos sembrados: van en 'npm run test:e2e', nunca en 'npm run check'.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T10:31:49 | Tags: `testing`, `vitest`, `determinismo`, `e2e`*

### La base del proyecto NO debe contener datos sintet...

> La base del proyecto NO debe contener datos sinteticos: los proyectos de ejemplo y el historico inventado se borraron porque el historico falso corrompe la calibracion. Los tests de integracion crean y borran sus propios datos, y benchmark queda porque son datasets publicos reales.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T11:24:35 | Tags: `datos`, `sinteticos`, `calibracion`, `limpieza`*

### Integration tests that need Docker and seeded data...

> Integration tests that need Docker and seeded data are named *.e2e.test.ts with their own vitest.e2e.config.ts and run via npm run test:e2e; the default npm run check excludes them so it never depends on a running stack.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T04:47:19 | Tags: `testing`, `vitest`, `e2e`, `docker`*

### Un parser de importacion debe ser puro y total: nu...

> Un parser de importacion debe ser puro y total: nunca lanzar, devolver lo cargable y el motivo de cada rechazo por fila y campo. Y el formulario de alta unitaria debe usar el MISMO parser que la importacion masiva, para que no existan dos definiciones de valido que puedan divergir.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T13:21:43 | Tags: `importacion`, `validacion`, `diseno`*

### Ante un fallo de conexion reportado por el usuario...

> Ante un fallo de conexion reportado por el usuario, ejecutar npm run diagnostico antes de tocar codigo: revisa token y caducidad, PostgREST directo, servidor web, proxy del mismo origen y permisos por tabla, y dice que comando arregla cada fallo.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T14:44:21 | Tags: `diagnostico`, `depuracion`, `conexion`*

### El repositorio calculadora-estimacion es publico e...

> El repositorio calculadora-estimacion es publico en GitHub (aaguerram/calculadora-estimacion): ningun dato interno de Produbanco -adjuntos de correo, volcados de Azure DevOps, titulos de work items- puede entrar al control de versiones; solo agregados anonimos. Desde 2026-09-15 las dos carpetas sensibles estan en el .gitignore VERSIONADO, no en .git/info/exclude: gmail/ (adjuntos de correo, volcados de Azure) y datasets/ entera. La leccion: .git/info/exclude es local y no viaja, asi que un clon nuevo no heredaba la regla y gmail/ quedaba desprotegida. Las unicas menciones a Produbanco admisibles en lo versionado son las de la paleta de marca (GDS publico) y notas metodologicas sin datos.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T21:26:21 | Tags: `git`, `seguridad`, `produbanco`, `repositorio-publico`, `datos-confidenciales`, `gitignore`*

### Probar la API con curl NO sustituye a probar la in...

> Probar la API con curl NO sustituye a probar la interfaz: los fallos que solo ocurren en el navegador (estado en localStorage, CORS, orden de carga) quedan invisibles. 'npm run ui:revisar' abre las rutas con Playwright y Firefox y reporta avisos de error, peticiones fallidas y errores de consola.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T11:41:29 | Tags: `testing`, `ui`, `playwright`, `navegador`*

### El error mas comun al cargar historico es medir mh...

> El error mas comun al cargar historico es medir mhReales solo del desarrollo: el modelo aplica un x1.65 de overheads por su cuenta, asi que si la cifra real ya viene sin analisis, QA y gestion, la calibracion bajara los coeficientes hasta dejarlos mal.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T13:21:43 | Tags: `historico`, `mh-reales`, `overheads`, `calibracion`*

### El MCP de Playwright registrado en ambito usuario ...

> El MCP de Playwright registrado en ambito usuario espera firefox-1544 y falla con 'Browser firefox is not installed'; el proyecto calculadora trae firefox-1543 en ~/.cache/ms-playwright. Para verificar la interfaz usar 'npm run ui:revisar' (scripts/revisar-ui.mjs, playwright local) en lugar del MCP, o un script propio importando playwright por ruta absoluta desde node_modules del proyecto.

*Confidence: 0.8 | Status: active | Created: 2026-09-15T16:32:01 | Tags: `playwright`, `mcp`, `firefox`, `ui`, `entorno`*

### Antes de publicar un repositorio hay que escanear ...

> Antes de publicar un repositorio hay que escanear el contenido versionado, no solo confiar en gitignore: buscar JWT, ghp_, github_pat_, claves privadas y AKIA, y comprobar el arbol del REMOTO despues del push. Y cuidado con encadenar grep a sed en la comprobacion: el || nunca dispara porque el estado de salida es el de sed.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T13:31:22 | Tags: `seguridad`, `publicacion`, `git`, `verificacion`*

---

## Facts

*Verified information, project status, and established truths.*

### El historico se carga desde la pantalla /historico...

> El historico se carga desde la pantalla /historico: formulario uno a uno, importacion masiva en JSON con revision previa fila por fila, o archivando un proyecto de la herramienta. La guia con el formato exacto esta en docs/cargar-historico.md.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T13:21:42 | Tags: `historico`, `carga`, `ui`, `guia`*

### El GDS de Produbanco publica una familia 'Graph' d...

> El GDS de Produbanco publica una familia 'Graph' de cinco acentos de dato y cada uno tiene rampa oficial de cuatro pasos 80/70/40/20: morado #80379b/#a069b4/#bf9bcd/#dfcde6, rosa #ea5084/#ef7ca2/#f4a7c1/#fad3e0, turquesa #00a6a0/#40bcb8/#80d2cf/#bfe9e7, naranja #e87300/#ee9740/#f4b880/#f9dcbf, azul rey #0f4dbc/#4b79cd/#87a7dd/#c3d2ee. Para un tono mas claro de una serie se coge el paso de la rampa, nunca se calcula. El aviso y la info del tema son el paso 80 de naranja y azul rey. La paleta se verifica bajando https://www.produbanco.com.ec/css/RichTextGDSColors.css y /assets/plugins/GDS/css/Main.min.css y agrupando los hex por clase CSS.

*Confidence: 0.8 | Status: active | Created: 2026-09-15T16:51:08 | Tags: `produbanco`, `graph`, `paleta`, `graficos`, `gds`*

### Hay un MCP de Playwright registrado en ambito usua...

> Hay un MCP de Playwright registrado en ambito usuario (~/.claude.json, 'playwright' con --browser firefox --isolated). Sirve para conducir la interfaz por snapshot de accesibilidad sin escribir scripts ad-hoc, que es como se encontro el fallo del token que curl no detectaba.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T11:52:22 | Tags: `mcp`, `playwright`, `herramientas`, `ui`*

### Local docker ports 3000, 8080 and 5432 are already...

> Local docker ports 3000, 8080 and 5432 are already taken on this machine; the calculadora stack runs PostgREST on 3001, Swagger UI on 8081 and Postgres on 5432 via the compose port variables in .env.

*Confidence: 0.9 | Status: expired | Created: 2026-09-15T04:12:18 | Tags: `docker`, `puertos`, `entorno-local`, `calculadora`*

### El repositorio publico del proyecto es https://git...

> El repositorio publico del proyecto es https://github.com/aaguerram/calculadora-estimacion, rama main. Se creo con gh repo create y git usa el helper de credenciales de gh (gh auth setup-git).

*Confidence: 1.0 | Status: active | Created: 2026-09-15T13:31:21 | Tags: `git`, `github`, `repositorio`*

### Los datos viven en dos sitios distintos: datasets/...

> Los datos viven en dos sitios distintos: datasets/raw mas el esquema benchmark son datasets publicos de REFERENCIA (1086 proyectos, 12925 tareas) y NO calibran; estimacion.proyecto_historico es el historico propio de la organizacion y es lo unico que calibra el modelo. Se llena con el boton Archivar para calibrar de la pantalla de alcance.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T13:11:45 | Tags: `datos`, `benchmark`, `historico`, `calibracion`*

### En este equipo los puertos 3000, 8080 y 5432 suele...

> En este equipo los puertos 3000, 8080 y 5432 suelen estar ocupados: el stack usa PostgREST en 3001, Swagger en 8081 y Postgres en 5432, configurables por .env.

*Confidence: 0.9 | Status: active | Created: 2026-09-15T10:32:16 | Tags: `docker`, `puertos`, `entorno-local`*

### In this project 3GL means third-generation languag...

> In this project 3GL means third-generation language components (COBOL, PL/1, RPG), typically host programs; they are modelled both as a feature category 'componente-3gl' and as an architectural component type with cap 2 devs, base 72 h and stack factors cobol/otro-3gl = 2.6.

*Confidence: 1.0 | Status: expired | Created: 2026-09-15T10:12:13 | Tags: `3gl`, `cobol`, `taxonomia`, `host`*

### 3GL significa componente en lenguaje de tercera ge...

> 3GL significa componente en lenguaje de tercera generacion (COBOL, PL/1, RPG), tipicamente en host. Se modela en dos ejes: categoria de feature 'componente-3gl' con nueve elementos propios, y tipo de componente con base 72 h, cap de 2 devs y stacks cobol/otro-3gl con factor 2.6.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T10:31:48 | Tags: `3gl`, `cobol`, `host`, `taxonomia`*

---

## Decisions

*Architectural choices, approach selections, and their rationale.*

### Data access for the calculadora project is PostgRE...

> Data access for the calculadora project is PostgREST in front of the corporate on-prem Postgres, with no custom backend: the 'estimacion' schema IS the API, and all authorization lives in Postgres via RLS policies, roles (web_anon, estimador, calibrador) and column-level grants.

*Confidence: 1.0 | Status: expired | Created: 2026-09-15T04:12:17 | Tags: `postgrest`, `postgres`, `on-prem`, `data-access`, `rls`*

### Public software effort datasets (PROMISE, SiP, Des...

> Public software effort datasets (PROMISE, SiP, Desharnais, China) live in datasets/raw and load into the Postgres 'benchmark' schema via npm run benchmark:cargar; they bound ranges and validate method but must never set the model coefficients, because productivity spans 6.3 to 23.7 hours per function point across organizations.

*Confidence: 1.0 | Status: expired | Created: 2026-09-15T05:24:40 | Tags: `benchmark`, `datasets`, `calibracion`, `postgres`*

### El navegador debe llamar a la API por el MISMO ori...

> El navegador debe llamar a la API por el MISMO origen (/api con proxy de Vite en desarrollo y nginx en produccion), nunca a una URL absoluta con localhost: desde otro dispositivo localhost resuelve a ESE dispositivo y fallan todas las pantallas con datos sin explicacion. Node no tiene origen, asi que scripts y tests usan VITE_POSTGREST_URL_ABSOLUTA y fijan la base con fijarUrlBase().

*Confidence: 1.0 | Status: active | Created: 2026-09-15T14:44:20 | Tags: `api`, `mismo-origen`, `proxy`, `vite`, `cors`*

### Feature scope is described on three axes: categori...

> Feature scope is described on three axes: categoria_feature (pantalla, reporte, proceso-batch, servicio-api, integracion, evento, migracion, motor-reglas), the architectural component type, and elemento_feature — a multi-select catalog following the IFPUG ISO/IEC 20926 decomposition (EI/EO/EQ/ILF/EIF) with official function point weights.

*Confidence: 1.0 | Status: expired | Created: 2026-09-15T05:24:40 | Tags: `taxonomia`, `ifpug`, `puntos-funcion`, `alcance`*

### Datos: PostgREST delante del Postgres corporativo ...

> Datos: PostgREST delante del Postgres corporativo on-prem, sin backend propio. El esquema 'estimacion' ES la API y toda la autorizacion vive en Postgres (RLS, roles web_anon/estimador/calibrador, grants por columna). Cero credenciales de base de datos en el navegador.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T10:31:47 | Tags: `postgrest`, `postgres`, `on-prem`, `rls`, `seguridad`*

### Los datasets de terceros NO se versionan: datasets...

> La carpeta datasets/ COMPLETA esta en .gitignore y no se versiona en calculadora-estimacion: mezcla datasets de terceros sin licencia de redistribucion, documentacion de procedencia y salidas de analisis local que pueden contener datos internos (azure-estructura.json), y el repositorio es publico. Los datos de referencia se regeneran con npm run benchmark:descargar desde las URLs de Derek-Jones/Software-estimation-datasets. Consecuencia conocida: los enlaces a datasets/PROCEDENCIA.md y datasets/HALLAZGOS.md en README.md y CLAUDE.md apuntan a archivos que solo existen en local.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T13:31:22 | Tags: `licencias`, `datasets`, `repositorio`, `publico`, `gitignore`*

### El esquema 'benchmark' guarda 1086 proyectos y 129...

> El esquema 'benchmark' guarda 1086 proyectos y 12925 tareas de datasets publicos (PROMISE, SiP, Desharnais, China). Sirve para acotar rangos y validar el metodo, NUNCA para fijar coeficientes del modelo. Se consulta con la cabecera Accept-Profile: benchmark.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T10:31:48 | Tags: `benchmark`, `datasets`, `referencia`*

### Enrutado con React Router v8: las rutas se declara...

> Enrutado con React Router v8: las rutas se declaran solo en app/routing/rutas.tsx y el proyecto activo viaja en la URL (/proyecto/:proyectoId) para que se pueda compartir y recargar. Menu superior en widgets/app-header con Proyectos, Calibracion, Fuentes y Demo FSD.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T10:31:47 | Tags: `react-router`, `navegacion`, `url`, `header`*

### El modelo de estimacion estima el par (feature x c...

> El modelo de estimacion estima el par (feature x componente), no la feature suelta. Drivers aditivos (1 + suma de deltas), Monte Carlo con factor de riesgo comun lognormal, y el limite de paralelizacion son los componentes (ruta critica de streams), no la formula de canales de comunicacion. 1 mes-hombre = 6 h/dia x 20 dias = 120 h.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T10:31:47 | Tags: `estimacion`, `modelo`, `monte-carlo`, `brooks`*

### El alcance se describe en tres ejes: categoria_fea...

> El alcance se describe en tres ejes: categoria_feature (que es), tipo de componente (donde vive) y elemento_feature (de que esta hecha, seleccion multiple). Los elementos siguen la descomposicion IFPUG ISO/IEC 20926 (EI/EO/EQ/ILF/EIF) con sus pesos oficiales en puntos funcion; las horas salen del unico coeficiente calibrable pf.horas-por-punto.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T10:31:48 | Tags: `taxonomia`, `ifpug`, `puntos-funcion`, `ejes`*

### pf.horas-por-punto se calibra con el factor global...

> pf.horas-por-punto se calibra con el factor global, no con los factores por tipo de componente, porque el esfuerzo medido por puntos funcion no pasa por base.<tipo>. Y solo se propone si al menos el 20 por ciento del historico usa puntos funcion: mover un coeficiente que el dato no ejercita seria inventar.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T13:11:45 | Tags: `calibracion`, `puntos-funcion`, `coeficientes`*

### Los puntos funcion y el metodo estructural miden L...

> Los puntos funcion y el metodo estructural miden LO MISMO y nunca se suman. Si la feature tiene elementos marcados manda el metodo de puntos funcion (PF x horas-dev-por-punto) y su esfuerzo se reparte entre los componentes en la proporcion que da el metodo estructural, para conservar los streams y la ruta critica. Sumar ambos contaria el trabajo dos veces.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T11:24:35 | Tags: `puntos-funcion`, `motor`, `ifpug`, `medida`*

---

## Goals

*Objectives, targets, and milestones to track progress.*

### The calculadora project is an effort-estimation to...

> The calculadora project is an effort-estimation tool: inputs are features x component types (front Angular, BFF, micro de experiencia, micro de negocio, micro core, monolito .NET Framework/.NET Core) plus integrations and their complexity; outputs are effort in person-months (1 PM = 6h/day x 20 days = 120h), the optimal team size, and the duration in months.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T03:50:35 | Tags: `calculadora`, `estimacion`, `scope`, `person-months`*

---

## Commitments

*Promises, obligations, and TODOs that need follow-through.*

### Enlaces rotos a datasets/ en README, CLAUDE.md y defaults.ts

> Pendiente en calculadora-estimacion desde el 2026-09-15: al sacar datasets/ del repositorio quedaron tres referencias apuntando a archivos que ya solo existen en local -README.md lineas 124-125 y CLAUDE.md linea 116 enlazan a datasets/PROCEDENCIA.md y datasets/HALLAZGOS.md, y src/entities/estimation-model/config/defaults.ts linea 45 cita HALLAZGOS.md para justificar el coeficiente 2.6 de lenguaje. Son documentos propios que no redistribuyen datos de terceros, asi que la salida limpia es moverlos a docs/ y arreglar los enlaces. El usuario todavia no ha elegido entre eso y reescribir los textos para decir que se generan en local.

*Confidence: 1.0 | Status: active | Created: 2026-09-16T02:19:02 | Tags: `pendiente`, `documentacion`, `datasets`, `enlaces-rotos`*

---

## Preferences

*User and entity preferences for personalization.*

### UI styling standard is IBM Carbon Design System (@...

> UI styling standard is IBM Carbon Design System (@carbon/react) themed with a warm light palette; do not introduce competing UI kits such as Material UI, Bootstrap or Tailwind component libraries.

*Confidence: 1.0 | Status: expired | Created: 2026-09-15T02:53:14 | Tags: `carbon-design`, `ibm`, `ui-styling`, `react`*

---

## Relationships

*Entity connections, team context, and collaboration patterns.*

*No memories of this type.*

---

## Context

*Session summaries, status updates, and conversation state.*

### Modelo de medicion del equipo de arquitectura en Azure DevOps

> El equipo de arquitectura (contexto Produbanco, mismo usuario que calculadora-estimacion) esta disenando su seguimiento en Azure DevOps: tres servicios con SLA (asesoria, evaluacion de herramientas, arquitectura de solucion) y un flujo de estados nuevo/planificado/en progreso/bloqueado/revision/finalizado. El problema central es que un arquitecto atiende hasta 3 iniciativas a la vez, asi que el tiempo en estado NO mide dedicacion: sumar dias activos da mas del 100%. La solucion adoptada es prorratear cada dia entre las iniciativas activas de ese arquitecto (1/n(a,d)), que sale gratis del historial y es retroactiva. Regla de diseno derivada: los dias perdidos se explican, no se restan -una sola resta, calendario menos dias efectivos-, porque sumar causas (bloqueo + desfase de sesiones) cuenta dos veces la misma espera. El diseno completo esta en el doc 'Medir la asignacion del arquitecto en Azure DevOps' (artifact 7cfa4674-6247-4146-83c8-b6eb31855b4d).

*Confidence: 0.9 | Status: active | Created: 2026-09-17T20:50:48 | Tags: `azure-devops`, `arquitectura`, `sla`, `asignacion`, `prorrateo`*

---

## Events

*Important conversations, milestones, and temporal occurrences.*

*No memories of this type.*

---

## Learnings

*Knowledge acquired from experience, corrections, and insights.*

### FSD cross-imports between entities use the @x nota...

> FSD cross-imports between entities use the @x notation (entities/a/@x/b.ts) and steiger accepts it, but only for shared vocabulary (types, enums, labels); the better fix is usually to move a shared contract down to the entity that truly owns it, as happened with the Alcance type moving from features/run-estimation to entities/project-scope.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T04:47:18 | Tags: `fsd`, `cross-import`, `steiger`, `arquitectura`*

### PostgREST returns the whole project scope in one r...

> PostgREST returns the whole project scope in one request via nested embeds driven by the foreign keys (proyecto?select=...,componente(...),feature(...,feature_componente(...)),integracion(...),driver(...)), and upserts through Prefer: resolution=merge-duplicates against the primary key.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T04:47:18 | Tags: `postgrest`, `embed`, `upsert`, `api`*

### Un upsert de PostgREST con Prefer: resolution=merg...

> Un upsert de PostgREST con Prefer: resolution=merge-duplicates valida la tupla completa del INSERT antes de resolver el conflicto, asi que omitir una columna NOT NULL falla con 23502 aunque la fila ya exista. Manda la fila entera o usa PATCH.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T10:32:14 | Tags: `postgrest`, `upsert`, `not-null`*

### Empirical limits from 1086 real projects: function...

> Empirical limits from 1086 real projects: function point counts alone predict effort poorly (MMRE 71-101%); restricting to one organization and one stack cuts MMRE from 77% to 28%; a real company estimating 12299 tasks hit within 25% only 42% of the time, so the PRED(25)>75% literature target applies to project level, not task level.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T05:24:41 | Tags: `estimacion`, `benchmark`, `mmre`, `expectativas`*

### In parametric effort estimation, project cost driv...

> In parametric effort estimation, project cost drivers must be combined additively (factor = 1 + sum of deltas), not multiplicatively: five multiplicative drivers in the 0.85-1.35 range compound to 2x-4x on ordinary inputs and destroy the estimate's credibility.

*Confidence: 0.95 | Status: active | Created: 2026-09-15T03:50:36 | Tags: `estimacion`, `cocomo`, `cost-drivers`, `modeling`*

### Importing the whole @carbon/react SCSS entrypoint ...

> Importing the whole @carbon/react SCSS entrypoint produces ~970 kB of CSS; importing only the used component partials from @carbon/react/scss/components/ cuts it to ~167 kB, so new Carbon components must be registered one by one in app/styles/index.scss.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T03:05:44 | Tags: `carbon-design`, `bundle-size`, `scss`, `performance`*

### Con TypeScript 7 la configuracion de steiger debe ...

> Con TypeScript 7 la configuracion de steiger debe estar en steiger.config.js, no en .ts: su cargador (cosmiconfig) llama a typescript.findConfigFile, una API JS que TypeScript 7 retiro, y lint:fsd revienta con 'findConfigFile is not a function'. La configuracion no lleva anotaciones de tipo, asi que el renombrado es directo.

*Confidence: 1.0 | Status: active | Created: 2026-09-21T14:59:02 | Tags: `steiger`, `typescript-7`, `fsd`, `configuracion`, `cosmiconfig`*

### When a cost-vs-duration frontier is flat, picking ...

> When a cost-vs-duration frontier is flat, picking the minimum-cost point alone is noise: the recommendation should be the fastest option within a tolerance (5%) of the minimum cost. On the reference scope this changed the answer from 9.5 people/16.8 months to 13.5 people/11.8 months at the same cost.

*Confidence: 0.95 | Status: active | Created: 2026-09-15T04:31:44 | Tags: `estimacion`, `frontera`, `optimizacion`, `team-sizing`*

### Carbon component tokens (button-*, tag-*, notifica...

> Carbon component tokens (button-*, tag-*, notification-*) are emitted after the theme map inside theme.theme(), so overriding them requires theme.add-component-tokens() called after the component partials are imported; putting them in the $theme map alone has no effect.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T03:05:43 | Tags: `carbon-design`, `scss`, `theming`, `component-tokens`*

### Una vista expuesta por PostgREST necesita WITH (se...

> Una vista expuesta por PostgREST necesita WITH (security_invoker = true): por defecto corre como su dueno y se salta el RLS de las tablas base.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T10:32:13 | Tags: `postgres`, `rls`, `vistas`*

### Monte Carlo over independent task estimates collap...

> Monte Carlo over independent task estimates collapses variance via the central limit theorem and yields an unrealistically narrow P50-P90 band; a correlated common-risk factor (lognormal, sigma around 0.18) applied per simulation run is required for a credible confidence band.

*Confidence: 0.95 | Status: active | Created: 2026-09-15T03:50:36 | Tags: `monte-carlo`, `estimacion`, `risk`, `statistics`*

### Carbon rechaza contenido interactivo dentro de lab...

> Carbon rechaza contenido interactivo dentro de labelText/label de sus campos (error explicito 'must have no interactive content'), porque un boton dentro de un <label> es HTML invalido y rompe el foco. Un toggle de ayuda va superpuesto junto al campo con un contenedor position relative, nunca dentro de la etiqueta.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T12:04:06 | Tags: `carbon`, `accesibilidad`, `labels`, `ui`*

### A PostgreSQL view exposed through PostgREST must b...

> A PostgreSQL view exposed through PostgREST must be created WITH (security_invoker = true); by default a view runs as its owner and bypasses row level security on its base tables.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T04:12:18 | Tags: `postgres`, `rls`, `views`, `security`, `postgrest`*

### Un token JWT guardado en localStorage no debe tapa...

> Un token JWT guardado en localStorage no debe tapar nunca al del entorno: si esta caducado o es ilegible se descarta, y ante un 401 el cliente lo tira y reintenta una vez con el del entorno. Sin eso, reiniciar el stack dejaba toda la interfaz en 401 sin explicacion.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T11:41:29 | Tags: `token`, `localstorage`, `401`, `recuperacion`*

### Carbon NumberInput con un valor vacio necesita : s...

> Carbon NumberInput con un valor vacio necesita la prop allowEmpty: sin ella valida el vacio contra min y marca el campo en rojo con el mensaje de rango. Paso en la columna Max. devs del editor de componentes, donde vacio significa "usa el tope del tipo".

*Confidence: 1.0 | Status: active | Created: 2026-09-15T13:05:51 | Tags: `carbon`, `numberinput`, `validacion`, `ui`*

### La estimacion esta validada de punta a punta contr...

> La estimacion esta validada de punta a punta contra un calculo independiente: un proyecto piloto de 4 componentes, 3 features, 1 integracion y 2 drivers adversos dio 26.8 MH, y el calculo a mano desde los coeficientes documentados (dev bruto 953.92 h, factor x1.48, nominal 1411.8 h) cuadra con un desvio del 0.5 % en la relacion P80/moda.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T13:05:50 | Tags: `validacion`, `estimacion`, `motor`, `e2e`*

### Measured within the Desharnais dataset (one compan...

> Measured within the Desharnais dataset (one company, same years), 3GL languages need 18.7 hours per function point versus 4.2 for a higher-generation language — a 4.4x gap; across datasets Albrecht COBOL/PL1 gives 23.7 h/FP versus China's 8.1 (2.9x). This is the empirical basis for the project's COBOL stack factor of 2.6.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T10:12:13 | Tags: `3gl`, `cobol`, `productividad`, `benchmark`*

### WorkItemSnapshot es la entidad para tiempo en estado, no WorkItemRevisions

> Para medir tiempo en estado y concurrencia en Azure DevOps Analytics la entidad correcta es WorkItemSnapshot (una fila por work item y por dia, con State y AssignedTo de ese dia), no WorkItemRevisions. En el volcado real de los dos equipos, 3166 de 4523 revisiones consecutivas (70%) no cambian el State, asi que WorkItemRevisions obliga a reconstruir tramos y esta lleno de ruido; con WorkItemSnapshot los dias en un estado son un simple conteo de filas con groupby. WorkItemSnapshot exige filtrar siempre por rango de fechas y tipo de work item.

*Confidence: 0.85 | Status: active | Created: 2026-09-17T20:27:38 | Tags: `azure-devops`, `odata`, `analytics`, `tiempo-en-estado`*

### El camino 1 de adopcion (capturar el alcance al ar...

> El camino 1 de adopcion (capturar el alcance al arrancar el proyecto y archivarlo al cerrarlo) esta verificado de punta a punta por la interfaz: el proyecto se estima, Archivar para calibrar toma la estimacion vigente como mh_estimadas, y la fila aparece en Historico marcada como calibra.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T13:31:22 | Tags: `camino1`, `adopcion`, `archivar`, `verificacion`*

### PostgREST upsert with Prefer: resolution=merge-dup...

> PostgREST upsert with Prefer: resolution=merge-duplicates validates the full INSERT tuple before resolving the conflict, so omitting a NOT NULL column fails with 23502 even when the row already exists; send the complete row or use PATCH instead.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T05:03:54 | Tags: `postgrest`, `upsert`, `not-null`, `postgres`*

### El cliente postgrest debe leer el cuerpo como text...

> El cliente postgrest debe leer el cuerpo como texto y parsear solo si no esta vacio: un POST con Prefer: return=minimal responde 201 con cuerpo VACIO y llamar a .json() a ciegas lanza SyntaxError, lo que rompia todas las altas del ABM en la interfaz. Probarlo por curl no detecta este fallo; hace falta test unitario del cliente.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T11:24:36 | Tags: `postgrest`, `cliente`, `bug`, `return-minimal`*

### El volcado de Azure DevOps Analytics del tipo Work...

> El volcado de Azure DevOps Analytics del tipo WorkItemRevisions solo expone WorkItemId, Title, WorkItemType, State, Revision, ChangedDate y CreatedDate: no trae esfuerzo (Effort, StoryPoints, CompletedWork, OriginalEstimate), ni enlaces padre-hijo, ni AreaPath, ni AssignedTo. Sin esfuerzo real ni jerarquia no se puede calibrar el modelo de estimacion; solo se derivan tiempos de ciclo y proporciones de descomposicion. Para calibrar hay que consultar la entidad WorkItems, no WorkItemRevisions.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T21:09:43 | Tags: `azure-devops`, `odata`, `calibracion`, `work-item-revisions`, `esfuerzo`*

### Estimation-model calibration adjustments interact ...

> Estimation-model calibration adjustments interact and must be iterated: raising base hours increases effort while shrinking the common-risk sigma narrows the distribution and lowers the committed percentile, so a single pass left a -8% residual bias; two refinement rounds took MMRE from 16.5% to 3.1% and bias to +0.1%.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T05:03:54 | Tags: `calibracion`, `monte-carlo`, `convergencia`, `estimacion`*

### Reason no es personalizable en procesos heredados de Azure DevOps

> En Azure DevOps Cloud con proceso heredado el campo Reason NO es personalizable por transicion de estado: se autogenera como 'Moved to state X'. Los Reason configurables por transicion solo existian en procesos XML on-premise. Por tanto, para capturar la causa de un bloqueo o de una replanificacion hay que crear un campo de lista propio y marcarlo obligatorio mediante una regla de proceso heredado condicionada al estado o al cambio del campo disparador.

*Confidence: 0.9 | Status: active | Created: 2026-09-17T20:27:38 | Tags: `azure-devops`, `proceso-heredado`, `reason`, `reglas`*

### Cuando la frontera coste-duracion es plana, elegir...

> Cuando la frontera coste-duracion es plana, elegir el minimo coste es ruido: se recomienda el mas rapido dentro del 5 % del coste minimo. En el alcance de referencia eso cambio la respuesta de 9.5 personas y 16.8 meses a 13.5 personas y 11.8 meses al mismo coste.

*Confidence: 0.95 | Status: active | Created: 2026-09-15T10:32:16 | Tags: `estimacion`, `frontera`, `equipo`*

### Un proyecto cerrado sin alcance queda como REGISTR...

> Un proyecto cerrado sin alcance queda como REGISTRO de la desviacion pero no recalibra nada: el backtest lo descarta porque no puede re-estimarlo. La interfaz lo marca por fila como calibra o solo registro.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T13:21:43 | Tags: `historico`, `calibracion`, `alcance`*

### Un force-push que reescribe la historia NO borra e...

> Un force-push que reescribe la historia NO borra el contenido de GitHub: el commit y sus blobs siguen recuperables por SHA via la API (repos/:owner/:repo/commits/:sha y /contents/...?ref=:sha) hasta que GitHub recolecta basura, cosa que no hace bajo demanda. Para purgar de verdad hay que abrir un ticket en support.github.com pidiendo 'remove cached views and unreachable objects', o borrar y recrear el repositorio. Corolario: para datos sensibles hay que asumir divulgacion desde el instante del push, no desde que se descubre.

*Confidence: 1.0 | Status: expired | Created: 2026-09-15T22:54:16 | Tags: `git`, `github`, `force-push`, `seguridad`, `datos-confidenciales`*

### En PostgreSQL un REVOKE por columna NO recorta un ...

> En PostgreSQL un REVOKE por columna NO recorta un GRANT a nivel de tabla: hay que retirar el permiso de tabla y volver a darlo columna por columna. Sin eso PostgREST acepta el campo prohibido con 201 y el trigger lo sobreescribe en silencio.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T10:32:13 | Tags: `postgres`, `grants`, `seguridad`*

### Vitest configuration must live in its own vitest.c...

> Vitest configuration must live in its own vitest.config.ts, not inside vite.config.ts: importing from 'vitest/config' in vite.config.ts makes the dev server container fail to boot because the runtime image has no vitest installed.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T04:31:44 | Tags: `vitest`, `vite`, `docker`, `configuracion`*

### The real limit to parallelizing a software project...

> The real limit to parallelizing a software project is the number of components and the max useful devs per component (the critical-path stream), not the communication-channel formula: a pure n(n-1)/2 overhead model has its optimum at sqrt(2/gamma), independent of project size, which is wrong. Brooks's law emerges from a fixed-point loop where headcount raises coordination effort, which raises headcount.

*Confidence: 0.95 | Status: active | Created: 2026-09-15T03:50:36 | Tags: `estimacion`, `brooks-law`, `team-sizing`, `modeling`*

### El backtest de calibracion debe llamar al motor CO...

> El backtest de calibracion debe llamar al motor CON el catalogo de elementos: sin el, las features archivadas con elementos marcados se remiden por el metodo estructural y la ruta de puntos funcion queda fuera del ciclo de calibracion.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T13:11:44 | Tags: `calibracion`, `puntos-funcion`, `backtest`*

### Calibrating an estimation model must adjust every ...

> Calibrating an estimation model must adjust every coefficient that feeds the measured effort, not just the base hours: bootstrap and integration costs were about half the total, so scaling base.* alone corrected only half the bias.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T05:03:54 | Tags: `calibracion`, `estimacion`, `coeficientes`, `modelado`*

### Calibrar debe ajustar TODO lo que alimenta el esfu...

> Calibrar debe ajustar TODO lo que alimenta el esfuerzo medido: escalar solo base.<tipo> corrigio la mitad del sesgo porque arranques e integraciones eran la otra mitad del total.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T10:32:14 | Tags: `calibracion`, `coeficientes`*

### La configuracion de vitest vive en vitest.config.t...

> La configuracion de vitest vive en vitest.config.ts aparte: importar de 'vitest/config' dentro de vite.config.ts hace que el contenedor de desarrollo no arranque porque la imagen no lleva vitest. Y un volumen anonimo sobre /app/node_modules sobrevive a los rebuilds sirviendo dependencias viejas.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T10:32:16 | Tags: `vitest`, `docker`, `configuracion`*

### Monte Carlo sobre items independientes colapsa la ...

> Monte Carlo sobre items independientes colapsa la varianza por el teorema central del limite y da una banda P50-P90 increiblemente estrecha. Hace falta un factor de riesgo comun lognormal (sigma ~0.18) aplicado por corrida.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T10:32:14 | Tags: `monte-carlo`, `riesgo`, `estadistica`*

### In PostgreSQL a column-level REVOKE does not narro...

> In PostgreSQL a column-level REVOKE does not narrow an existing table-level GRANT: to restrict writable columns you must REVOKE the table privilege first and then GRANT column by column. Otherwise PostgREST accepts the forbidden field with 201 and a trigger silently overwrites it.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T04:12:17 | Tags: `postgres`, `grants`, `security`, `postgrest`*

### An anonymous docker volume mounted over /app/node_...

> An anonymous docker volume mounted over /app/node_modules survives image rebuilds and keeps serving stale dependencies; when only source files are bind-mounted, drop that volume so the image's node_modules is used.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T04:31:44 | Tags: `docker`, `node-modules`, `volumenes`, `vite`*

### Los ajustes de calibracion interactuan: subir hora...

> Los ajustes de calibracion interactuan: subir horas base sube el esfuerzo pero estrechar el sigma del riesgo comun baja el percentil comprometido. Una sola pasada dejo -8 % de sesgo residual; refinando en dos rondas el MMRE bajo de 16.5 % a 3.1 % y el sesgo a +0.1 %.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T10:32:14 | Tags: `calibracion`, `convergencia`, `mmre`*

### pf.horas-por-punto se expresa en horas de DESARROL...

> pf.horas-por-punto se expresa en horas de DESARROLLO, no de proyecto completo. Los 6.3-23.7 h/PF de los datasets publicos incluyen analisis, QA y gestion; como el motor aplica ademas un x1.65 de overheads, hay que dividir: mediana 8.7 / 1.65 = 5.2 h de desarrollo por punto (p25 2.9, p75 9.9).

*Confidence: 1.0 | Status: active | Created: 2026-09-15T11:24:35 | Tags: `puntos-funcion`, `unidades`, `coeficientes`*

### Reescribir el historial no borra nada de GitHub: hace falta purgar aparte

> Purgar un dato del repositorio publico calculadora-estimacion exige DOS pasos y el segundo es el que cuenta. (1) Reescribir el historial local: git filter-branch --index-filter 'git rm -r --cached --ignore-unmatch <ruta>' -- main (git-filter-repo no esta instalado y pip lo bloquea por PEP 668) y force-push con --force-with-lease. (2) GitHub NO recolecta basura sola: VERIFICADO el 2026-09-15 que tras el force-push los commits viejos seguian respondiendo 200 en gh api repos/OWNER/REPO/commits/<sha-viejo> y sus blobs se leian enteros por ?ref=<sha-viejo>. El unico remedio que funciono fue BORRAR Y RECREAR el repositorio (gh repo create + push): despues los SHAs viejos dan 422 'No commit found for the ref'. El token gh necesita el scope delete_repo, que no trae por defecto: se anade con 'gh auth refresh -h github.com -s delete_repo' y es interactivo, lo ejecuta el usuario. Comprobar SIEMPRE los SHAs viejos por API antes de dar por purgado un dato; el force-push por si solo no purga nada. Antes de cualquier purga: git bundle --all al scratchpad, una rama local respaldo/pre-purga-<tema>, y excluir esas ramas de la reescritura pasando '-- main'.

*Confidence: 1.0 | Status: active | Created: 2026-09-16T00:33:52 | Tags: `git`, `github`, `purga`, `historial`, `repositorio-publico`, `seguridad`, `delete-repo`*

### Medido dentro de Desharnais (misma empresa): 3GL n...

> Medido dentro de Desharnais (misma empresa): 3GL necesita 18.7 h/PF frente a 4.2 de un lenguaje de generacion superior, 4.4x. Entre datasets, Albrecht COBOL/PL1 23.7 frente a China 8.1, 2.9x. De ahi sale stack.cobol = 2.6.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T10:32:15 | Tags: `3gl`, `cobol`, `productividad`*

### Un aviso util del contraste COCOMO: en el proyecto...

> Un aviso util del contraste COCOMO: en el proyecto piloto la ruta critica de streams daba 5.4 meses frente a los 10.5 nominales de COCOMO, y el sistema lo marco como zona imposible. El modelo de streams permite mas paralelismo del que COCOMO considera realista cuando hay pocos componentes con esfuerzo concentrado.

*Confidence: 0.9 | Status: active | Created: 2026-09-15T13:05:51 | Tags: `cocomo`, `triangulacion`, `alertas`, `duracion`*

### Los datos sensibles se ignoran en .gitignore versionado, no en .git/info/exclude

> Una regla de ignore que protege datos sensibles va SIEMPRE en el .gitignore versionado, nunca en .git/info/exclude. .git/info/exclude es local al clon y NO viaja con el repositorio: la carpeta parece protegida en la maquina donde se escribio la regla, pero cualquier clon nuevo -o cualquier otra persona o agente- no la hereda y queda a un 'git add .' de publicar el dato. Detectado el 2026-09-15 en calculadora-estimacion: gmail/ (volcados de Azure DevOps con datos internos de Produbanco) llevaba tiempo protegida solo por .git/info/exclude. Al auditar un repositorio publico, comprobar con 'git check-ignore -v <ruta>' de que ARCHIVO sale la regla: si la respuesta empieza por .git/info/exclude, la proteccion es falsa.

*Confidence: 1.0 | Status: active | Created: 2026-09-16T02:18:57 | Tags: `git`, `gitignore`, `seguridad`, `datos-confidenciales`, `repositorio-publico`*

### Medido sobre datos reales: la productividad va de ...

> Medido sobre datos reales: la productividad va de 6.3 a 23.7 horas por punto funcion entre organizaciones; acotar a una empresa y un lenguaje baja el MMRE de 77 % a 28 %; y una empresa real acerto dentro del 25 % en solo el 42 % de sus 12299 tareas. El objetivo PRED(25) > 75 % es de nivel proyecto, no de tarea.

*Confidence: 1.0 | Status: active | Created: 2026-09-15T10:32:15 | Tags: `benchmark`, `productividad`, `expectativas`*

---

## Observations

*Patterns noticed, behavioral notes, and recurring themes.*

*No memories of this type.*

---

## Artifacts

*Tool outputs, files, reports, and external references.*

*No memories of this type.*

---

## Errors

*Failure records, bugs, and lessons learned from mistakes.*

*No memories of this type.*

---

*End of memory export.*
