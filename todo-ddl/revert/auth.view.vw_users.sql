-- Revert todo:auth.view.vw_users from pg

BEGIN;

  DROP VIEW auth.vw_users;

COMMIT;
