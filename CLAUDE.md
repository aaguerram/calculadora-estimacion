# Reglas del proyecto — Calculadora

Este archivo es **vinculante** para cualquier agente (Claude Code, Cursor, Copilot,
Codex, Gemini CLI, etc.) y para cualquier persona que escriba código aquí.

Hay dos reglas no negociables:

1. **Toda la estructura sigue Feature-Sliced Design (FSD).**
2. **Toda la UI se construye con IBM Carbon Design System y el tema claro cálido
   del proyecto, cuya paleta es la de la marca Produbanco.**

Antes de crear, mover o renombrar un archivo, lee la skill correspondiente:

| Tema | Skill |
|---|---|
| Dónde va cada archivo, qué puede importar cada capa | `.claude/skills/fsd-architecture/SKILL.md` |
| Componentes, tokens, colores y tipografía | `.claude/skills/carbon-warm-ui/SKILL.md` |
| Acceso a datos, SQL, RLS, roles, cliente de API | `.claude/skills/postgrest-data/SKILL.md` |

---

## 1. Feature-Sliced Design — resumen ejecutable

```
src/
  app/        Inicialización: tema global, providers, estilos, rutas.
  pages/      Una pantalla completa por slice. Ensambla widgets.
  widgets/    Bloques autónomos de UI que combinan features + entities.
  features/   Una acción del usuario con valor de negocio (verbo).
  entities/   Un concepto de negocio y su representación (sustantivo).
  shared/     Código reutilizable SIN conocimiento del dominio.
```

**Regla de dependencia (la única que importa):**
una capa solo puede importar de capas **estrictamente inferiores**.

```
app → pages → widgets → features → entities → shared
```

- `shared` no importa de nadie.
- **Dos slices de la misma capa NUNCA se importan entre sí.**
  Si dos features se necesitan, súbelos a un `widget` o a una `page`.
- Todo import cruza por la **public API** del slice (`index.ts`).
  `@/features/greet-visitor` ✅ — `@/features/greet-visitor/ui/GreetVisitorForm` ❌

**Segmentos válidos dentro de un slice:** `ui/`, `model/`, `lib/`, `api/`, `config/`.
Prohibidos por el linter: `components/`, `helpers/`, `utils/`, `hooks/`, `providers/`,
`types/`, `constants/`, `services/`, `store/`, `reducers/`… (nombran *qué son*, no *para qué sirven*).

## 2. Estado: patrón MVI dentro del segmento `model/`

La lógica de negocio vive en **reducers puros**, nunca dentro de un componente:

```
model/<slice>.reducer.ts   State + Intent + reducer()   ← puro, sin React
model/use-<slice>.ts       useReducer()                 ← único puente con React
ui/<Componente>.tsx        renderiza estado, emite intents ← sin cálculos
```

Referencia viva: `src/features/greet-visitor/`.

## 3. Estilos

- Componentes de `@carbon/react`. **No** instalar MUI, Bootstrap, Tailwind, Chakra ni similares.
- Colores **siempre** por token de tema (`$text-primary`, `$layer-01`, `$button-primary`…).
  Escribir un hex en un componente es un error de revisión.
- El tema se define **solo** en `src/app/styles/_warm-light-theme.scss`.
- Estilos por componente en `*.module.scss` junto al `.tsx`.
- Al usar un componente Carbon nuevo, añade su partial en `src/app/styles/index.scss`.
  No importes `@carbon/react` completo (multiplica el CSS por 6).

### 3.0 Regla de marca — Produbanco (vinculante)

**La paleta del producto es la de Produbanco. No se inventa ningún color.**

Todo color de marca, de estado o de gráfico sale del design system público de
Produbanco (GDS). Los únicos colores que no son de marca son los neutros cálidos
hueso/arena que dan al tema su carácter claro y cálido, y están enumerados en la
skill. La tabla completa y su uso están en `.claude/skills/carbon-warm-ui/SKILL.md`.

| Rol | Hex |
|---|---|
| Verde primario (marca) | `#00693c` — hover `#003f24`, activo `#002a18` |
| Verde secundario (lima, solo acento) | `#69be28` |
| Texto / iconos | `#1e1e1e`, `#5d5d5d`, `#717171` |
| Error · éxito · aviso · info | `#c40000` · `#0f804f` · `#e87300` · `#0f4dbc` |
| Neutros cálidos (fondo, tarjeta, borde) | `#faf7f0`, `#f3efe5`, `#fffdf8`, `#ddd7c8` |

Restricciones que se comprueban en cada `npm run check` con `npm run lint:marca`:

1. Fuera de `src/app/styles/_warm-light-theme.scss` no puede haber ningún color
   literal (hex, `rgb()`, `hsl()`) ni ninguna `font-family`.
2. Dentro de ese archivo, cada hex debe pertenecer a la paleta aprobada.
3. ¿Necesitas un tono intermedio? Se mezcla con `color.mix()` desde un color de
   marca. **Nunca** se escribe un hex nuevo, ni siquiera "temporal".
4. La tipografía sigue siendo IBM Plex Sans (la de Carbon). La marca entra por el
   color, no por la fuente.

Si el guard falla, la solución es cambiar el color — nunca relajar la regla.

## 3.bis Datos

- Sin backend propio: **PostgREST** genera la API desde el esquema `estimacion`.
- **La seguridad vive en Postgres** (RLS + roles + grants), nunca en React.
- Cero credenciales de base de datos en el cliente. Solo el JWT del usuario.
- La fila cruda de Postgres no sale del segmento `entities/<x>/api/`.

## 3.ter Datos de referencia

- `benchmark` es un esquema APARTE, de solo lectura para la app: son datasets
  públicos de investigación, **no** proyectos de la organización.
- Se consultan con la cabecera `Accept-Profile: benchmark`.
- **Nunca** se usan para fijar coeficientes del modelo: la productividad varía
  3.7× entre organizaciones. Sirven para acotar rangos y contrastar.
- Procedencia en `datasets/PROCEDENCIA.md`, análisis en `datasets/HALLAZGOS.md`.

## 4. Comandos

```bash
npm run dev        # servidor de desarrollo
npm run build      # typecheck + build
npm run lint       # oxlint
npm run lint:fsd   # steiger: valida la arquitectura FSD
npm run lint:marca # verifica que la paleta Produbanco se respeta
npm run test       # vitest sobre el código puro de model/
npm run check      # los cinco, en orden

npm run stack:up    # Postgres + PostgREST + Swagger + React en docker
npm run stack:down  # parar
npm run stack:reset # borrar el volumen y reconstruir (aplica cambios de db/init)
npm run seed        # carga el alcance de referencia en Postgres
npm run seed:all    # alcance de referencia + histórico sintético + benchmark
npm run benchmark:cargar  # datasets públicos reales -> esquema `benchmark`
npm run test:e2e    # integración: exige stack levantado + seed
npm run token       # imprime un JWT de desarrollo
npm run token:env   # lo escribe en .env como VITE_POSTGREST_TOKEN (30 días)
```

**`npm run check` debe pasar antes de dar por terminado cualquier cambio.**
Si `steiger` reporta un error, la solución es mover el archivo —
nunca desactivar la regla.

## 3.quater Navegación

- Rutas declaradas **solo** en `app/routing/rutas.tsx`. Ninguna otra capa las conoce.
- El menú superior vive en `widgets/app-header`: una entrada por sección.
- El estado que identifica *qué* se está viendo viaja en la URL
  (`/proyecto/:proyectoId`), no en estado local: así se comparte y se recarga.
- Una `page` solo lee sus parámetros y compone widgets; no carga datos.

## 4.bis Tests

Todo lo que viva en un `model/` y sea puro **se testea**. No es opcional:
el motor de estimación existe para ser auditado, y un reducer sin test es una
regla de negocio sin verificar.

- Los tests van junto al archivo: `calcular-esfuerzo.ts` → `calcular-esfuerzo.test.ts`.
- Nada de red, reloj ni azar en un test: el azar entra por una semilla
  (`crearRng`) y el motor es determinista a propósito.
- Referencia: `src/features/run-estimation/model/`.
- Los `*.e2e.test.ts` tocan la red y exigen Docker: van en `npm run test:e2e`,
  **nunca** en `npm run check`.
- Probar la API por curl **no sustituye** a probar la interfaz. `npm run ui:revisar`
  abre las rutas en un navegador real: así se detectó que un token viejo en
  `localStorage` tapaba al del entorno y dejaba toda la app en 401.
- Hay un **MCP de Playwright** registrado en ámbito usuario (`claude mcp get playwright`).
  Sirve para conducir la interfaz sin escribir scripts: úsalo antes de dar por
  buena cualquier pantalla.

## 5. Checklist antes de entregar código

- [ ] El archivo está en la capa correcta y en el segmento correcto.
- [ ] No hay imports entre slices de la misma capa.
- [ ] Todo import externo al slice pasa por su `index.ts`.
- [ ] La lógica nueva vive en un reducer/función pura, no en el JSX.
- [ ] No hay colores, tamaños ni fuentes hardcodeados: solo tokens de Carbon.
- [ ] Todo color nuevo del tema sale de la paleta Produbanco (`npm run lint:marca`).
- [ ] La lógica pura nueva tiene tests junto al archivo.
- [ ] `npm run check` pasa.
