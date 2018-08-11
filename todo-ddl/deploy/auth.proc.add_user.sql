-- Deploy todo:auth.proc.add_user to pg
-- requires: auth.schema
-- requires: auth.table.user
-- requires: auth.view.vw_users

BEGIN;

CREATE OR REPLACE FUNCTION auth.add_user (_identifier TEXT, _password TEXT, _admin BOOLEAN = FALSE)
RETURNS TABLE (
  user_id INTEGER,
  identifier TEXT,
  roles TEXT[]
)
AS
$BODY$
DECLARE
  _user_id INTEGER;
  _role_admin INTEGER;
  _role_user INTEGER;
BEGIN

  SELECT role_id INTO _role_user FROM auth.role WHERE name = 'USER';
  SELECT role_id INTO _role_admin FROM auth.role WHERE name = 'ADMIN';

  INSERT INTO auth.user AS u (identifier, password)
  VALUES (_identifier, crypt(_password, gen_salt('bf')))
  RETURNING u.user_id INTO _user_id;

  INSERT INTO auth.user_role (user_id, role_id)
  VALUES (_user_id, _role_user);

  IF _admin THEN
    INSERT INTO auth.user_role (user_id, role_id)
    VALUES (_user_id, _role_admin);
  END IF;

  RETURN QUERY SELECT
    u.user_id,
    u.identifier,
    (
      SELECT array_agg(name)
      FROM auth.role r
      JOIN auth.user_role ur ON (r.role_id = ur.role_id)
      WHERE ur.user_id = u.user_id
    ) as "roles"
  FROM auth.vw_users u
  WHERE u.user_id = _user_id;

END
$BODY$
LANGUAGE PLPGSQL
VOLATILE;

COMMIT;
