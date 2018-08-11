-- Deploy todo:auth.table.user to pg
-- requires: auth.schema

BEGIN;

  CREATE TABLE auth.role (
    role_id SERIAL PRIMARY KEY,
    name text NOT NULL,
    CONSTRAINT roles_name_unique UNIQUE (name)
  );

  WITH roles (name) AS (
    VALUES
      ('USER'),
      ('ADMIN')
  )
  INSERT INTO auth.role (name)
  SELECT name FROM roles
  ON CONFLICT (name) DO NOTHING;

  CREATE TABLE auth.user (
    user_id SERIAL PRIMARY KEY,
    identifier TEXT NOT NULL,
    password TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT user_identifier_unique UNIQUE (identifier)
  );

  CREATE INDEX user_login_index ON auth.user (lower(identifier));

  CREATE TABLE auth.user_role (
    user_id INTEGER,
    role_id INTEGER,
    CONSTRAINT user_roles_pk PRIMARY KEY (user_id, role_id),
    CONSTRAINT user_roles_user_id_fk FOREIGN KEY (user_id) REFERENCES auth.user,
    CONSTRAINT user_roles_role_id_fk FOREIGN KEY (role_id) REFERENCES auth.role
  );

  CREATE INDEX user_roles_user_id_index ON auth.user_role (user_id);

COMMIT;
