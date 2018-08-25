-- Deploy todo:todo.view.vw_todos to pg
-- requires: todo.schema
-- requires: todo.table.todo

BEGIN;

CREATE VIEW todo.vw_todos AS
SELECT
  t.todo_id,
  t.user_id,
  t.value,
  t.complete
FROM todo.todo t
WHERE t.deleted = FALSE
ORDER BY todo_id ASC;

COMMIT;
