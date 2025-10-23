-- Verification script for trigger fix
-- Run this to verify the trigger function was updated correctly

-- 1. Check the trigger function source code
SELECT
    proname as function_name,
    prosrc as source_code
FROM pg_proc
WHERE proname = 'set_user_id_from_auth';

-- 2. Verify the trigger is attached to the tables
SELECT
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE proname = 'set_user_id_from_auth'
ORDER BY tgrelid::regclass::text;

-- 3. Check if you're authenticated
SELECT
    auth.uid() as current_user_id,
    auth.jwt()->>'email' as current_email;

-- 4. Try a simple insert test (will rollback)
BEGIN;

-- This should work if trigger is fixed
INSERT INTO bank_profiles (respuestas, banco_recomendado, is_complete)
VALUES ('{"test": "data"}'::jsonb, 'BBVA', false)
ON CONFLICT (user_id) DO UPDATE
SET respuestas = EXCLUDED.respuestas
RETURNING user_id, banco_recomendado, is_complete;

ROLLBACK;
