# Cómo cargar tus proyectos cerrados

El modelo trae coeficientes de arranque que son **suposiciones**. Lo que los
convierte en algo medido es tu histórico. Esta guía explica cómo cargarlo.

Todo se hace desde **Histórico** en el menú. No hace falta tocar la base ni escribir SQL.

---

## Lo primero: dos niveles de utilidad

| Lo que cargas | Para qué sirve |
|---|---|
| Cifras reales, **sin** alcance | Registro: cuánto nos desviamos históricamente. No recalibra nada. |
| Cifras reales **con** el alcance | Recalibra el modelo: se re-estima el proyecto con los coeficientes de hoy y se compara con lo que costó. |

La pantalla lo marca por fila: `calibra` o `solo registro`.

> **La diferencia importa.** Sin el alcance no se puede volver a estimar el
> proyecto, y sin volver a estimarlo no hay forma de saber qué coeficiente está
> mal. El registro sirve para hablar de tendencias; el alcance, para corregir.

---

## Cuántos hacen falta

| | |
|---|---|
| **Mínimo para calibrar** | 3 con alcance |
| **Recomendable** | 5 con alcance |
| Por debajo de 3 | Ninguna métrica es creíble, y la app no deja aplicar |

Es más útil tener 5 proyectos bien reconstruidos que 20 a medias.

---

## Camino 1 — Proyectos que arrancan ahora

El más fácil, y el que deberías adoptar como rutina:

1. **Al arrancar** el proyecto, cárgalo en *Ingresar proyecto*: componentes,
   features con sus elementos, integraciones y drivers.
2. Trabaja normal.
3. **Al cerrarlo**, entra a su pantalla de alcance y usa
   *«Archivar para calibrar»* con las cifras reales.

La foto del alcance se guarda sola, y sirve para calibrar sin más trabajo.

---

## Camino 2 — Proyectos ya cerrados

Aquí hay arqueología. Dos opciones según cuánto quieras invertir:

### 2a. Solo el registro (5 minutos por proyecto)

*Histórico → Cargar un proyecto cerrado*. Rellena seis campos y listo.
Queda como `solo registro`.

### 2b. Con alcance, para que recalibre (30–60 minutos por proyecto)

1. Ve a *Ingresar proyecto* y reconstruye el alcance como era.
2. Al llegar a *Revisión*, abre el proyecto y usa *Archivar para calibrar*.

O, si prefieres no teclear, pégalo en JSON desde
*Histórico → Cargar varios de golpe*. El formato está más abajo.

---

## De dónde sacar cada cifra

| Campo | Dónde mirar | Cuidado con |
|---|---|---|
| `mhReales` | Horas imputadas ÷ horas de un mes-hombre (6 × 20 = 120) | Incluye **todo**: análisis, QA, DevOps y gestión. Si solo cuentas desarrollo, el modelo aprenderá a subestimar. |
| `mhEstimadas` | Lo que se comprometió en su día | Es registro histórico; la calibración no lo usa. |
| `mesesReales` | Meses de calendario, arranque a entrega | No descuentes parones: si el proyecto estuvo parado, eso también es duración real. |
| `personasReales` | Tamaño **medio** del equipo | Cuenta QA, DevOps y gestión, no solo devs. Si el equipo creció, usa el promedio ponderado. |
| `cerradoEn` | Fecha de entrega, `AAAA-MM-DD` | |

> El error más común es **medir `mhReales` solo del desarrollo**. El modelo
> aplica un ×1.65 de overheads por su cuenta; si tu cifra real ya viene sin
> ellos, la calibración bajará los coeficientes hasta dejarlos mal.

---

## El formato para cargar varios

Una lista JSON. Los campos de cabecera son obligatorios; `alcance` es opcional
pero es lo que hace que el proyecto recalibre.

```json
[
  {
    "nombre": "Portal de clientes v1",
    "cerradoEn": "2025-03-31",
    "mhEstimadas": 48.5,
    "mhReales": 61.2,
    "mesesReales": 7.5,
    "personasReales": 8,
    "alcance": {
      "nombre": "Portal de clientes v1",
      "jornada": { "horasDia": 6, "diasMes": 20 },
      "nivelCompromiso": 80,
      "componentes": [
        { "id": "web", "nombre": "Portal", "tipo": "front-angular", "stack": "angular17", "esNuevo": true },
        { "id": "core", "nombre": "Core", "tipo": "micro-core", "stack": "net8", "esNuevo": false }
      ],
      "features": [
        {
          "id": "f1",
          "nombre": "Consulta de saldos",
          "complejidad": "m",
          "categoria": "pantalla",
          "toca": [{ "componenteId": "web" }, { "componenteId": "core" }],
          "elementos": [{ "elemento": "pant.listado", "cantidad": 2, "complejidad": "m" }]
        }
      ],
      "integraciones": [
        {
          "id": "i1",
          "nombre": "Core bancario",
          "complejidad": "a",
          "componenteDuenioId": "core",
          "esExterna": false,
          "tieneSandbox": true,
          "usos": 2
        }
      ],
      "drivers": [
        { "clave": "claridad-requisitos", "etiqueta": "Claridad de los requisitos", "delta": 0.15 }
      ]
    }
  }
]
```

El botón **«Pegar un ejemplo del formato»** te deja exactamente esto en el cuadro
de texto, listo para editar.

### Valores admitidos

| Campo | Valores |
|---|---|
| `tipo` | `front-angular` · `bff` · `micro-experiencia` · `micro-negocio` · `micro-core` · `monolito-netcore` · `monolito-netfx` · `componente-3gl` |
| `stack` | `net8` · `netcore` · `netfx` · `angular17` · `angular12` · `cobol` · `otro-3gl` |
| `complejidad` | `mb` · `b` · `m` · `a` · `ma` |
| `categoria` | `pantalla` · `reporte` · `proceso-batch` · `servicio-api` · `integracion` · `evento` · `migracion` · `motor-reglas` · `componente-3gl` |
| `elemento` | Las claves de `/fuentes`… mejor: consulta `GET /elemento_feature?select=clave,nombre` |
| `nivelCompromiso` | `50` · `80` · `90` |

Los `id` de componentes y features son **tuyos**: solo tienen que ser
consistentes dentro del mismo alcance (una feature referencia el `id` de un
componente de esa misma lista).

### Qué pasa si algo está mal

Pulsa **Revisar** antes de cargar. Te dice fila por fila qué falla:

```
fila 2 · cerradoEn: formato esperado AAAA-MM-DD
fila 3 · mhReales: «mucho» no es un número
fila 5 · alcance: necesita al menos un componente y una feature para poder recalibrar
```

Nada se escribe hasta que pulsas *Cargar*, y solo entran las filas válidas.
Los decimales con coma (`61,2`) se aceptan, porque es como salen de Excel.

---

## Después de cargar

Ve a **Calibración**. Verás:

- **MMRE, PRED(25) y sesgo** del modelo actual contra tu histórico
- El **error por proyecto**, para detectar cuál está mal capturado
- La **cobertura de puntos función**: si pasa del 20 %, también se calibra
  `pf.horas-por-punto`
- Una propuesta de coeficientes nuevos, que **solo se puede aplicar si baja el MMRE**

Si el MMRE sale por encima del 25 % o el sesgo por encima del 10 %, el modelo
todavía no es apto. La app lo dice y explica por qué.

---

## Qué NO cargar aquí

Los datasets públicos de `/fuentes` (China, Desharnais, SiP…) son **referencia**,
no tu histórico. Están en otro esquema a propósito: acotan rangos y validan el
método, pero la productividad varía hasta 3.7× entre organizaciones, así que
calibrar con datos ajenos es peor que no calibrar.
