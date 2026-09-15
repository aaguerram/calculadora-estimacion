---
name: fsd-architecture
description: Reglas obligatorias de Feature-Sliced Design para este proyecto. Úsala SIEMPRE antes de crear, mover, renombrar o importar cualquier archivo dentro de src/ — decide en qué capa y segmento va el código, qué puede importar y cómo se expone su public API. También cubre el patrón MVI (reducer puro) para el estado.
---

# Feature-Sliced Design — reglas del proyecto

## 0. Antes de escribir nada, responde estas tres preguntas

1. **¿Qué es esto?** → determina la **capa**.
2. **¿De qué trata?** → determina el **slice** (su carpeta dentro de la capa).
3. **¿Para qué sirve?** → determina el **segmento** (`ui`, `model`, `lib`, `api`, `config`).

Si no puedes responder las tres, todavía no sabes dónde va el archivo. No lo crees.

---

## 1. Las capas, en orden de dependencia

```
app  →  pages  →  widgets  →  features  →  entities  →  shared
```

Un archivo **solo puede importar de capas estrictamente a su derecha**.

### `shared/` — sin dominio
Código que seguiría siendo válido si el proyecto cambiara de negocio por completo.
No sabe qué es una "calculadora", un "saludo" ni un "usuario".

- `shared/ui/` — componentes visuales genéricos (`PageSection`, `Card`).
- `shared/lib/` — utilidades puras (`cx`, formateadores genéricos, hooks genéricos).
- `shared/config/` — constantes de entorno y configuración.
- `shared/api/` — cliente HTTP base, interceptores.

**`shared` no importa de ninguna otra capa. Nunca.**

### `entities/` — sustantivos del negocio
Un concepto: `greeting`, `operation`, `user`. Contiene su tipo, sus reglas puras
y su representación visual canónica.

- `model/types.ts` — el tipo de la entidad y sus valores por defecto.
- `lib/` — reglas puras sobre la entidad (`formatGreeting`).
- `ui/` — cómo **se muestra** la entidad. **Presentacional**: recibe props, no despacha acciones.
- `api/` — lectura/escritura de la entidad contra el backend.

### `features/` — verbos del negocio
Una acción que el usuario ejecuta y que tiene valor por sí sola:
`greet-visitor`, `evaluate-expression`, `toggle-theme`.

- `model/` — el reducer puro (State + Intent) y el hook que lo conecta a React.
- `ui/` — el formulario/botón que dispara la acción.

Nombra el slice en **kebab-case y en infinitivo o verbo**: `greet-visitor`, no `greeting-form`.

### `widgets/` — bloques compuestos
El **único lugar** donde un feature y una entity se conocen. Un widget es
autónomo: se puede soltar en cualquier página sin configurarlo.

### `pages/` — pantallas
Ensambla widgets y define el layout de una ruta. **Cero lógica de negocio.**

### `app/` — arranque
Tema global, providers, estilos, router, `App.tsx`. Es la única capa que puede
importar de todas las demás. No tiene segmento `ui/`.

---

## 2. Las dos reglas que rompen el build

### Regla A — sin imports laterales
Dos slices de la **misma capa** no se importan entre sí.

```ts
// ❌ features/evaluate-expression/model/x.ts
import { something } from '@/features/greet-visitor'

// ✅ Súbelo a un widget que use ambos, o baja lo común a entities/ o shared/
```

### Regla B — todo pasa por la public API
Cada slice expone un `index.ts` y **nadie entra por debajo**.

```ts
// ❌
import { GreetVisitorForm } from '@/features/greet-visitor/ui/GreetVisitorForm'
// ✅
import { GreetVisitorForm } from '@/features/greet-visitor'
```

Dentro del propio slice se usan rutas relativas (`../model/...`), nunca el alias `@/`.

El `index.ts` es un contrato: exporta lo mínimo. Si algo no se usa fuera del slice,
no se exporta.

### Excepción: cross-import entre entities con `@x`

Dos entities a veces comparten **vocabulario** (tipos, enums, etiquetas). Para eso
FSD define una segunda public API, y steiger la acepta:

```
entities/estimation-model/@x/project-scope.ts     ← qué expone A para B
entities/project-scope/model/types.ts             ← importa de '@/entities/estimation-model/@x/project-scope'
```

Reglas de uso:

- Un archivo `@x/<entity-destino>.ts` por consumidor: queda **explícito quién
  depende de quién** y se puede auditar.
- Solo **tipos y constantes de vocabulario**. Nunca lógica, nunca funciones que
  hagan algo. Si necesitas compartir comportamiento, las dos entities eran una.
- Si aparecen tres o más `@x` entre las mismas dos entities, estabas modelando
  una sola: fusiónalas.

Y su alternativa, que suele ser mejor: **bajar el contrato compartido a la entity
que lo posee de verdad.** El tipo `Alcance` vivía en `features/run-estimation`
hasta que el ABM también lo necesitó; una feature no puede ser dueña de un
contrato que otra capa consume, así que bajó a `entities/project-scope` y el
motor lo importa desde ahí.

---

## 3. Segmentos permitidos

| Segmento | Contiene |
|---|---|
| `ui/` | Componentes React y sus `*.module.scss` |
| `model/` | Estado, reducers, hooks de estado, tipos del slice |
| `lib/` | Funciones puras específicas de ese slice |
| `api/` | Llamadas de red del slice |
| `config/` | Constantes del slice |

**Nombres prohibidos** (el linter los rechaza porque describen *qué son*, no *para qué sirven*):
`components`, `helpers`, `utils`, `hooks`, `providers`, `context`, `types`, `constants`,
`services`, `store`, `reducers`, `actions`, `selectors`, `modals`, `handlers`, `assets`.

---

## 4. Estado: MVI dentro de `model/`

La lógica **no vive en el componente**. Tres archivos, tres responsabilidades:

```ts
// model/<slice>.reducer.ts  — Modelo + Intents. Puro. Sin React.
export interface XState { /* ... */ }
export type XIntent =
  | { type: 'algoCambio'; valor: string }
  | { type: 'confirmado' }

export const initialXState: XState = { /* ... */ }

export function xReducer(state: XState, intent: XIntent): XState {
  switch (intent.type) { /* ... */ default: return state }
}
```

```ts
// model/use-<slice>.ts — único puente con React
export function useX() {
  const [state, dispatch] = useReducer(xReducer, initialXState)
  return { state, dispatch }
}
```

```tsx
// ui/XForm.tsx — traduce eventos del DOM a intents. No calcula nada.
<Button onClick={() => dispatch({ type: 'confirmado' })}>Aceptar</Button>
```

Por qué: el reducer se prueba con `expect(xReducer(state, intent)).toEqual(...)`,
sin montar React ni el DOM.

Referencia viva en el repo: `src/features/greet-visitor/`.

---

## 5. Cómo agregar algo nuevo — receta

**Una acción nueva del usuario** → `src/features/<verbo-kebab>/`
con `model/<verbo>.reducer.ts`, `model/use-<verbo>.ts`, `ui/<Verbo>Form.tsx`, `index.ts`.

**Un concepto de negocio nuevo** → `src/entities/<sustantivo>/`
con `model/types.ts`, `lib/<regla>.ts`, `ui/<Sustantivo>View.tsx`, `index.ts`.

**Una pantalla nueva** → `src/pages/<nombre>/ui/<Nombre>Page.tsx` + `index.ts`,
y registra la ruta en `src/app/App.tsx`.

**Algo genérico y sin dominio** → `src/shared/`.

Si dudas entre `feature` y `entity`: ¿el usuario *hace* algo? feature.
¿El usuario *ve* algo? entity.

---

## 6. Validación

```bash
npm run lint:fsd    # steiger — valida capas, slices, segmentos y public API
npm run check       # lint + lint:fsd + typecheck
```

Si `steiger` marca un error, **mueve el archivo**. Desactivar la regla en
`steiger.config.ts` no es una solución aceptable.
