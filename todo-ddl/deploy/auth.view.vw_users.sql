-- Deploy todo:auth.view.vw_users to pg
-- requires: auth.schema
-- requires: auth.table.user

BEGIN;

CREATE VIEW auth.vw_users AS
SELECT
  u.user_id,
  u.identifier,
  u.password,
  u.active,
  (
    SELECT array_agg(name)
    FROM auth.role r
    JOIN auth.user_role ur ON (r.role_id = ur.role_id)
    WHERE ur.user_id = u.user_id
  ) as "roles"
FROM auth.user u
WHERE u.active = TRUE;

COMMIT;
