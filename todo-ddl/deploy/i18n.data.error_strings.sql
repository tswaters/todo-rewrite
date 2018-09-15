-- Deploy todo:i18n.data.error_strings to pg
-- requires: i18n.schema
-- requires: i18n.table.strings

BEGIN;

INSERT INTO i18n.strings (key, locale_id, value)
VALUES
  ('ERROR.NOT-FOUND', 'en', 'could not find %s'),
  ('ERROR.KEY_NOT_PROVIDED', 'en', 'key must be provided'),
  ('ERROR.KEYS_NOT_PROVIDED', 'en', 'keys must be provided'),
  ('ERROR.LOCALE_NOT_PROVIDED', 'en', 'locale must be provided'),
  ('ERROR.VALUE_NOT_PROVIDED', 'en', 'value must be provided'),
  ('ERROR.IDENTIFIER_NOT_PROVIDED', 'en', 'identifier must be provided'),
  ('ERROR.TOKEN_INVALID', 'en', 'invalid token provided'),
  ('ERROR.PASSWORD_NOT_PROVIDED', 'en', 'password must be provided'),
  ('ERROR.TODO_ID_NOT_PROVIDED', 'en', 'todo_id must be provided'),
  ('ERROR.TEXT_NOT_PROVIDED', 'en', 'text must be provided'),
  ('ERROR.COMPLETE_NOT_PROVIDED', 'en', 'complete must be provided'),
  ('ERROR.LOCALIZATION_NOT_UPDATED', 'en', 'could not update localization'),
  ('ERROR.TODO_NOT_ADDED', 'en', 'could not add todo'),
  ('ERROR.TODO_NOT_COMPLETED', 'en', 'could not complete todo'),
  ('ERROR.TODO_NOT_UPDATED', 'en', 'could not update todo'),
  ('ERROR.TODO_NOT_RESTORED', 'en', 'could not restore todo'),
  ('ERROR.TODO_NOT_DELETED', 'en', 'could not delete todo'),
  ('ERROR.INVALID_USER', 'en', 'invalid username or password'),
  ('ERROR.UNAUTHORIZED', 'en', 'you must login to do that!'),
  ('ERROR.DATABASE_ERROR', 'en', 'unexpected problem occurred'),
  ('ERROR.DUPLICATE_USER', 'en', 'user account already exists')
;

COMMIT;
