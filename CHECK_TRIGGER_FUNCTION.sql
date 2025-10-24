-- Check what the handle_updated_at() function does
SELECT
    pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE proname = 'handle_updated_at';

-- Also check if there are any other triggers or functions that might be interfering
SELECT
    n.nspname as schema,
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    p.prosrc as source_code
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname LIKE '%profile%'
ORDER BY p.proname;
