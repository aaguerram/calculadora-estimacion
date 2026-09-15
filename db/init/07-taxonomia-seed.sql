--
-- Catalogo de categorias y elementos seleccionables.
-- Pesos en puntos funcion sin ajustar: IFPUG Counting Practices Manual 4.3.
--

INSERT INTO estimacion.categoria_feature (clave, nombre, descripcion, orden) VALUES
 ('pantalla',     'Pantalla / UI',            'El usuario interactúa: captura, consulta o navega.', 1),
 ('reporte',      'Reporte / consulta',       'Salida de información, con o sin cálculo derivado.', 2),
 ('proceso-batch','Proceso batch / programado','Ejecución desatendida sobre volúmenes de datos.', 3),
 ('servicio-api', 'Servicio / API expuesta',  'Contrato que consumen otros sistemas.', 4),
 ('integracion',  'Integración con terceros', 'Consumo de un sistema fuera de tu control.', 5),
 ('evento',       'Evento / mensajería',      'Publicación o consumo asíncrono.', 6),
 ('migracion',    'Migración / carga de datos','Movimiento puntual de datos entre sistemas.', 7),
 ('motor-reglas', 'Motor de reglas / cálculo','Lógica de negocio pura, sin interfaz propia.', 8),
 ('componente-3gl','Componente 3GL',          'Programa en lenguaje de tercera generación (COBOL, PL/1, RPG), normalmente en host o en la capa legada.', 9),
 ('transversal',   'Transversal / datos',     'Elementos que puede tener cualquier feature, sea de la categoría que sea.', 98);

INSERT INTO estimacion.elemento_feature (clave, categoria, nombre, descripcion, tipo_fp, pf_simple, pf_media, pf_alta, orden) VALUES
 -- ---------- PANTALLA ----------
 ('pant.form-alta',      'pantalla','Formulario de alta',        'Captura que crea un registro nuevo.',                        'EI', 3,4,6, 1),
 ('pant.form-edicion',   'pantalla','Formulario de edición',     'Modifica un registro existente.',                            'EI', 3,4,6, 2),
 ('pant.eliminacion',    'pantalla','Eliminación',               'Borrado con confirmación y reglas de integridad.',           'EI', 3,4,6, 3),
 ('pant.wizard',         'pantalla','Asistente multipaso',       'Varios pasos con estado intermedio y vuelta atrás.',         'EI', 4,6,6, 4),
 ('pant.carga-archivo',  'pantalla','Carga de archivo',          'Subida con validación y previsualización.',                  'EI', 3,4,6, 5),
 ('pant.listado',        'pantalla','Listado paginado',          'Tabla con orden y paginación.',                              'EQ', 3,4,6, 6),
 ('pant.buscador',       'pantalla','Buscador con filtros',      'Criterios combinables sobre el listado.',                    'EQ', 3,4,6, 7),
 ('pant.detalle',        'pantalla','Detalle de registro',       'Vista de solo lectura de una entidad.',                      'EQ', 3,4,6, 8),
 ('pant.selector',       'pantalla','Selector / autocompletar',  'Combo con búsqueda remota.',                                 'EQ', 3,3,4, 9),
 ('pant.arbol',          'pantalla','Árbol o jerarquía',         'Navegación por estructura anidada.',                         'EQ', 4,4,6, 10),
 ('pant.exportacion',    'pantalla','Exportación',               'Descarga en Excel, CSV o PDF.',                              'EO', 4,5,7, 11),
 ('pant.grafico',        'pantalla','Gráfico o tablero',         'Visualización con agregados calculados.',                    'EO', 4,5,7, 12),
 ('pant.documento',      'pantalla','Documento imprimible',      'Genera un documento con formato.',                           'EO', 4,5,7, 13),
 ('pant.notificacion',   'pantalla','Aviso al usuario',          'Notificación generada por una regla.',                       'EO', 4,5,7, 14),

 -- ---------- REPORTE ----------
 ('rep.tabular',         'reporte','Reporte tabular',            'Listado impreso o exportable sin cálculo.',                  'EQ', 3,4,6, 1),
 ('rep.calculado',       'reporte','Reporte con cálculos',       'Totales, agregados o fórmulas derivadas.',                   'EO', 4,5,7, 2),
 ('rep.parametros',      'reporte','Parámetros del reporte',     'Pantalla de criterios previa a la ejecución.',               'EQ', 3,4,6, 3),
 ('rep.grafico',         'reporte','Gráficos del reporte',       'Representación visual de los agregados.',                    'EO', 4,5,7, 4),
 ('rep.exportacion',     'reporte','Exportación del reporte',    'Salida en formato de archivo.',                              'EO', 4,5,7, 5),
 ('rep.programado',      'reporte','Envío programado',           'Se genera y distribuye solo, sin usuario.',                  'EO', 5,5,7, 6),

 -- ---------- PROCESO BATCH ----------
 ('bat.lectura',         'proceso-batch','Lectura masiva de origen','Extrae de archivo, tabla o servicio.',                    'EIF',5,7,10, 1),
 ('bat.transformacion',  'proceso-batch','Transformación',          'Reglas aplicadas a cada registro.',                       'EO', 4,5,7, 2),
 ('bat.escritura',       'proceso-batch','Escritura masiva',        'Persiste el resultado en el destino.',                    'EI', 3,4,6, 3),
 ('bat.conciliacion',    'proceso-batch','Conciliación',            'Compara dos fuentes y reporta diferencias.',              'EO', 5,5,7, 4),
 ('bat.reproceso',       'proceso-batch','Reproceso y reintentos',  'Reanudar desde el punto de fallo sin duplicar.',          'EI', 4,6,6, 5),
 ('bat.planificacion',   'proceso-batch','Planificación',           'Calendario, dependencias y ventana de ejecución.',        'EI', 3,4,6, 6),
 ('bat.auditoria',       'proceso-batch','Bitácora de ejecución',   'Registro de lo procesado, para poder responder después.', 'ILF',7,10,15, 7),

 -- ---------- SERVICIO / API ----------
 ('api.consulta',        'servicio-api','Endpoint de consulta',   'GET sin efectos secundarios.',                              'EQ', 3,4,6, 1),
 ('api.comando',         'servicio-api','Endpoint de comando',    'POST/PUT/DELETE que altera datos.',                         'EI', 3,4,6, 2),
 ('api.contrato',        'servicio-api','Contrato publicado',     'OpenAPI, ejemplos y versionado del contrato.',              'EIF',5,7,10, 3),
 ('api.paginacion',      'servicio-api','Paginación y filtrado',  'Criterios y cursores sobre colecciones.',                   'EQ', 3,4,6, 4),
 ('api.idempotencia',    'servicio-api','Idempotencia',           'Reintentos seguros con clave de idempotencia.',             'EI', 4,6,6, 5),
 ('api.seguridad',       'servicio-api','Autenticación y permisos','Validación de token y reglas de autorización.',            'EI', 4,6,6, 6),

 -- ---------- INTEGRACIÓN ----------
 ('int.rest',            'integracion','Cliente REST',            'Consumo de una API HTTP externa.',                          'EIF',5,7,10, 1),
 ('int.soap',            'integracion','Cliente SOAP o legacy',   'WSDL, XML, o protocolo propietario.',                       'EIF',7,10,10, 2),
 ('int.archivos',        'integracion','Transferencia de archivos','SFTP, carpeta compartida, formato fijo.',                  'EIF',5,7,10, 3),
 ('int.cola',            'integracion','Cola de mensajes',        'MQ, Kafka, Service Bus.',                                   'EIF',5,7,10, 4),
 ('int.mapeo',           'integracion','Mapeo y transformación',  'Traducción entre el modelo externo y el propio.',           'EO', 4,5,7, 5),
 ('int.resiliencia',     'integracion','Reintentos y tolerancia', 'Timeouts, circuit breaker, degradación.',                   'EI', 4,6,6, 6),
 ('int.certificacion',   'integracion','Certificación con el tercero','Pruebas conjuntas y homologación.',                     'EIF',7,10,10, 7),

 -- ---------- EVENTO ----------
 ('evt.publicacion',     'evento','Publicación de evento',        'Emite un evento de dominio.',                               'EO', 4,5,7, 1),
 ('evt.consumo',         'evento','Consumo de evento',            'Se suscribe y reacciona.',                                  'EIF',5,7,10, 2),
 ('evt.esquema',         'evento','Esquema del evento',           'Contrato versionado del mensaje.',                          'EIF',5,7,10, 3),
 ('evt.idempotencia',    'evento','Consumo idempotente',          'Tolera entregas repetidas.',                                'EI', 4,6,6, 4),
 ('evt.dlq',             'evento','Cola de fallidos',             'Dead letter queue y su reproceso.',                         'EI', 4,6,6, 5),

 -- ---------- MIGRACIÓN ----------
 ('mig.extraccion',      'migracion','Extracción del origen',     'Lectura del sistema que se abandona.',                      'EIF',5,7,10, 1),
 ('mig.transformacion',  'migracion','Transformación y limpieza', 'Normaliza, deduplica y corrige.',                           'EO', 5,5,7, 2),
 ('mig.carga',           'migracion','Carga en destino',          'Inserción masiva con control de errores.',                  'EI', 4,6,6, 3),
 ('mig.conciliacion',    'migracion','Conciliación post-carga',   'Demuestra que no se perdió nada.',                          'EO', 5,5,7, 4),
 ('mig.rollback',        'migracion','Plan de vuelta atrás',      'Poder deshacer la migración.',                              'EI', 4,6,6, 5),

 -- ---------- MOTOR DE REGLAS ----------
 ('mot.definicion',      'motor-reglas','Definición de reglas',   'Cómo se expresan y dónde viven.',                           'ILF',7,10,15, 1),
 ('mot.evaluacion',      'motor-reglas','Motor de evaluación',    'Aplica las reglas a un caso.',                              'EO', 5,5,7, 2),
 ('mot.versionado',      'motor-reglas','Versionado de reglas',   'Vigencias y reglas históricas.',                            'ILF',7,10,15, 3),
 ('mot.simulacion',      'motor-reglas','Simulación',             'Ejecuta sin persistir, para comparar.',                     'EQ', 4,4,6, 4),

 -- ---------- COMPONENTE 3GL ----------
 ('3gl.programa',        'componente-3gl','Programa de proceso',      'Unidad ejecutable que resuelve un caso de negocio completo.',      'EO', 5,5,7, 1),
 ('3gl.subrutina',       'componente-3gl','Módulo llamable',          'Subrutina reutilizable invocada por otros programas.',            'EO', 4,5,7, 2),
 ('3gl.validacion',      'componente-3gl','Rutina de validación',     'Reglas de consistencia sobre los datos de entrada.',              'EI', 3,4,6, 3),
 ('3gl.transaccion',     'componente-3gl','Transacción online',       'Transacción CICS/IMS con su control de unidad de trabajo.',       'EI', 4,6,6, 4),
 ('3gl.mapa',            'componente-3gl','Mapa de pantalla host',    'Pantalla 3270 (BMS/MFS) con sus campos.',                         'EQ', 4,4,6, 5),
 ('3gl.copybook',        'componente-3gl','Copybook / estructura',    'Definición de datos compartida entre programas.',                 'ILF',7,10,15, 6),
 ('3gl.acceso-datos',    'componente-3gl','Acceso a datos host',      'Lectura o escritura sobre VSAM, DB2, IMS DB.',                    'ILF',7,10,15, 7),
 ('3gl.jcl',             'componente-3gl','JCL / secuencia',          'Encadenamiento de pasos, condicionales y reinicio.',              'EI', 3,4,6, 8),
 ('3gl.expuesto',        'componente-3gl','Exposición a lo moderno',  'Publicar el programa como servicio: copybook a contrato, gateway.','EIF',7,10,10, 9),

 -- ---------- DATOS (aplican a cualquier categoría) ----------
 ('dat.entidad',         'transversal','Entidad propia',       'El sistema pasa a ser dueño de este dato.',                 'ILF',7,10,15, 1),
 ('dat.parametria',      'transversal','Parametría',           'Tabla de configuración mantenible por negocio.',            'ILF',7,10,15, 2),
 ('dat.auditoria',       'transversal','Auditoría / histórico','Registro de cambios consultable.',                          'ILF',7,10,15, 3),
 ('dat.catalogo-externo','transversal','Catálogo externo',     'Dato que se lee de otro sistema, sin mantenerlo.',          'EIF',5,7,10, 4);

-- Componente 3GL: base y tope de concurrencia.
INSERT INTO estimacion.modelo_coeficiente (clave, valor, unidad, descripcion) VALUES
 ('base.componente-3gl', 72, 'horas',
  'Horas base por feature en un componente 3GL. Parte del monolito legado (68) con algo mas de ceremonia de host.'),
 ('cap.componente-3gl', 2, 'devs',
  'Maximo de devs utiles. Igual que el monolito legado: alto acoplamiento y coste de regresion.'),
 ('bootstrap.componente-3gl', 0, 'horas',
  'Sin arranque: un componente 3GL siempre existe ya.'),
 ('stack.cobol', 2.6, 'factor',
  'Factor de COBOL frente a .NET 8. MEDIDO: dentro de Desharnais (misma empresa) 3GL 18.7 h/PF frente a 4GL 4.2 h/PF = 4.4x; entre datasets, Albrecht (COBOL/PL1) 23.7 frente a China 8.1 = 2.9x. Se toma 2.6 porque la linea base .NET no es un 4GL puro. Es el coeficiente mas incierto del modelo: calibralo.'),
 ('stack.otro-3gl', 2.6, 'factor',
  'PL/1, RPG, Natural y demas. Mismo factor que COBOL hasta tener dato propio que los separe.');

-- Horas por punto funcion: EL coeficiente a calibrar. El valor de arranque es
-- deliberadamente el punto medio del rango observado en los datos publicos.
INSERT INTO estimacion.modelo_coeficiente (clave, valor, unidad, descripcion) VALUES
 ('pf.horas-por-punto', 5.2, 'horas',
  'Horas de DESARROLLO por punto función sin ajustar. OJO con la unidad: los 6.3-23.7 h/PF que se leen en la literatura y en benchmark.productividad son esfuerzo TOTAL de proyecto; aquí la cifra es solo desarrollo, porque después se aplica el x1.65 de overheads. Usar la cifra total contaría dos veces el análisis, QA y la gestión. Mediana observada sobre 1086 proyectos: 8.7 total / 1.65 = 5.2 de desarrollo (p25 2.9, p75 9.9). Es el coeficiente a calibrar antes que ningún otro.');
