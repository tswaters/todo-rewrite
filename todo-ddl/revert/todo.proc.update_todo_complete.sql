-- Revert todo:todo.proc.update_todo_complete from pg

BEGIN;

DROP FUNCTION IF EXISTS todo.update_todo_complete (INTEGER, INTEGER, BOOLEAN);

COMMIT;
