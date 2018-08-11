-- Revert todo:user-table from pg

BEGIN;

  DROP TABLE IF EXISTS auth.user_role;
  DROP TABLE IF EXISTS auth.user;
  DROP TABLE IF EXISTS auth.role;

COMMIT;
