-- Revert todo:todo.view.vw_todos from pg

BEGIN;

DROP VIEW IF EXISTS todo.vw_todos;

COMMIT;
