-- Verify todo:todo.view.vw_todos on pg

BEGIN;

SELECT
  todo_id,
  user_id,
  value,
  complete
FROM todo.vw_todos
WHERE FALSE;

ROLLBACK;
