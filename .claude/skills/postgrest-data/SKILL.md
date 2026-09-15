---
name: postgrest-data
description: Reglas de acceso a datos del proyecto — PostgREST sobre Postgres on-prem, sin backend propio. Úsala SIEMPRE antes de crear o modificar un segmento api/ de una entity, escribir SQL en db/init/, tocar políticas RLS, roles o el cliente de shared/api. Cubre por qué la seguridad vive en Postgres y no en React.
---

# Acceso a datos — PostgREST sobre Postgres on-prem

## 1. El principio

**No hay backend que escribir.** PostgREST genera la API REST a partir del esquema
`estimacion`. Por lo tanto:

> **El diseño del esquema ES el diseño de la API.**
> Una columna nueva es un campo nuevo del endpoint. Una vista nueva es un endpoint nuevo.

Y su corolario:

> **La seguridad vive en Postgres, no en React.**
> PostgREST no tiene lógica de autorización. Si una tabla no tiene RLS, está abierta
> a cualquiera que tenga un token válido. No existe "lo valido en el front".

## 2. Lo que nunca se hace

- ❌ Poner una cadena de conexión, usuario o clave de Postgres en el código del cliente.
  Todo lo que llega al navegador es público: `view-source` y ahí está.
- ❌ Usar `pg`, `postgres.js` o `@neondatabase/serverless` desde React.
- ❌ Confiar en validación del formulario como control de seguridad. El formulario
  es ergonomía; la regla dura va en un `CHECK`, un trigger o una policy.
- ❌ Crear una tabla sin `ENABLE ROW LEVEL SECURITY`.
- ❌ Crear una vista sin `WITH (security_invoker = true)`: por defecto corre como su
  dueño y **se salta el RLS** de las tablas base.

## 3. Roles

| Rol | Quién es | Puede |
|---|---|---|
| `authenticator` | El usuario con el que PostgREST se conecta | Nada por sí mismo; hace `SET ROLE` según el claim `role` del JWT |
| `web_anon` | Petición **sin** token | `SELECT` sobre `modelo_coeficiente` |
| `estimador` | Petición con token válido | CRUD de proyectos de **su** organización |
| `calibrador` | Token con `role: calibrador` | Escribir coeficientes e histórico |

`owner_id` y `org_id` **nunca** vienen del cuerpo de la petición: los pone un
trigger a partir de los claims del JWT.

## 4. Trampa de permisos por columna

Un `REVOKE ... (columna)` **no recorta** un `GRANT` a nivel de tabla. Esto no protege nada:

```sql
GRANT INSERT ON estimacion.proyecto TO estimador;          -- tabla completa
REVOKE INSERT (owner_id) ON estimacion.proyecto FROM estimador;  -- ❌ no hace nada
```

Hay que retirar el permiso de tabla y volver a darlo columna por columna:

```sql
REVOKE INSERT, UPDATE ON estimacion.proyecto FROM estimador;
GRANT INSERT (nombre, cliente, horas_dia, dias_mes, nivel_compromiso, notas)
  ON estimacion.proyecto TO estimador;
```

Sin esto PostgREST responde `201` aceptando el campo prohibido y el trigger lo
sobrescribe en silencio: queda seguro pero indetectable. Con esto responde `403`.

## 4.bis Trampa del upsert parcial

`Prefer: resolution=merge-duplicates` **no** es un UPDATE: Postgres valida la
tupla del INSERT **antes** de resolver el conflicto. Un upsert que omita una
columna `NOT NULL` falla con `23502`, aunque la fila ya exista.

```ts
// ❌ 400 · null value in column "unidad" violates not-null constraint
{ clave: 'base.micro-core', valor: 78.82 }

// ✅ la fila completa, aunque solo cambie `valor`
{ clave: 'base.micro-core', valor: 78.82, unidad: 'horas', descripcion: '…' }
```

Si solo quieres tocar unas columnas de una fila existente, usa `PATCH`, no upsert.

## 5. Dónde va el código de datos (FSD)

```
shared/api/           Cliente HTTP genérico. NO conoce el dominio.
  postgrest.ts          fetch + Authorization + traducción de errores
  token-store.ts        el token vive aquí, en un solo sitio

entities/<x>/api/     Funciones por entidad: listar, crear, eliminar.
                      Traducen snake_case (Postgres) -> camelCase (dominio).

entities/<x>/model/   El tipo del dominio. NUNCA la fila cruda de la base.
```

Regla: **la forma de la fila de Postgres no sale del segmento `api/`.**
Se declara una interfaz `Fila<X>` privada y una función `aDominio()` que la traduce.
Así, renombrar una columna toca un archivo y no toda la app.

El estado de red va en el `model/` de un **feature** (reducer puro + hook que hace
la llamada), nunca dentro del componente. Ver `features/browse-estimation-projects/`.

## 5.ante La API va por el MISMO origen

El navegador nunca llama a `http://localhost:3001` directamente. Llama a `/api`,
que redirige Vite en desarrollo y nginx en producción.

```
VITE_POSTGREST_URL=/api                              ← navegador
VITE_POSTGREST_URL_ABSOLUTA=http://localhost:3001    ← scripts y tests en Node
```

Una URL absoluta con `localhost` en el cliente falla en cuanto alguien abre la
aplicación desde otro dispositivo: `localhost` resuelve a SU máquina, donde no hay
nada escuchando. Y de paso desaparece el CORS.

En Node no hay origen, así que los scripts y los `*.e2e.test.ts` fijan la base
con `fijarUrlBase()` antes de la primera llamada.

## 5.bis Dos esquemas expuestos

`PGRST_DB_SCHEMAS=estimacion,benchmark`. El **primero es el que manda**: sin
cabecera, todo resuelve contra `estimacion`. Para el otro hay que pedirlo:

```
Accept-Profile: benchmark     // lecturas
Content-Profile: benchmark    // escrituras
```

## 6. Recetas de PostgREST

```ts
// Seleccionar columnas y ordenar
`/proyecto?select=id,nombre&order=creado_en.desc`

// Filtrar
`/proyecto?nivel_compromiso=eq.80`
`/feature?complejidad=in.(a,ma)`
`/proyecto?nombre=ilike.*banca*`

// Embeber relaciones (usa las claves foráneas)
`/proyecto?select=nombre,componente(nombre,tipo),feature(nombre,complejidad)`

// Paginar
`/proyecto?limit=20&offset=40`

// Escribir y recibir la fila resultante
{ metodo: 'POST', prefer: 'return=representation' }
```

Lógica de negocio pesada → función `plpgsql` expuesta como RPC:
`POST /rpc/<nombre_funcion>`. Es la alternativa correcta a inventar un backend.

## 7. Migraciones

`db/init/*.sql` solo se ejecuta **con la base vacía**. Para cambiar el esquema:

- Local: `npm run stack:reset` (borra el volumen y reconstruye).
- On-prem: script de migración versionado y aplicado por el DBA. Los archivos de
  `db/init/` son la definición de referencia, no un mecanismo de despliegue.

## 8. Checklist antes de entregar cambios de datos

- [ ] ¿La tabla nueva tiene `ENABLE ROW LEVEL SECURITY` y su policy?
- [ ] ¿La vista nueva tiene `security_invoker = true`?
- [ ] ¿Los `GRANT` son los mínimos, y por columna donde hace falta?
- [ ] ¿Las columnas derivadas del token las pone un trigger, no el cliente?
- [ ] ¿La fila cruda se queda dentro de `entities/<x>/api/`?
- [ ] ¿Probaste con token de **otra** organización que no ve nada?
- [ ] `npm run check` pasa.
