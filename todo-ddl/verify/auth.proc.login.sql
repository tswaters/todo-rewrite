-- Verify todo:auth.proc.login on pg

DO $BODY$
DECLARE
  _new_user_id INTEGER;
  _identifier TEXT;
BEGIN

  PERFORM auth.add_user('Admin', 'p@ssword', TRUE);

  SELECT identifier FROM auth.login('Admin', 'invalid') INTO _identifier;
  ASSERT _identifier IS NULL, 'invalid password allowed';

  SELECT identifier FROM auth.login('Admin', 'p@ssword') INTO _identifier;
  ASSERT _identifier = 'Admin', 'valid password not allowed';

  RAISE EXCEPTION 'Made it';

  EXCEPTION
    WHEN RAISE_EXCEPTION THEN
      RETURN;
END
$BODY$;

