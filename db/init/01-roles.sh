#!/bin/bash
# Roles de PostgREST.
#
#   authenticator : rol de conexion (LOGIN, NOINHERIT). PostgREST entra con este
#                   y hace SET ROLE al rol que indique el JWT. Sin permisos propios.
#   web_anon      : peticiones SIN token. Solo lectura de datos de referencia.
#   estimador     : peticiones CON token valido. CRUD limitado por RLS.
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
  CREATE ROLE web_anon NOLOGIN;
  CREATE ROLE estimador NOLOGIN;

  CREATE ROLE authenticator LOGIN NOINHERIT PASSWORD '${AUTHENTICATOR_PASSWORD}';
  GRANT web_anon  TO authenticator;
  GRANT estimador TO authenticator;
EOSQL
