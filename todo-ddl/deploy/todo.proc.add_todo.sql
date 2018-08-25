-- Deploy todo:todo.proc.add_todo to pg
-- requires: todo.schema
-- requires: todo.table.todo

BEGIN;

CREATE OR REPLACE FUNCTION todo.add_todo (_user_id INTEGER, _text TEXT)
RETURNS INTEGER
AS
$BODY$
DECLARE
  _todo_id INTEGER;
BEGIN

  INSERT INTO todo.todo (user_id, value)
  VALUES (_user_id, _text)
  RETURNING todo_id INTO _todo_id;

  RETURN _todo_id;

END
$BODY$
LANGUAGE PLPGSQL
VOLATILE;

COMMIT;
