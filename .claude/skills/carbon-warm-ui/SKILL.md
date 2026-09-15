---
name: carbon-warm-ui
description: Reglas obligatorias de estilo visual del proyecto — IBM Carbon Design System con el tema claro cálido "Warm Light". Úsala SIEMPRE antes de escribir JSX con elementos visuales, crear un *.module.scss, elegir un color, un espaciado o una tipografía, o incorporar un componente nuevo de @carbon/react.
---

# IBM Carbon — tema claro cálido ("Warm Light")

## 1. Regla de oro

**Ningún valor visual se escribe a mano.** Ni un hex, ni un `px`, ni un `font-size`.
Todo sale de un token de Carbon. Si un token no existe para lo que necesitas,
probablemente estés diseñando algo que Carbon ya resuelve de otra forma.

```scss
/* ❌ nunca */
.card { background: #f6ede3; padding: 24px; color: #2c211b; font-size: 14px; }

/* ✅ siempre */
@use '@carbon/react/scss/theme' as *;
@use '@carbon/react/scss/spacing' as *;
@use '@carbon/react/scss/type';

.card {
  background-color: $layer-01;
  padding: $spacing-06;
  color: $text-primary;
  @include type.type-style('body-01');
}
```

## 2. Componentes

Usa `@carbon/react`. **Prohibido** instalar MUI, Bootstrap, Chakra, Ant Design,
Tailwind o cualquier otra librería de componentes: rompen el sistema de diseño.

```tsx
import { Button, TextInput, RadioButtonGroup, RadioButton } from '@carbon/react'
```

Antes de crear un componente propio, busca si Carbon ya lo tiene
(`Button`, `TextInput`, `NumberInput`, `Tile`, `Modal`, `Tabs`, `DataTable`,
`Dropdown`, `Toggle`, `InlineNotification`, `Grid`/`Column`…).

**Al usar un componente Carbon por primera vez**, registra su hoja de estilos en
`src/app/styles/index.scss`:

```scss
@use '@carbon/react/scss/components/modal';
```

Nunca `@use '@carbon/react';` completo: multiplica el CSS de ~167 kB a ~970 kB.

## 3. Dónde vive el tema

Un solo archivo: **`src/app/styles/_warm-light-theme.scss`**.
Parte del tema `white` de Carbon y sobrescribe tokens semánticos.
Es el **único** lugar del repositorio donde puede aparecer un color literal.

`src/app/styles/index.scss` es el **único** archivo que emite tema, `@font-face`
y estilos de componentes de Carbon.

### Paleta base (referencia, no para copiar en componentes)

| Rol | Valor |
|---|---|
| Crema de fondo | `#fcf7f1` |
| Superficie / tarjeta | `#f6ede3` |
| Superficie elevada | `#fffdfa` |
| Borde suave | `#e6d5c2` |
| Texto primario (cacao) | `#2c211b` |
| Texto secundario | `#6e5a4b` |
| Acento (terracota) | `#a8480f` |
| Acento hover / active | `#8c3b0c` / `#70300a` |

Contraste verificado AA sobre fondos claros. Si cambias un color del acento,
comprueba que mantenga ≥ 4.5:1 con `text-on-color`.

## 4. Tokens que vas a usar a diario

```scss
@use '@carbon/react/scss/theme' as *;
```

| Necesitas | Token |
|---|---|
| Fondo de página | `$background` |
| Fondo de tarjeta / panel | `$layer-01`, `$layer-02` |
| Fondo de campo de formulario | `$field-01` |
| Borde discreto | `$border-subtle-01` |
| Borde marcado | `$border-strong-01` |
| Texto principal | `$text-primary` |
| Texto de apoyo | `$text-secondary` |
| Texto de ayuda / placeholder | `$text-helper`, `$text-placeholder` |
| Texto sobre color sólido | `$text-on-color` |
| Enlace | `$link-primary` |
| Error / éxito / aviso | `$support-error`, `$support-success`, `$support-warning` |

Los botones ya toman `$button-primary`, `$button-secondary` y `$button-tertiary`
del tema: no los pintes a mano, usa `<Button kind="primary | secondary | tertiary | ghost | danger">`.

## 5. Espaciado

```scss
@use '@carbon/react/scss/spacing' as *;
```

`$spacing-01` (2px) · `02` (4) · `03` (8) · `04` (12) · `05` (16) · `06` (24) ·
`07` (32) · `08` (40) · `09` (48) · `10` (64) · `11` (80) · `12` (96)

Usa `gap` en flex/grid en lugar de márgenes sueltos siempre que puedas.

## 6. Tipografía

IBM Plex Sans, cargada desde `src/app/styles/index.scss`. Mono y Serif están
desactivados a propósito; si necesitas Mono, actívalo ahí, no con un `@font-face` nuevo.

```scss
@use '@carbon/react/scss/type';

.titulo   { @include type.type-style('heading-05'); }
.subtitulo{ @include type.type-style('heading-03'); }
.parrafo  { @include type.type-style('body-01'); }
.etiqueta { @include type.type-style('label-01'); }
```

Escala disponible: `heading-01..07`, `heading-compact-01/02`, `body-01/02`,
`body-compact-01/02`, `label-01/02`, `helper-text-01/02`, `legal-01/02`,
`fluid-heading-*`, `display-01..04`.

## 7. Organización de los estilos

- Un `*.module.scss` **junto** al `.tsx` que lo usa, con el mismo nombre.
- Clases en `camelCase` (`styles.pageHeader`), se consumen como `styles.x`.
- Nada de estilos globales fuera de `src/app/styles/`.
- Para combinar clases usa `cx` de `@/shared/lib`, no concatenación manual.

## 8. Accesibilidad — mínimos no negociables

- Todo `TextInput` lleva `id` y `labelText`.
- Todo `RadioButtonGroup` lleva `legendText` y `name`.
- Los iconos-botón llevan `iconDescription` o `aria-label`.
- No elimines el outline de foco: `$focus` es parte del tema.
- Un `<h1>` por página; no saltes niveles de encabezado.

## 9. Revisión rápida

- [ ] ¿Hay algún hex fuera de `_warm-light-theme.scss`? → error.
- [ ] ¿Hay `px` sueltos donde cabía un `$spacing-*`? → error.
- [ ] ¿Hay `font-size`/`font-weight` a mano en vez de `type-style()`? → error.
- [ ] ¿El componente Carbon nuevo está registrado en `app/styles/index.scss`?
- [ ] ¿`npm run build` sigue por debajo de ~200 kB de CSS?
