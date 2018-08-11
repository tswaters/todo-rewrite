-- Revert todo:auth.proc.add_user from pg

BEGIN;

  DROP FUNCTION IF EXISTS auth.add_user;

COMMIT;
