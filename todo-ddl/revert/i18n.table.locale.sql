-- Revert todo:i18n.table.locale from pg

BEGIN;

DROP TABLE i18n.locale;

COMMIT;
