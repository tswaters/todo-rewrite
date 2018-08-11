-- Verify todo:auth.proc.add_user on pg

DO $BODY$
DECLARE
  _new_user_id INTEGER;
BEGIN

  SELECT user_id INTO _new_user_id FROM auth.add_user('Admin', '123', TRUE);
  ASSERT EXISTS (SELECT 1 FROM auth.user WHERE user_id = _new_user_id AND identifier = 'Admin'), 'Verification failed, could not find Admin';
  ASSERT EXISTS (SELECT 1 FROM auth.user_role ur JOIN auth.role r ON r.role_id = ur.role_id WHERE user_id = _new_user_id AND r.name = 'USER'), 'Verification failed, Admin not a User';
  ASSERT EXISTS (SELECT 1 FROM auth.user_role ur JOIN auth.role r ON r.role_id = ur.role_id WHERE user_id = _new_user_id AND r.name = 'ADMIN'), 'Verification failed, Admin not an Admin';

  SELECT user_id INTO _new_user_id FROM auth.add_user('User 1', '123', FALSE);
  ASSERT EXISTS (SELECT 1 FROM auth.user WHERE user_id = _new_user_id AND identifier = 'User 1'), 'Verification failed, could not find User 1';
  ASSERT EXISTS (SELECT 1 FROM auth.user_role ur JOIN auth.role r ON r.role_id = ur.role_id WHERE user_id = _new_user_id AND r.name = 'USER'), 'Verification failed, User 1 not a User';
  ASSERT NOT EXISTS (SELECT 1 FROM auth.user_role ur JOIN auth.role r ON r.role_id = ur.role_id WHERE user_id = _new_user_id AND r.name = 'ADMIN'), 'Verification failed, User 1 is an Admin';

  SELECT user_id INTO _new_user_id FROM auth.add_user('User 2', '123');
  ASSERT EXISTS (SELECT 1 FROM auth.user WHERE user_id = _new_user_id AND identifier = 'User 2'), 'Verification failed, could not find User 2';
  ASSERT EXISTS (SELECT 1 FROM auth.user_role ur JOIN auth.role r ON r.role_id = ur.role_id WHERE user_id = _new_user_id AND r.name = 'USER'), 'Verification failed, User 2 not a User';
  ASSERT NOT EXISTS (SELECT 1 FROM auth.user_role ur JOIN auth.role r ON r.role_id = ur.role_id WHERE user_id = _new_user_id AND r.name = 'ADMIN'), 'Verification failed, User 2 is an Admin';

  RAISE EXCEPTION 'Made it';

  EXCEPTION
    WHEN RAISE_EXCEPTION THEN
      RETURN;
END
$BODY$;

