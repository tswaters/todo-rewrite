-- Revert todo:todo.proc.add_todo from pg

BEGIN;

DROP FUNCTION IF EXISTS todo.add_todo(text, text);

COMMIT;
