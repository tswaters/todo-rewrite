-- Revert todo:i18n.proc.update from pg

BEGIN;

DROP FUNCTION i18n.update(TEXT, TEXT, TEXT);

COMMIT;
