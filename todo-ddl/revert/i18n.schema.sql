-- Revert todo:i18n.schema from pg

BEGIN;

DROP SCHEMA i18n;

COMMIT;
