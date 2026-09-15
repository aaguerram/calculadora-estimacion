--
-- Semilla: los coeficientes de docs/modelo-estimacion.md.
-- Son un punto de partida, NO verdades: se recalibran con back-testing.
--
INSERT INTO estimacion.modelo_coeficiente (clave, valor, unidad, descripcion) VALUES
  ('base.front-angular',      40,     'horas',  'Horas base por feature en front Angular (complejidad media)'),
  ('base.bff',                20,     'horas',  'Horas base por feature en BFF'),
  ('base.micro-experiencia',  28,     'horas',  'Horas base por feature en micro de experiencia'),
  ('base.micro-negocio',      44,     'horas',  'Horas base por feature en micro de negocio'),
  ('base.micro-core',         60,     'horas',  'Horas base por feature en micro core'),
  ('base.monolito-netcore',   52,     'horas',  'Horas base por feature en monolito .NET Core'),
  ('base.monolito-netfx',     68,     'horas',  'Horas base por feature en monolito .NET Framework'),

  ('cap.front-angular',        5,     'devs',   'Maximo de devs utiles en paralelo'),
  ('cap.bff',                  3,     'devs',   'Maximo de devs utiles en paralelo'),
  ('cap.micro-experiencia',    3,     'devs',   'Maximo de devs utiles en paralelo'),
  ('cap.micro-negocio',        3,     'devs',   'Maximo de devs utiles en paralelo'),
  ('cap.micro-core',           3,     'devs',   'Maximo de devs utiles en paralelo'),
  ('cap.monolito-netcore',     3,     'devs',   'Maximo de devs utiles en paralelo'),
  ('cap.monolito-netfx',       2,     'devs',   'Maximo de devs utiles en paralelo'),

  ('bootstrap.front-angular', 60,     'horas',  'Arranque de componente nuevo'),
  ('bootstrap.bff',           24,     'horas',  'Arranque de componente nuevo'),
  ('bootstrap.micro-experiencia', 32, 'horas',  'Arranque de componente nuevo'),
  ('bootstrap.micro-negocio', 40,     'horas',  'Arranque de componente nuevo'),
  ('bootstrap.micro-core',    56,     'horas',  'Arranque de componente nuevo'),

  ('complejidad.mb',          0.4,    'factor', 'Multiplicador de complejidad muy baja'),
  ('complejidad.b',           0.7,    'factor', 'Multiplicador de complejidad baja'),
  ('complejidad.m',           1.0,    'factor', 'Multiplicador de complejidad media'),
  ('complejidad.a',           1.6,    'factor', 'Multiplicador de complejidad alta'),
  ('complejidad.ma',          2.2,    'factor', 'Multiplicador de complejidad muy alta'),

  ('stack.net8',              1.00,   'factor', 'Factor de stack .NET 8 / Core'),
  ('stack.netcore',           1.00,   'factor', 'Factor de stack .NET Core'),
  ('stack.netfx',             1.30,   'factor', 'Factor de stack .NET Framework 4.x'),
  ('stack.angular17',         1.00,   'factor', 'Factor de stack Angular 15+'),
  ('stack.angular12',         1.20,   'factor', 'Factor de stack Angular <= 12'),

  ('integracion.b',            8,     'horas',  'Integracion de complejidad baja'),
  ('integracion.m',           24,     'horas',  'Integracion de complejidad media'),
  ('integracion.a',           56,     'horas',  'Integracion de complejidad alta'),
  ('integracion.ma',          96,     'horas',  'Integracion de complejidad muy alta'),
  ('integracion.externa',      1.40,  'factor', 'Recargo si la contraparte es externa'),
  ('integracion.sin-sandbox',  1.30,  'factor', 'Recargo si no hay sandbox ni mock'),
  ('integracion.uso-extra',    0.25,  'factor', 'Recargo por cada feature adicional que la consume'),

  ('overhead.analisis',        0.15,  'factor', 'Analisis y refinamiento sobre desarrollo'),
  ('overhead.qa',              0.25,  'factor', 'QA sobre desarrollo'),
  ('overhead.devops',          0.08,  'factor', 'DevOps y ambientes sobre desarrollo'),
  ('overhead.gestion',         0.12,  'factor', 'Gestion y ceremonias sobre desarrollo'),
  ('overhead.documentacion',   0.05,  'factor', 'Documentacion y paso a produccion'),

  ('equipo.gamma',             0.020, 'factor', 'Sobrecarga de comunicacion intra-stream'),
  ('equipo.delta',             0.0015,'factor', 'Sobrecarga de coordinacion global del proyecto'),
  ('equipo.onboarding',        0.40,  'mh',     'Meses-hombre de onboarding por persona adicional'),
  ('riesgo.sigma-comun',       0.18,  'factor', 'Sigma lognormal del riesgo comun en Monte Carlo'),
  ('jornada.horas-dia',        6,     'horas',  'Jornada productiva diaria'),
  ('jornada.dias-mes',        20,     'dias',   'Dias laborables por mes');
