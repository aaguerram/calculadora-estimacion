# Modelo de estimación — propuesta

> Estado: **propuesta para validar**. Los coeficientes son semillas iniciales,
> no verdades. El valor del modelo no está en los números de arranque sino en el
> **ciclo de calibración** de la sección 6.

## 1. Qué responde la calculadora

A partir de: *features* + *componentes que intervienen* + *integraciones* + *drivers del proyecto*,
produce tres respuestas y su nivel de confianza:

1. **Esfuerzo** en horas y en meses-hombre (1 MH = 6 h/día × 20 días = **120 h**).
2. **Cantidad óptima de personas** y su reparto por rol/componente.
3. **Duración en meses**, con la frontera completa tiempo↔equipo↔costo.

La pregunta que de verdad contesta no es "¿cuánto cuesta?" sino
**"¿cuál es el punto de la curva donde dejar de agregar gente?"**.

---

## 2. Unidad de medida: el par *(feature × componente)*

No se estima "una feature". Se estima **cada feature en cada componente que toca**,
porque el mismo requerimiento cuesta muy distinto en un BFF que en un micro core.

```
h(feature, componente) = HorasBase(tipoComponente)
                       × Complejidad(feature, componente)
                       × Stack(componente)
```

### 2.1 Horas base por tipo de componente (complejidad media)

Incluye análisis técnico, código y pruebas unitarias. **No** incluye QA, gestión ni DevOps.

| Tipo de componente | Horas base | Máx. devs útiles* | Racional |
|---|---:|:---:|---|
| Front Angular | 40 | 5 | Componentes, formularios, estado, rutas, tests |
| BFF | 20 | 3 | Agregación y mapeo; poca regla propia |
| Micro de experiencia | 28 | 3 | Orquestación, resiliencia, timeouts, fallbacks |
| Micro de negocio | 44 | 3 | Reglas, validaciones, persistencia propia |
| Micro core | 60 | 3 | Dueño del dato, transaccionalidad, idempotencia, NFR altos |
| Monolito .NET Core | 52 | 3 | Acoplamiento moderado, testeable |
| Monolito .NET Framework | 68 | 2 | Alto acoplamiento, regresión cara, CI limitado |

\* *Máx. devs útiles* = cuántas personas caben en ese código sin estorbarse.
Es el parámetro que hace que el modelo tenga un límite real de paralelización.

### 2.2 Multiplicador de complejidad

| Nivel | Factor | Criterio objetivo |
|---|---:|---|
| Muy baja | 0.4 | CRUD sin reglas, pantalla de solo lectura |
| Baja | 0.7 | 1–2 reglas, sin estado compartido |
| Media | 1.0 | Flujo estándar, validaciones, persistencia |
| Alta | 1.6 | Máquina de estados, concurrencia, reglas cruzadas |
| Muy alta | 2.2 | Transaccionalidad distribuida, compensaciones, auditoría regulatoria |

Se declara **por par feature-componente**, con el nivel de la feature como valor por defecto.
Una transferencia puede ser "muy alta" en el core y "media" en el front.

### 2.3 Factor de stack

| Stack | Factor |
|---|---:|
| .NET 8 / .NET Core | 1.00 |
| .NET Framework 4.x | 1.30 |
| Angular 15+ | 1.00 |
| Angular ≤ 12 | 1.20 |

### 2.4 Costo de arranque por componente nuevo

Se suma una sola vez por componente greenfield: scaffolding, pipeline, observabilidad, plantilla de pruebas.

| Front Angular | BFF | Micro experiencia | Micro negocio | Micro core |
|---:|---:|---:|---:|---:|
| 60 h | 24 h | 32 h | 40 h | 56 h |

---

## 3. Integraciones

Se estiman aparte y se **imputan al componente que las consume** (para que entren en el stream correcto).

```
h(integración) = Base(complejidad)
               × 1.4  si la contraparte es externa a la organización
               × 1.3  si NO hay sandbox ni mock disponible
               × (1 + 0.25 × (nº de features que la usan − 1))
```

| Complejidad | Base | Ejemplo |
|---|---:|---|
| Baja | 8 h | REST interno, contrato estable, sandbox |
| Media | 24 h | REST externo, OAuth2, mapeo no trivial |
| Alta | 56 h | SOAP/legacy, archivos, colas, contrato inestable |
| Muy alta | 96 h | Core bancario, mainframe, certificación con tercero |

El `×1.4` externo y el `×1.3` sin sandbox son **el factor que más se subestima** en la práctica:
no es código, es tiempo de coordinación, bloqueos y reintentos.

---

## 4. Drivers del proyecto — **aditivos, no multiplicativos**

```
FactorProyecto = 1 + Σ δᵢ
```

| Driver | Favorable | Nominal | Adverso |
|---|---:|---:|---:|
| Madurez del equipo en el dominio | −0.10 | 0.00 | +0.20 |
| Claridad de los requisitos | −0.10 | 0.00 | +0.20 |
| Exigencia no funcional (seguridad, performance, DR) | 0.00 | +0.05 | +0.15 |
| Deuda técnica del entorno existente | 0.00 | +0.06 | +0.18 |
| Dependencia de terceros | 0.00 | +0.05 | +0.15 |

**Por qué aditivos:** cinco drivers multiplicativos en rango 0.85–1.35 producen factores
de 2.0× o 4.4× con combinaciones perfectamente normales. En el primer prototipo esto
infló el proyecto de ejemplo a 137 MH; con drivers aditivos el mismo proyecto da 94 MH.
Los factores multiplicativos compuestos son la causa número uno de estimaciones
paramétricas que nadie se cree.

---

## 5. De horas a compromiso: Monte Carlo, no un número

Cada ítem lleva tres puntos derivados de su complejidad (asimétricos a la derecha,
porque el software se pasa mucho más de lo que se adelanta):

| Complejidad | Optimista | Pesimista |
|---|---:|---:|
| Muy baja | 0.85× | 1.25× |
| Baja | 0.85× | 1.30× |
| Media | 0.80× | 1.50× |
| Alta | 0.70× | 1.90× |
| Muy alta | 0.65× | 2.30× |
| Integraciones | 0.70× | 2.20× |

**Simulación**: 20 000 corridas, distribución triangular por ítem,
**más un factor de riesgo común lognormal (σ = 0.18)** aplicado a toda la corrida.

> El riesgo común es imprescindible. Sumar 60 ítems independientes hace que el
> teorema central del límite colapse la varianza y produzca una banda P50–P90
> ridículamente estrecha (±3 %). En la realidad los sobrecostes están correlacionados:
> si los requisitos son malos, lo son para todas las features a la vez.

**Se compromete el P80**, nunca el P50. El P50 es, por definición, la estimación que
se incumple la mitad de las veces.

### Overheads no-desarrollo

Sobre el esfuerzo de desarrollo ya ajustado:

| Concepto | % |
|---|---:|
| Análisis y refinamiento | 15 % |
| QA (diseño, ejecución, regresión) | 25 % |
| DevOps, CI/CD, ambientes | 8 % |
| Gestión, ceremonias, coordinación | 12 % |
| Documentación y paso a producción | 5 % |
| **Total** | **×1.65** |

Equivale a decir que el desarrollo puro es el ~60 % del proyecto.

---

## 6. Equipo óptimo y duración — el núcleo del modelo

### 6.1 Por qué el modelo ingenuo no sirve

La formulación clásica "sobrecarga = canales de comunicación = n(n−1)/2" tiene un
óptimo en `n* = √(2/γ)`, **independiente del tamaño del proyecto**. Eso implicaría
que un proyecto de 20 MH y uno de 500 MH quieren el mismo equipo. Es falso.

### 6.2 La restricción real: los componentes

El límite de paralelización **ya está en los datos de entrada**. Cada componente es
un *stream* con un máximo de personas útiles. La duración del proyecto es la de su
**stream más largo**, no la del esfuerzo total dividido por la gente.

```
Duración(componente c, m devs) = MH(c) × (1 + γ·m(m−1)/2) / m        γ = 0.02
Ruta crítica                   = máx sobre c de Duración(c, m_c)
```

### 6.3 El lazo de realimentación (ley de Brooks)

Más gente en el proyecto → más coordinación → más esfuerzo → hace falta más gente.
Se resuelve por punto fijo:

```
Coordinación(N) = 1 + δ · N(N−1)/2           δ = 0.0015
Onboarding      = 0.4 MH por persona adicional
```

| N | Coordinación |
|---:|---:|
| 9 | ×1.05 |
| 13 | ×1.12 |
| 22 | ×1.35 |
| 30 | ×1.65 |

### 6.4 Cálculo final

```
1. Para cada componente c: MH(c) a nivel P80
2. Fijar un t_objetivo
3. Para cada c: m_c = mínimo m tal que Duración(c,m) ≤ t_objetivo, con m ≤ cap(c)
4. N = Σ m_c + QA + DevOps + Lead/BA   (cada rol dimensionado por su propio esfuerzo / t)
5. Recalcular con Coordinación(N) hasta punto fijo
6. Duración total = arranque serial + t_dev + estabilización
7. MH facturables = N × Duración total + onboarding
8. Barrer t_objetivo → frontera completa
```

**Arranque serial** = esfuerzo de bootstrap de los componentes nuevos ejecutado por
un núcleo de 2 personas. **Estabilización** = 10 % del desarrollo (hardening, UAT, despliegue).

---

## 7. Ejemplo trabajado (validado con prototipo ejecutable)

12 features · 7 componentes (Angular, BFF, micro experiencia, 2 micro negocio,
micro core, monolito .NET Framework) · 6 integraciones · requisitos poco claros ·
legacy presente.

**Esfuerzo**

| | |
|---|---:|
| Desarrollo bruto | 3 380 h |
| Factor de proyecto | ×1.45 |
| Desarrollo nominal | 40.8 MH |
| Monte Carlo P50 / P80 / P90 | 49.0 / 57.3 / 62.1 MH |
| **Total proyecto (P80 × 1.65)** | **94.5 MH — 11 336 h** |

**Streams**

| Componente | MH | Máx. devs | Duración mínima |
|---|---:|:---:|---:|
| micro core | 12.9 | 3 | 4.6 m ← ruta crítica |
| front Angular | 11.1 | 5 | 2.7 m |
| monolito .NET Framework | 8.1 | 2 | 4.1 m |
| micro negocio A | 7.6 | 3 | 2.7 m |
| BFF | 7.2 | 3 | 2.5 m |
| micro experiencia | 7.1 | 3 | 2.5 m |
| micro negocio B | 3.2 | 3 | 1.1 m |

**Frontera tiempo / equipo / costo**

| Personas | Duración | MH facturables | Coordinación |
|---:|---:|---:|---:|
| 28.5 | 9.3 m | 275.0 | ×1.59 |
| 24.5 | 8.5 m | 217.1 | ×1.43 |
| **22.5** | **8.1 m** | 191.3 | ×1.36 |
| 20.0 | 9.3 m | 193.2 | ×1.28 |
| 15.5 | 10.5 m | 169.2 | ×1.17 |
| **13.5** | **11.3 m** | **157.4** | ×1.13 |
| 11.5 | 14.6 m | 172.0 | ×1.09 |
| 9.5 | 16.3 m | 158.7 | ×1.06 |

**La curva se dobla hacia atrás.** Pasar de 22.5 a 28.5 personas hace el proyecto
**1.2 meses más lento y 44 % más caro**. Ese es el tramo que la calculadora debe
pintar en rojo y llamar *zona de rendimientos negativos* — es la hipótesis del
usuario, hecha número.

**Respuesta**

> **13–14 personas · 11.3 meses · 157 MH facturables.**
> Ir a 22.5 personas cuesta **22 % más de esfuerzo para ganar 3.2 meses**.
> Es una decisión de negocio, no técnica: la calculadora la pone sobre la mesa con precio.

**Forma del equipo óptimo**

| micro core | front | legacy | neg-A | BFF | experiencia | neg-B | QA | DevOps | Lead/BA |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 2 | 2 | 1 | 1 | 1 | 1 | 1 | 2 | 0.5 | 2 |

---

## 8. Cómo se valida el modelo

Esto es lo que convierte la calculadora en algo defendible ante un cliente.

### 8.1 Triangulación — tres métodos, un veredicto
La calculadora estima el mismo proyecto por tres vías independientes:

1. **Bottom-up** (suma de pares feature×componente) — el modelo descrito arriba.
2. **Por analogía** — proyectos históricos cerrados con perfil similar (mismo tipo de
   componentes y rango de features), escalados por número de features.
3. **Top-down paramétrico** — COCOMO II sobre el tamaño estimado:
   `TDEV = 3.67 × MH^0.32`, equipo = MH / TDEV.

Si los tres difieren más de **±25 %**, la estimación no se emite: hay una
inconsistencia en los datos de entrada que hay que resolver primero.

### 8.2 Back-testing obligatorio antes de usarla
Cargar **5 proyectos cerrados** con sus datos reales y correrlos por el modelo.
Métricas objetivo de la literatura de estimación:

| Métrica | Definición | Objetivo |
|---|---|---|
| MMRE | media de \|real − estimado\| / real | **< 25 %** |
| PRED(25) | % de proyectos con error < 25 % | **> 75 %** |
| Sesgo | media de (estimado − real) / real | **\|sesgo\| < 10 %** |

Si no se cumplen, se **recalibran los coeficientes** (no se usa el modelo igual).

### 8.3 Calibración continua
Cada proyecto cerrado alimenta la base histórica. La calculadora recalcula por
mínimos cuadrados los coeficientes que más error explican, en este orden:

1. Horas base por tipo de componente (lo que más varía entre organizaciones).
2. Factor de stack.
3. σ del riesgo común (ensancha o estrecha la banda P80).
4. γ y δ de comunicación (se derivan comparando equipos reales de distinto tamaño).

### 8.4 Detectores de estimación enferma
Alertas automáticas antes de emitir el resultado:

| Señal | Diagnóstico probable |
|---|---|
| Integraciones > 40 % del esfuerzo | Es un proyecto de integración, no de desarrollo: revisar enfoque |
| QA < 15 % del total | Estimación incompleta |
| Duración < 75 % de la nominal COCOMO | **Zona imposible** — ningún equipo lo ha logrado |
| Más de 3 devs en un mismo micro | Excede la concurrencia útil: no acelera |
| Feature "muy alta" sin integraciones | Probable error de clasificación |
| Banda P90/P50 < 1.15 | Falta riesgo común: la incertidumbre está subestimada |
| Ratio front/back fuera de 0.4–1.5 | Falta un componente en el alcance |

### 8.5 Trazabilidad
Todo resultado debe poder abrirse hasta el par feature×componente que lo originó,
con los factores aplicados visibles. Una estimación que no se puede auditar
no se puede defender en una negociación.

---

## 9. Implementación en la arquitectura FSD del proyecto

| Capa | Slice | Contenido |
|---|---|---|
| `entities` | `feature-item` | Feature, complejidad, componentes que toca |
| | `component` | Tipo, stack, greenfield, cap de devs |
| | `integration` | Complejidad, contraparte, sandbox, usos |
| | `project-driver` | Los 5 drivers aditivos |
| | `estimation-model` | Tablas de coeficientes **calibrables** + tipos |
| | `estimate` | Resultado: bandas, streams, frontera |
| | `historical-project` | Proyectos cerrados para calibrar |
| `features` | `run-estimation` | **El motor.** Única capa que puede leer todas las entities |
| | `simulate-risk` | Monte Carlo + riesgo común |
| | `plan-team` | Punto fijo de coordinación y frontera tiempo/equipo |
| | `manage-features` / `manage-components` / `manage-integrations` | ABM de entradas |
| | `calibrate-model` | Back-testing, MMRE, PRED(25), ajuste de coeficientes |
| | `compare-scenarios` | Escenarios lado a lado |
| | `export-estimate` | Salida auditable |
| `widgets` | `scope-table`, `driver-panel`, `effort-breakdown`, `confidence-band`, `team-frontier-chart`, `stream-gantt`, `sanity-checks-panel` | Composición |
| `pages` | `alcance`, `estimacion`, `equipo`, `calibracion` | Pantallas |
| `shared` | `lib/statistics` | Triangular, lognormal, percentiles — genérico, sin dominio |

El motor va en `features/run-estimation/model/` como **reducer/funciones puras**:
es la pieza que hay que poder testear con `expect(estimar(entrada)).toEqual(...)`
sin montar React. Es también la que se ejecuta en el back-testing.

---

## 10. Decisiones abiertas

1. **Persistencia**: ¿los proyectos y el histórico viven en localStorage, en un backend
   propio o en un archivo importable/exportable? Sin histórico no hay calibración (§8.3).
2. **Nivel de compromiso**: ¿se emite P80 siempre, o configurable por tipo de contrato
   (precio fijo → P90, time & materials → P50)?
3. **Multi-equipo**: si el proyecto excede ~20 personas, ¿se modela como varios squads
   con su propia sobrecarga inter-squad, o se declara fuera de rango y se parte el alcance?
4. **Coeficientes iniciales**: ¿se arranca con los de este documento, o se hace el
   back-testing de §8.2 con proyectos reales antes de la primera emisión?
