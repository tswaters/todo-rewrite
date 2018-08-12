-- Deploy todo:i18n.table.locale to pg

BEGIN;

CREATE TABLE i18n.locale (
  locale_id TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

INSERT INTO i18n.locale (locale_id, name)
VALUES ('en', 'english'), ('fr', 'french');

COMMIT;
