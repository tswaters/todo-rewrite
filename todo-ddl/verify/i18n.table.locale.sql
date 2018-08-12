-- Verify todo:i18n.table.locale on pg

BEGIN;

SELECT locale_id, name FROM i18n.locale WHERE FALSE;

SELECT 1 / count(1) FROM i18n.locale WHERE locale_id = 'en';
SELECT 1 / count(1) FROM i18n.locale WHERE locale_id = 'fr';

ROLLBACK;
