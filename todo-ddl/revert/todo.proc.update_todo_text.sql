-- Revert todo:todo.proc.update_todo_text from pg

BEGIN;

DROP FUNCTION IF EXISTS todo.update_todo_text(INTEGER, INTEGER, TEXT);

COMMIT;
