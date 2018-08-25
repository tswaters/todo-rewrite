-- Deploy todo:todo.proc.update_todo_delete to pg
-- requires: todo.schema
-- requires: todo.table.todo

BEGIN;

CREATE OR REPLACE FUNCTION todo.update_todo_delete (_user_id INTEGER, _todo_id INTEGER, _delete BOOLEAN)
RETURNS INTEGER
AS
$BODY$
DECLARE
  _update_count INTEGER;
BEGIN

  UPDATE todo.todo SET
    deleted = _delete
  WHERE
    user_id = _user_id AND
    todo_id = _todo_id;

  GET DIAGNOSTICS _update_count = ROW_COUNT;
  RETURN _update_count;

END
$BODY$
LANGUAGE PLPGSQL
VOLATILE;

COMMIT;
