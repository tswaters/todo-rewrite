#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL

  CREATE USER todo WITH PASSWORD '`cat /var/run/secrets/PGPASSWORD`';
  CREATE DATABASE todo;
  GRANT ALL PRIVILEGES ON DATABASE todo TO todo;

EOSQL

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname todo <<-EOSQL

  CREATE EXTENSION pgcrypto;

EOSQL
