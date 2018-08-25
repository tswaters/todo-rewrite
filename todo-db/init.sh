#!/bin/bash
set -e

PGPASSWORD_FILE=/var/run/secrets/PGPASSWORD

if [ -f $PGPASSWORD_FILE ]; then
  export PGPASSWORD=`cat ${PGPASSWORD_FILE}`
fi

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL

  CREATE USER todo WITH PASSWORD '$PGPASSWORD';
  CREATE DATABASE todo;
  GRANT ALL PRIVILEGES ON DATABASE todo TO todo;

EOSQL

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname todo <<-EOSQL

  CREATE EXTENSION pgcrypto;

EOSQL
