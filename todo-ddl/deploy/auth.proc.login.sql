-- Deploy todo:auth.proc.login to pg

BEGIN;

CREATE OR REPLACE FUNCTION auth.login (_identifier TEXT, _password TEXT)
RETURNS TABLE (
  user_id INTEGER,
  identifier TEXT,
  roles TEXT[]
)
AS $BODY$
SELECT
  u.user_id,
  u.identifier,
  (
    SELECT array_agg(name)
    FROM auth.role r
    JOIN auth.user_role ur ON (r.role_id = ur.role_id)
    WHERE ur.user_id = u.user_id
  ) as "roles"
FROM auth.vw_users u
WHERE
  lower(u.identifier) = lower(_identifier) AND
  u.password = crypt(_password, password);

$BODY$
LANGUAGE sql STABLE;

COMMIT;
