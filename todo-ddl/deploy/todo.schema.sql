-- Deploy todo:schema to pg
-- requires: schema

BEGIN;

  CREATE SCHEMA todo;
  ALTER SCHEMA todo OWNER TO todo;

COMMIT;
