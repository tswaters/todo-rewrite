-- Deploy todo:i18n.proc.update to pg
-- requires: i18n.schema
-- requires: i18n.table.locale
-- requires: i18n.table.strings

BEGIN;

CREATE OR REPLACE FUNCTION i18n.update (_key TEXT, _locale_id TEXT, _value TEXT)
RETURNS INTEGER
AS
$BODY$
DECLARE
  _update_count INTEGER;
BEGIN

  IF NOT EXISTS (SELECT 1 FROM i18n.strings WHERE key = _key AND locale_id = _locale_id) THEN

    INSERT INTO i18n.strings (key, locale_id, value)
    VALUES (_key, _locale_id, _value);

  ELSE

    UPDATE i18n.strings
    SET value = _value
    WHERE key = _key AND locale_id = _locale_id;

  END IF;

  GET DIAGNOSTICS _update_count = ROW_COUNT;
  RETURN _update_count;

END $BODY$
LANGUAGE PLPGSQL
VOLATILE;

COMMIT;
