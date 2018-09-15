-- Verify todo:i18n.proc.update on pg

DO $BODY$
DECLARE
  _update_count INTEGER;
BEGIN

  INSERT INTO i18n.strings (locale_id, key, value)
  VALUES ('en', 'test', 'test');

  SELECT i18n.update('test', 'en', 'test2') INTO _update_count;
  ASSERT _update_count = 1;

  SELECT i18n.update('test', 'fr', 'le test deux') INTO _update_count;
  ASSERT _update_count = 1;

  ASSERT EXISTS (SELECT 1 FROM i18n.strings WHERE key = 'test' AND locale_id = 'en' and value = 'test2');
  ASSERT EXISTS (SELECT 1 FROM i18n.strings WHERE key = 'test' AND locale_id = 'fr' and value = 'le test deux');

  RAISE EXCEPTION 'Made it';

  EXCEPTION
    WHEN RAISE_EXCEPTION THEN
      RETURN;
END
$BODY$;
