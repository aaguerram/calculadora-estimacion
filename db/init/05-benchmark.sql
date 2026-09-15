--
-- Esquema `benchmark`: datos historicos EXTERNOS de proyectos reales.
--
-- No son proyectos de la organizacion: son datasets publicos de investigacion
-- (PROMISE, SiP, Desharnais...). Sirven para acotar rangos y validar el metodo,
-- NO para fijar los coeficientes del modelo. Ver datasets/HALLAZGOS.md.
--
CREATE SCHEMA benchmark;
GRANT USAGE ON SCHEMA benchmark TO web_anon, estimador, calibrador;

CREATE TABLE benchmark.fuente (
  clave           text PRIMARY KEY,
  nombre          text NOT NULL,
  descripcion     text NOT NULL,
  nivel           text NOT NULL CHECK (nivel IN ('proyecto', 'tarea', 'historia')),
  unidad_esfuerzo text NOT NULL,
  n_registros     integer NOT NULL DEFAULT 0,
  anio            integer,
  origen_url      text NOT NULL,
  /** Una sola organizacion o varias: cambia por completo la dispersion. */
  multiempresa    boolean NOT NULL DEFAULT true
);

COMMENT ON COLUMN benchmark.fuente.multiempresa IS
  'Los datasets de una sola empresa predicen mucho mejor: MMRE ~28 % frente a ~77 %.';

-- Nivel proyecto -----------------------------------------------------------
CREATE TABLE benchmark.proyecto_externo (
  id              bigserial PRIMARY KEY,
  fuente          text NOT NULL REFERENCES benchmark.fuente(clave) ON DELETE CASCADE,
  ref_externa     text,
  esfuerzo_horas  numeric(12, 2),
  duracion_meses  numeric(8, 2),
  equipo_personas numeric(8, 2),
  puntos_funcion  numeric(10, 2),
  -- Descomposicion IFPUG, cuando la fuente la trae.
  entradas        integer,
  salidas         integer,
  consultas       integer,
  ficheros        integer,
  interfaces      integer,
  lenguaje        text,
  tipo_desarrollo text,
  sector          text,
  /** El resto de columnas del dataset, sin perder nada. */
  atributos       jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX ON benchmark.proyecto_externo (fuente);

-- Nivel tarea / historia ---------------------------------------------------
CREATE TABLE benchmark.tarea_externa (
  id               bigserial PRIMARY KEY,
  fuente           text NOT NULL REFERENCES benchmark.fuente(clave) ON DELETE CASCADE,
  ref_externa      text,
  resumen          text,
  categoria        text,
  subcategoria     text,
  horas_estimadas  numeric(10, 2),
  horas_reales     numeric(10, 2),
  puntos_historia  numeric(8, 2),
  atributos        jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX ON benchmark.tarea_externa (fuente);
CREATE INDEX ON benchmark.tarea_externa (categoria, subcategoria);

-- Vistas de referencia -----------------------------------------------------

/** Horas por punto funcion observadas. Es EL numero a calibrar por organizacion. */
CREATE VIEW benchmark.productividad AS
SELECT
  p.fuente,
  f.multiempresa,
  p.lenguaje,
  p.esfuerzo_horas,
  p.puntos_funcion,
  round(p.esfuerzo_horas / NULLIF(p.puntos_funcion, 0), 2) AS horas_por_pf
FROM benchmark.proyecto_externo p
JOIN benchmark.fuente f ON f.clave = p.fuente
WHERE p.esfuerzo_horas > 0 AND p.puntos_funcion > 0;

/** Que tan bien estima una empresa REAL a nivel de tarea. Referencia de expectativas. */
CREATE VIEW benchmark.exactitud_tareas AS
SELECT
  fuente,
  categoria,
  subcategoria,
  count(*)                                                                AS n,
  round(avg(abs(horas_reales - horas_estimadas) / horas_reales), 4)       AS mmre,
  round(
    (percentile_cont(0.5) WITHIN GROUP (
      ORDER BY abs(horas_reales - horas_estimadas) / horas_reales))::numeric, 4)  AS mdmre,
  round(
    count(*) FILTER (
      WHERE abs(horas_reales - horas_estimadas) / horas_reales < 0.25)::numeric
    / count(*), 4)                                                        AS pred25,
  round(
    (percentile_cont(0.5) WITHIN GROUP (ORDER BY horas_reales))::numeric, 2) AS horas_reales_mediana
FROM benchmark.tarea_externa
WHERE horas_reales > 0 AND horas_estimadas > 0
GROUP BY fuente, categoria, subcategoria;

-- Permisos: los datos de referencia son de lectura publica dentro de la app.
GRANT SELECT ON ALL TABLES IN SCHEMA benchmark TO web_anon, estimador, calibrador;
GRANT INSERT, UPDATE, DELETE ON benchmark.fuente, benchmark.proyecto_externo,
  benchmark.tarea_externa TO calibrador;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA benchmark TO calibrador;
