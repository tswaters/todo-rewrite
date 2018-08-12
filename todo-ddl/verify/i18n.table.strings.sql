-- Verify todo:i18n.table.strings on pg

BEGIN;

SELECT locale_id, key, value FROM i18n.strings WHERE FALSE;

ROLLBACK;
