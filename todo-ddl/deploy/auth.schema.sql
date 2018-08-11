-- Deploy todo:schema to pg

BEGIN;

  CREATE SCHEMA auth;
  ALTER SCHEMA auth OWNER TO todo;

COMMIT;
