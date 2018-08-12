-- Deploy todo:i18n.table.strings to pg
-- requires: i18n.schema
-- requires: i18n.table.locale

BEGIN;

CREATE TABLE i18n.strings (
  key TEXT NOT NULL,
  locale_id TEXT NOT NULL REFERENCES i18n.locale,
  value TEXT NOT NULL,
  CONSTRAINT strings_pk PRIMARY KEY (key, locale_id),
  CONSTRAINT strings_locale_id_fk FOREIGN KEY (locale_id) REFERENCES i18n.locale
);

COMMIT;
