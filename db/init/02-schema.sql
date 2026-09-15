--
-- Esquema `estimacion`: es la API. PostgREST expone cada tabla y vista de aqui
-- como un endpoint REST, asi que el diseño del esquema es el diseño del contrato.
--
CREATE SCHEMA estimacion;

GRANT USAGE ON SCHEMA estimacion TO web_anon, estimador;

-- ---------------------------------------------------------------- enumeraciones
CREATE TYPE estimacion.tipo_componente AS ENUM (
  'front-angular',
  'bff',
  'micro-experiencia',
  'micro-negocio',
  'micro-core',
  'monolito-netcore',
  'monolito-netfx',
  -- Programa en lenguaje de 3a generacion (COBOL, PL/1, RPG), tipicamente en host.
  'componente-3gl'
);

CREATE TYPE estimacion.stack_tecnologico AS ENUM (
  'net8', 'netcore', 'netfx', 'angular17', 'angular12',
  -- Tercera generacion. El factor sale medido, no supuesto: ver datasets/HALLAZGOS.md.
  'cobol', 'otro-3gl'
);

CREATE TYPE estimacion.nivel_complejidad AS ENUM ('mb', 'b', 'm', 'a', 'ma');

-- ------------------------------------------------------- coeficientes del modelo
-- Tabla calibrable: es la que se reajusta con el back-testing (doc §8.3).
CREATE TABLE estimacion.modelo_coeficiente (
  clave          text PRIMARY KEY,
  valor          numeric(10, 4) NOT NULL,
  unidad         text NOT NULL,
  descripcion    text NOT NULL,
  actualizado_en timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE estimacion.modelo_coeficiente IS
  'Coeficientes del modelo de estimacion. Se recalibran con proyectos cerrados.';

-- ------------------------------------------------------------------- proyectos
CREATE TABLE estimacion.proyecto (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre            text NOT NULL CHECK (length(trim(nombre)) BETWEEN 3 AND 120),
  cliente           text,
  org_id            text NOT NULL DEFAULT 'default',
  owner_id          text NOT NULL,
  horas_dia         numeric(4, 2) NOT NULL DEFAULT 6 CHECK (horas_dia > 0 AND horas_dia <= 12),
  dias_mes          integer NOT NULL DEFAULT 20 CHECK (dias_mes BETWEEN 1 AND 31),
  nivel_compromiso  integer NOT NULL DEFAULT 80 CHECK (nivel_compromiso IN (50, 80, 90)),
  notas             text,
  creado_en         timestamptz NOT NULL DEFAULT now(),
  actualizado_en    timestamptz NOT NULL DEFAULT now()
);

COMMENT ON COLUMN estimacion.proyecto.horas_dia IS 'Jornada productiva. 6 h/dia x 20 dias = 120 h por mes-hombre.';
COMMENT ON COLUMN estimacion.proyecto.nivel_compromiso IS 'Percentil que se compromete: 50, 80 o 90.';

CREATE TABLE estimacion.componente (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id        uuid NOT NULL REFERENCES estimacion.proyecto(id) ON DELETE CASCADE,
  nombre             text NOT NULL,
  tipo               estimacion.tipo_componente NOT NULL,
  stack              estimacion.stack_tecnologico NOT NULL,
  es_nuevo           boolean NOT NULL DEFAULT false,
  cap_devs_override  integer CHECK (cap_devs_override BETWEEN 1 AND 10),
  UNIQUE (proyecto_id, nombre)
);

CREATE TABLE estimacion.feature (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id  uuid NOT NULL REFERENCES estimacion.proyecto(id) ON DELETE CASCADE,
  nombre       text NOT NULL,
  complejidad  estimacion.nivel_complejidad NOT NULL DEFAULT 'm',
  orden        integer NOT NULL DEFAULT 0,
  UNIQUE (proyecto_id, nombre)
);

-- El par (feature x componente) es la unidad que se estima (doc §2).
CREATE TABLE estimacion.feature_componente (
  feature_id            uuid NOT NULL REFERENCES estimacion.feature(id) ON DELETE CASCADE,
  componente_id         uuid NOT NULL REFERENCES estimacion.componente(id) ON DELETE CASCADE,
  complejidad_override  estimacion.nivel_complejidad,
  PRIMARY KEY (feature_id, componente_id)
);

CREATE TABLE estimacion.integracion (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id          uuid NOT NULL REFERENCES estimacion.proyecto(id) ON DELETE CASCADE,
  nombre               text NOT NULL,
  complejidad          estimacion.nivel_complejidad NOT NULL DEFAULT 'm',
  componente_duenio_id uuid REFERENCES estimacion.componente(id) ON DELETE SET NULL,
  es_externa           boolean NOT NULL DEFAULT false,
  tiene_sandbox        boolean NOT NULL DEFAULT true,
  usos                 integer NOT NULL DEFAULT 1 CHECK (usos >= 1),
  UNIQUE (proyecto_id, nombre)
);

CREATE TABLE estimacion.driver (
  proyecto_id  uuid NOT NULL REFERENCES estimacion.proyecto(id) ON DELETE CASCADE,
  clave        text NOT NULL,
  delta        numeric(4, 3) NOT NULL CHECK (delta BETWEEN -0.5 AND 0.5),
  PRIMARY KEY (proyecto_id, clave)
);

-- Resultado congelado de una corrida. `detalle` guarda streams, frontera y trazas.
CREATE TABLE estimacion.estimacion_corrida (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id      uuid NOT NULL REFERENCES estimacion.proyecto(id) ON DELETE CASCADE,
  ejecutada_en     timestamptz NOT NULL DEFAULT now(),
  mh_p50           numeric(10, 2) NOT NULL,
  mh_p80           numeric(10, 2) NOT NULL,
  mh_p90           numeric(10, 2) NOT NULL,
  personas_optimas numeric(5, 1) NOT NULL,
  meses            numeric(5, 1) NOT NULL,
  mh_facturables   numeric(10, 2) NOT NULL,
  detalle          jsonb NOT NULL DEFAULT '{}'::jsonb
);

-- Proyectos cerrados: la materia prima de la calibracion (doc §8.2).
CREATE TABLE estimacion.proyecto_historico (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          text NOT NULL DEFAULT 'default',
  nombre          text NOT NULL,
  cerrado_en      date NOT NULL,
  mh_estimadas    numeric(10, 2) NOT NULL,
  mh_reales       numeric(10, 2) NOT NULL,
  meses_reales    numeric(5, 1) NOT NULL,
  personas_reales numeric(5, 1) NOT NULL,
  alcance         jsonb NOT NULL DEFAULT '{}'::jsonb
);

-- Vista de calidad de la estimacion: MMRE y error relativo por proyecto.
-- security_invoker: sin esto la vista corre como su DUEÑO y se SALTA el RLS
-- de proyecto_historico. Es el error clasico de exponer vistas por PostgREST.
CREATE VIEW estimacion.calidad_estimacion WITH (security_invoker = true) AS
SELECT
  id,
  org_id,
  nombre,
  cerrado_en,
  mh_estimadas,
  mh_reales,
  round(abs(mh_reales - mh_estimadas) / NULLIF(mh_reales, 0), 4) AS error_relativo,
  round((mh_estimadas - mh_reales) / NULLIF(mh_reales, 0), 4)    AS sesgo,
  (abs(mh_reales - mh_estimadas) / NULLIF(mh_reales, 0)) < 0.25  AS dentro_de_pred25
FROM estimacion.proyecto_historico;

CREATE INDEX ON estimacion.componente (proyecto_id);
CREATE INDEX ON estimacion.feature (proyecto_id);
CREATE INDEX ON estimacion.integracion (proyecto_id);
CREATE INDEX ON estimacion.estimacion_corrida (proyecto_id, ejecutada_en DESC);
CREATE INDEX ON estimacion.proyecto (org_id, owner_id);

-- ------------------------------------------------------------------- triggers
CREATE FUNCTION estimacion.tocar_actualizado_en() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.actualizado_en := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER proyecto_actualizado_en
  BEFORE UPDATE ON estimacion.proyecto
  FOR EACH ROW EXECUTE FUNCTION estimacion.tocar_actualizado_en();

-- owner_id / org_id salen SIEMPRE del token, nunca del cuerpo de la peticion.
CREATE FUNCTION estimacion.fijar_propietario() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.owner_id := coalesce(
    current_setting('request.jwt.claims', true)::json ->> 'sub',
    'anon'
  );
  NEW.org_id := coalesce(
    current_setting('request.jwt.claims', true)::json ->> 'org',
    'default'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER proyecto_propietario
  BEFORE INSERT ON estimacion.proyecto
  FOR EACH ROW EXECUTE FUNCTION estimacion.fijar_propietario();
