-- Revert todo:table.todo.todo from pg

BEGIN;

  DROP TABLE IF EXISTS todo.todo;

COMMIT;
