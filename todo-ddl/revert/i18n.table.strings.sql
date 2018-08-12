-- Revert todo:i18n.table.strings from pg

BEGIN;

DROP TABLE i18n.strings;

COMMIT;
