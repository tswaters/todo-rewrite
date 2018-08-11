-- Verify todo:user-table on pg

BEGIN;

  SELECT
    user_id,
    identifier,
    password,
    active
  FROM auth.user
  WHERE FALSE;

ROLLBACK;
