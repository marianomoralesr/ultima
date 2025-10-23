-- Verify authentication and trigger

-- 1. CHECK: Are you authenticated in SQL editor?
SELECT
    auth.uid() as current_user_id,
    auth.jwt()->>'email' as current_email;

-- If auth.uid() is NULL, the SQL editor is NOT authenticated!
-- This is why the trigger sets user_id to NULL.

-- 2. CHECK: Triggers exist?
SELECT
    tgname as trigger_name,
    tgenabled as enabled,
    tgrelid::regclass as table_name
FROM pg_trigger
WHERE tgname LIKE '%set_user_id%'
ORDER BY tgrelid::regclass::text;

-- 3. CHECK: Function source
SELECT prosrc
FROM pg_proc
WHERE proname = 'set_user_id_from_auth';

-- 4. WORKAROUND: Since SQL editor isn't authenticated, test with explicit user_id
-- First, get a real user ID
SELECT id, email, role
FROM profiles
WHERE role = 'user'
LIMIT 1;

-- 5. TEST: Try inserting with explicit user_id (this should work)
BEGIN;
INSERT INTO financing_applications (user_id, status)
VALUES (
    (SELECT id FROM profiles WHERE role = 'user' LIMIT 1),
    'draft'
)
RETURNING id, user_id, status;
ROLLBACK;
