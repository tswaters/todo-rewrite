-- Revert todo:auth.proc.login from pg

BEGIN;

DROP FUNCTION auth.login(text, text);

COMMIT;
