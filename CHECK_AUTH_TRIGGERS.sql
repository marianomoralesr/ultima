-- ============================================================================
-- CHECK IF handle_new_user TRIGGER IS ATTACHED TO auth.users
-- ============================================================================

-- Check triggers on auth.users table
SELECT
    tgname as trigger_name,
    tgenabled as enabled,
    tgtype,
    pg_get_triggerdef(oid) as trigger_definition
FROM pg_trigger
WHERE tgrelid = 'auth.users'::regclass
AND tgname NOT LIKE 'RI_%'
ORDER BY tgname;

-- Check if the handle_new_user function exists
SELECT
    proname as function_name,
    prosrc as source_code
FROM pg_proc
WHERE proname = 'handle_new_user';

-- Test: Check recent users in auth.users vs profiles
SELECT
    'auth.users' as source,
    u.id,
    u.email,
    u.created_at,
    'No matching profile' as note
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL
ORDER BY u.created_at DESC
LIMIT 10;

-- Also show recent profiles
SELECT
    'profiles' as source,
    id,
    email,
    role,
    created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 10;
