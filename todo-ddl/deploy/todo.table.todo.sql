-- Deploy todo:table.todo.todo to pg
-- requires: auth.table.user

BEGIN;

  CREATE TABLE todo.todo (
    todo_id SERIAL PRIMARY KEY,
    user_id INT,
    value TEXT NOT NULL,
    complete BOOLEAN NOT NULL DEFAULT FALSE,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT  todo_owner_id_user_owner_id FOREIGN KEY (user_id) REFERENCES auth.user
  );

  CREATE INDEX todo_user_id_index ON todo.todo (user_id);

COMMIT;
