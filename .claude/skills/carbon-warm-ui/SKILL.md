---
name: carbon-warm-ui
description: Reglas obligatorias de estilo visual del proyecto — IBM Carbon Design System con el tema claro cálido construido sobre la paleta de marca de Produbanco. Úsala SIEMPRE antes de escribir JSX con elementos visuales, crear un *.module.scss, elegir un color, un espaciado o una tipografía, o incorporar un componente nuevo de @carbon/react.
---

# IBM Carbon sobre la marca Produbanco (tema claro cálido)

## 0. Las dos reglas que no se negocian

1. **El sistema de diseño es IBM Carbon.** Componentes, rejilla, tipografía y
   espaciado salen de `@carbon/react`.
2. **La paleta es la de Produbanco.** Ningún color de marca, estado o gráfico
   puede inventarse: todos vienen del GDS de Produbanco (§3). Lo único que no
   es de marca son los neutros cálidos hueso/arena, que dan al tema su
   temperatura clara y cálida.

Las dos se verifican en CI con `npm run lint:marca`, que forma parte de
`npm run check`. **No se desactiva la regla: se corrige el color.**

## 1. Regla de oro

**Ningún valor visual se escribe a mano.** Ni un hex, ni un `px`, ni un `font-size`.
Todo sale de un token de Carbon. Si un token no existe para lo que necesitas,
probablemente estés diseñando algo que Carbon ya resuelve de otra forma.

```scss
/* ❌ nunca */
.card { background: #f3efe5; padding: 24px; color: #1e1e1e; font-size: 14px; }

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

Nunca `@use '@carbon/react';` completo: multiplica el CSS por seis.

## 3. La paleta Produbanco

Fuente: el design system público de Produbanco
(`produbanco.com.ec/css/RichTextGDSColors.css` y `/assets/plugins/GDS/css/`).
**Estos valores son la ley.** No se aclaran, no se oscurecen, no se "ajustan un
poco". Si necesitas un tono intermedio, usa el escalón que ya existe o mézclalo
con `color.mix()` a partir de uno de marca — nunca escribas un hex nuevo.

### Verde primario — el color de la marca

| Escalón | Hex | Uso en el tema |
|---|---|---|
| 100 | `#002a18` | Botón activo, fondo inverso, hover de enlace |
| 80 | `#003f24` | Botón hover, enlace secundario |
| **70** | **`#00693c`** | **Marca**: botón primario, enlace, foco, borde interactivo |
| 60 | `#338763` | Verde medio |
| 40 | `#66a58a` | Verde apagado |
| 30 | `#99c3b1` | Tinte |
| 20 | `#cce1d8` | Selección hover, fondo de tag verde |
| 10 | `#e7f7ee` | Fila/tarjeta seleccionada |

### Verde secundario (lima) — acento, nunca texto

`#2a4c10` · `#549820` · **`#69be28`** · `#87cb53` · `#a5d87e` · `#c3e5a9` · `#d4ecc1` · `#eef7e6`

El lima es acento y resaltado (`$highlight`). **No se usa para texto ni para
iconos sobre fondo claro**: no llega a 4.5:1.

### Grises de marca — texto e iconos

`#1e1e1e` (texto primario) · `#3f3f3f` (botón secundario) · `#5d5d5d` (texto
secundario y de ayuda) · `#717171` (placeholder) · `#9a9a9a` · `#949494` ·
`#c4c4c4` · `#d9d9d9` · `#e9e9e9` · `#f5f5f5`

### Estados

| Rol | Hex | Token |
|---|---|---|
| Error | `#c40000` | `$support-error`, `$text-error` |
| Éxito | `#0f804f` | `$support-success` |
| Aviso | `#e87300` | `$support-warning` |
| Información | `#0f4dbc` | `$support-info` |

### Acentos de dato — familia `*Graph` del GDS (series, gráficos, tags)

El GDS publica cinco acentos de dato, y **cada uno trae su rampa oficial de
cuatro pasos**. Un tono más claro de una serie no se calcula: se coge el paso.

| Acento | 80 (base) | 70 | 40 | 20 |
|---|---|---|---|---|
| Morado | `#80379b` | `#a069b4` | `#bf9bcd` | `#dfcde6` |
| Rosa | `#ea5084` | `#ef7ca2` | `#f4a7c1` | `#fad3e0` |
| Turquesa | `#00a6a0` | `#40bcb8` | `#80d2cf` | `#bfe9e7` |
| Naranja | `#e87300` | `#ee9740` | `#f4b880` | `#f9dcbf` |
| Azul rey | `#0f4dbc` | `#4b79cd` | `#87a7dd` | `#c3d2ee` |

En SCSS son `$pb-morado-80`, `$pb-rosa-40`, `$pb-azul-20`… El aviso y la
información del tema (`$support-warning`, `$support-info`) son el paso 80 de
naranja y azul rey: son el mismo color, no una coincidencia.

Para una serie de datos, empieza siempre por el verde primario 70 y sigue por
esta lista antes de repetir familia. Para variantes dentro de una familia
(apilados, mapas de calor) baja por la rampa: 80 → 70 → 40 → 20.

### Neutros cálidos — la parte "clara y cálida"

Lo único del tema que no sale del GDS. Sustituyen a los grises fríos de Carbon
(`#f4f4f4`, `#e0e0e0`…), que junto al verde de marca se ven apagados.

| Rol | Hex |
|---|---|
| Superficie elevada (`$layer-02`, `$field-02`) | `#fffdf8` |
| Fondo de página (`$background`) | `#faf7f0` |
| Tarjeta / panel (`$layer-01`, `$field-01`) | `#f3efe5` |
| Superficie hundida / hover (`$layer-03`) | `#ebe6d9` |
| Borde discreto (`$border-subtle-*`) | `#ddd7c8` |
| Borde marcado (`$border-strong-01`) | `#c4bcab` |

## 4. Dónde vive el tema

Un solo archivo: **`src/app/styles/_warm-light-theme.scss`**.
Parte del tema `white` de Carbon y sobrescribe tokens semánticos.
Es el **único** lugar del repositorio donde puede aparecer un color literal,
y solo puede contener colores de §3.

`src/app/styles/index.scss` es el **único** archivo que emite tema, `@font-face`
y estilos de componentes de Carbon.

Los *component tokens* de Carbon (`button-*`, `tag-*`, `notification-*`) se
emiten **después** del mapa de tema, así que no basta con ponerlos en
`$overrides`: van en `$component-token-overrides` y se registran con
`theme.add-component-tokens()` después de importar los partials.

## 5. Tokens que vas a usar a diario

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
| Borde/estado interactivo | `$border-interactive`, `$interactive`, `$focus` |
| Texto principal | `$text-primary` |
| Texto de apoyo | `$text-secondary` |
| Texto de ayuda / placeholder | `$text-helper`, `$text-placeholder` |
| Texto sobre color sólido | `$text-on-color` |
| Enlace | `$link-primary` |
| Fila seleccionada | `$layer-selected-01`, `$background-selected` |
| Error / éxito / aviso / info | `$support-error`, `$support-success`, `$support-warning`, `$support-info` |

Los botones ya toman `$button-primary`, `$button-secondary` y `$button-tertiary`
del tema: no los pintes a mano, usa `<Button kind="primary | secondary | tertiary | ghost | danger">`.

## 6. Espaciado

```scss
@use '@carbon/react/scss/spacing' as *;
```

`$spacing-01` (2px) · `02` (4) · `03` (8) · `04` (12) · `05` (16) · `06` (24) ·
`07` (32) · `08` (40) · `09` (48) · `10` (64) · `11` (80) · `12` (96)

Usa `gap` en flex/grid en lugar de márgenes sueltos siempre que puedas.

## 7. Tipografía

IBM Plex Sans, cargada desde `src/app/styles/index.scss`. Mono y Serif están
desactivados a propósito; si necesitas Mono, actívalo ahí, no con un `@font-face` nuevo.

> Produbanco usa Nunito Sans en su web pública. Aquí **no** se cambia la fuente:
> la tipografía es la de Carbon (IBM Plex Sans) y la marca entra por el color.
> Cambiar de familia rompería la escala tipográfica de Carbon entera.

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

## 8. Organización de los estilos

- Un `*.module.scss` **junto** al `.tsx` que lo usa, con el mismo nombre.
- Clases en `camelCase` (`styles.pageHeader`), se consumen como `styles.x`.
- Nada de estilos globales fuera de `src/app/styles/`.
- Para combinar clases usa `cx` de `@/shared/lib`, no concatenación manual.

## 9. Accesibilidad — mínimos no negociables

- Contraste AA (4.5:1) para todo texto. Verificado: `#00693c` sobre hueso da
  6.8:1; `#1e1e1e` sobre `#faf7f0` da ~16:1. Si tocas un color, recalcula.
- El lima `#69be28` **nunca** lleva texto encima ni es texto.
- Todo `TextInput` lleva `id` y `labelText`.
- Todo `RadioButtonGroup` lleva `legendText` y `name`.
- Los iconos-botón llevan `iconDescription` o `aria-label`.
- No elimines el outline de foco: `$focus` (verde de marca) es parte del tema.
- Un `<h1>` por página; no saltes niveles de encabezado.

## 10. Revisión rápida

- [ ] `npm run lint:marca` pasa.
- [ ] ¿Hay algún hex fuera de `_warm-light-theme.scss`? → error.
- [ ] ¿Hay un hex dentro del tema que no esté en §3? → error.
- [ ] ¿Hay `px` sueltos donde cabía un `$spacing-*`? → error.
- [ ] ¿Hay `font-size`/`font-family` a mano en vez de `type-style()`? → error.
- [ ] ¿El componente Carbon nuevo está registrado en `app/styles/index.scss`?
- [ ] ¿El CSS de `npm run build` no ha crecido? Hoy son ~328 kB (33 kB gzip);
      un salto grande significa que alguien importó `@carbon/react` entero.
