--
-- Row Level Security + permisos.
--
-- Regla: PostgREST no tiene logica de autorizacion. TODA la seguridad vive aqui.
-- Si olvidas ENABLE ROW LEVEL SECURITY en una tabla, esa tabla queda abierta.
--

-- Helpers para leer los claims del JWT que PostgREST inyecta en la sesion.
CREATE FUNCTION estimacion.jwt_sub() RETURNS text
LANGUAGE sql STABLE AS $$
  SELECT coalesce(current_setting('request.jwt.claims', true)::json ->> 'sub', '')
$$;

CREATE FUNCTION estimacion.jwt_org() RETURNS text
LANGUAGE sql STABLE AS $$
  SELECT coalesce(current_setting('request.jwt.claims', true)::json ->> 'org', 'default')
$$;

ALTER TABLE estimacion.proyecto            ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimacion.componente          ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimacion.feature             ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimacion.feature_componente  ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimacion.integracion         ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimacion.driver              ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimacion.estimacion_corrida  ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimacion.proyecto_historico  ENABLE ROW LEVEL SECURITY;

-- ---- estimador: ve y edita los proyectos de SU organizacion --------------
CREATE POLICY proyecto_org ON estimacion.proyecto
  FOR ALL TO estimador
  USING (org_id = estimacion.jwt_org())
  WITH CHECK (org_id = estimacion.jwt_org());

-- Las tablas hijas heredan el alcance del proyecto padre.
CREATE POLICY componente_org ON estimacion.componente
  FOR ALL TO estimador
  USING (EXISTS (SELECT 1 FROM estimacion.proyecto p
                 WHERE p.id = proyecto_id AND p.org_id = estimacion.jwt_org()))
  WITH CHECK (EXISTS (SELECT 1 FROM estimacion.proyecto p
                 WHERE p.id = proyecto_id AND p.org_id = estimacion.jwt_org()));

CREATE POLICY feature_org ON estimacion.feature
  FOR ALL TO estimador
  USING (EXISTS (SELECT 1 FROM estimacion.proyecto p
                 WHERE p.id = proyecto_id AND p.org_id = estimacion.jwt_org()))
  WITH CHECK (EXISTS (SELECT 1 FROM estimacion.proyecto p
                 WHERE p.id = proyecto_id AND p.org_id = estimacion.jwt_org()));

CREATE POLICY feature_componente_org ON estimacion.feature_componente
  FOR ALL TO estimador
  USING (EXISTS (SELECT 1 FROM estimacion.feature f JOIN estimacion.proyecto p ON p.id = f.proyecto_id
                 WHERE f.id = feature_id AND p.org_id = estimacion.jwt_org()))
  WITH CHECK (EXISTS (SELECT 1 FROM estimacion.feature f JOIN estimacion.proyecto p ON p.id = f.proyecto_id
                 WHERE f.id = feature_id AND p.org_id = estimacion.jwt_org()));

CREATE POLICY integracion_org ON estimacion.integracion
  FOR ALL TO estimador
  USING (EXISTS (SELECT 1 FROM estimacion.proyecto p
                 WHERE p.id = proyecto_id AND p.org_id = estimacion.jwt_org()))
  WITH CHECK (EXISTS (SELECT 1 FROM estimacion.proyecto p
                 WHERE p.id = proyecto_id AND p.org_id = estimacion.jwt_org()));

CREATE POLICY driver_org ON estimacion.driver
  FOR ALL TO estimador
  USING (EXISTS (SELECT 1 FROM estimacion.proyecto p
                 WHERE p.id = proyecto_id AND p.org_id = estimacion.jwt_org()))
  WITH CHECK (EXISTS (SELECT 1 FROM estimacion.proyecto p
                 WHERE p.id = proyecto_id AND p.org_id = estimacion.jwt_org()));

CREATE POLICY corrida_org ON estimacion.estimacion_corrida
  FOR ALL TO estimador
  USING (EXISTS (SELECT 1 FROM estimacion.proyecto p
                 WHERE p.id = proyecto_id AND p.org_id = estimacion.jwt_org()))
  WITH CHECK (EXISTS (SELECT 1 FROM estimacion.proyecto p
                 WHERE p.id = proyecto_id AND p.org_id = estimacion.jwt_org()));

CREATE POLICY historico_org ON estimacion.proyecto_historico
  FOR ALL TO estimador
  USING (org_id = estimacion.jwt_org())
  WITH CHECK (org_id = estimacion.jwt_org());

-- ---- permisos de tabla (RLS filtra filas; GRANT abre la puerta) -----------
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA estimacion TO estimador;
GRANT SELECT ON estimacion.calidad_estimacion TO estimador;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA estimacion TO estimador;

-- owner_id / org_id los pone el trigger a partir del token.
-- OJO: un `REVOKE INSERT (columna)` NO recorta un GRANT a nivel de tabla.
-- Hay que retirar el permiso de tabla y volver a darlo columna por columna,
-- o PostgREST acepta el campo con 201 y el trigger lo sobreescribe en silencio.
REVOKE INSERT, UPDATE ON estimacion.proyecto FROM estimador;
GRANT INSERT (nombre, cliente, horas_dia, dias_mes, nivel_compromiso, notas)
  ON estimacion.proyecto TO estimador;
GRANT UPDATE (nombre, cliente, horas_dia, dias_mes, nivel_compromiso, notas)
  ON estimacion.proyecto TO estimador;

-- ---- coeficientes: lectura para todos, escritura solo para `calibrador` ---
-- Recalibrar el modelo cambia toda estimacion futura: no es una operacion
-- que deba poder hacer cualquiera que pueda crear un proyecto.
CREATE ROLE calibrador NOLOGIN;
GRANT calibrador TO authenticator;
GRANT USAGE ON SCHEMA estimacion TO calibrador;

-- `calibrador` es un superconjunto de `estimador`: para calibrar hay que poder
-- leer los alcances de los proyectos. Un JWT lleva UN solo claim `role`, asi que
-- sin esta herencia habria que manejar dos tokens en el cliente.
-- Las policies declaradas TO estimador tambien aplican a sus miembros.
GRANT estimador TO calibrador;

REVOKE INSERT, UPDATE, DELETE ON estimacion.modelo_coeficiente FROM estimador;
GRANT SELECT ON estimacion.modelo_coeficiente TO calibrador;
GRANT INSERT, UPDATE ON estimacion.modelo_coeficiente TO calibrador;
GRANT SELECT, INSERT, UPDATE, DELETE ON estimacion.proyecto_historico TO calibrador;
GRANT SELECT ON estimacion.calidad_estimacion TO calibrador;

ALTER TABLE estimacion.proyecto_historico ENABLE ROW LEVEL SECURITY;
CREATE POLICY historico_calibrador ON estimacion.proyecto_historico
  FOR ALL TO calibrador
  USING (org_id = estimacion.jwt_org())
  WITH CHECK (org_id = estimacion.jwt_org());

-- ---- web_anon: SIN token solo se leen los coeficientes del modelo ---------
GRANT SELECT ON estimacion.modelo_coeficiente TO web_anon;
