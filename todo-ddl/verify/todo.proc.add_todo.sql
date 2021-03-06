-- Verify todo:todo.proc.add_todo on pg

DO $BODY$
DECLARE
  _user_id INTEGER;
  _todo_id INTEGER;
BEGIN

  SELECT user_id INTO _user_id FROM auth.add_user('User', '123');
  SELECT todo.add_todo(_user_id, 'test') INTO _todo_id;

  ASSERT EXISTS (SELECT 1 FROM todo.todo WHERE todo_id = _todo_id AND user_id = _user_id AND value = 'test');

  RAISE EXCEPTION 'Made it';

  EXCEPTION
    WHEN RAISE_EXCEPTION THEN
      RETURN;
END
$BODY$;
