-- Verify todo:table.todo.todo on pg

BEGIN;

  SELECT
    todo_id,
    user_id,
    value,
    complete,
    deleted
  FROM todo.todo
  WHERE FALSE;

ROLLBACK;
