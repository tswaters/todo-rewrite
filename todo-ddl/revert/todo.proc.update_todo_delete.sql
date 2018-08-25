-- Revert todo:todo.proc.update_todo_delete from pg

BEGIN;

DROP FUNCTION IF EXISTS todo.update_todo_delete (INTEGER, INTEGER, BOOLEAN);

COMMIT;
