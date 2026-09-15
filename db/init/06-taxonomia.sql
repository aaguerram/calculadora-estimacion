--
-- Taxonomia de features: los tres ejes con los que se describe el alcance.
--
--   Eje 1  categoria_feature  QUE ES la feature       (pantalla, reporte, batch, api...)
--   Eje 2  componente.tipo    DONDE VIVE              (front, bff, micro core, monolito...)
--   Eje 3  elemento_feature   DE QUE ESTA HECHA       (formulario, listado, buscador...)
--
-- El eje 3 sigue la descomposicion IFPUG (ISO/IEC 20926), que es el estandar
-- internacional y la unica particion funcional para la que existen datos publicos
-- de esfuerzo real. Cada elemento lleva su peso en PUNTOS FUNCION sin ajustar,
-- con los pesos oficiales por complejidad. Las horas salen de multiplicar por
-- `pf.horas-por-punto`, que es el coeficiente a calibrar por organizacion.
--
--   EI  External Input      entrada que altera datos       formulario, carga
--   EO  External Output     salida con calculo derivado    reporte, exportacion
--   EQ  External Inquiry    consulta sin derivacion        listado, buscador
--   ILF Internal Logical File  dato que el sistema mantiene entidad, parametria
--   EIF External Interface File dato leido de otro sistema  catalogo externo
--

CREATE TYPE estimacion.tipo_fp AS ENUM ('EI', 'EO', 'EQ', 'ILF', 'EIF');

CREATE TABLE estimacion.categoria_feature (
  clave       text PRIMARY KEY,
  nombre      text NOT NULL,
  descripcion text NOT NULL,
  orden       integer NOT NULL DEFAULT 0
);

CREATE TABLE estimacion.elemento_feature (
  clave        text PRIMARY KEY,
  categoria    text NOT NULL REFERENCES estimacion.categoria_feature(clave) ON DELETE CASCADE,
  nombre       text NOT NULL,
  descripcion  text NOT NULL,
  tipo_fp      estimacion.tipo_fp NOT NULL,
  -- Pesos IFPUG sin ajustar, por complejidad.
  pf_simple    integer NOT NULL,
  pf_media     integer NOT NULL,
  pf_alta      integer NOT NULL,
  orden        integer NOT NULL DEFAULT 0
);

COMMENT ON TABLE estimacion.elemento_feature IS
  'Catalogo seleccionable. Una feature puede marcar VARIOS elementos, con cantidad y complejidad propias.';

/** Seleccion multiple: que elementos tiene una feature y cuantos de cada uno. */
CREATE TABLE estimacion.feature_elemento (
  feature_id       uuid NOT NULL REFERENCES estimacion.feature(id) ON DELETE CASCADE,
  elemento         text NOT NULL REFERENCES estimacion.elemento_feature(clave) ON DELETE CASCADE,
  cantidad         integer NOT NULL DEFAULT 1 CHECK (cantidad BETWEEN 1 AND 99),
  complejidad      estimacion.nivel_complejidad NOT NULL DEFAULT 'm',
  PRIMARY KEY (feature_id, elemento)
);

/** La categoria de la feature. Se guarda aparte para no migrar la tabla viva. */
ALTER TABLE estimacion.feature
  ADD COLUMN categoria text REFERENCES estimacion.categoria_feature(clave);

/** Puntos funcion sin ajustar de cada feature, segun lo que tenga marcado. */
CREATE VIEW estimacion.feature_puntos_funcion WITH (security_invoker = true) AS
SELECT
  f.id              AS feature_id,
  f.proyecto_id,
  f.nombre,
  f.categoria,
  sum(
    fe.cantidad * CASE fe.complejidad
      WHEN 'mb' THEN e.pf_simple
      WHEN 'b'  THEN e.pf_simple
      WHEN 'm'  THEN e.pf_media
      WHEN 'a'  THEN e.pf_alta
      WHEN 'ma' THEN e.pf_alta
    END
  )                 AS puntos_funcion,
  count(*)          AS elementos
FROM estimacion.feature f
JOIN estimacion.feature_elemento fe ON fe.feature_id = f.id
JOIN estimacion.elemento_feature e  ON e.clave = fe.elemento
GROUP BY f.id, f.proyecto_id, f.nombre, f.categoria;

GRANT SELECT ON estimacion.categoria_feature, estimacion.elemento_feature TO web_anon;
GRANT SELECT ON ALL TABLES IN SCHEMA estimacion TO estimador;
GRANT SELECT, INSERT, UPDATE, DELETE ON estimacion.feature_elemento TO estimador;
GRANT SELECT ON estimacion.feature_puntos_funcion TO estimador;
GRANT INSERT, UPDATE, DELETE ON estimacion.categoria_feature, estimacion.elemento_feature
  TO calibrador;

ALTER TABLE estimacion.feature_elemento ENABLE ROW LEVEL SECURITY;
CREATE POLICY feature_elemento_org ON estimacion.feature_elemento
  FOR ALL TO estimador
  USING (EXISTS (SELECT 1 FROM estimacion.feature f JOIN estimacion.proyecto p ON p.id = f.proyecto_id
                 WHERE f.id = feature_id AND p.org_id = estimacion.jwt_org()))
  WITH CHECK (EXISTS (SELECT 1 FROM estimacion.feature f JOIN estimacion.proyecto p ON p.id = f.proyecto_id
                 WHERE f.id = feature_id AND p.org_id = estimacion.jwt_org()));

-- El catalogo es comun a la organizacion: sin RLS, pero solo `calibrador` escribe.
