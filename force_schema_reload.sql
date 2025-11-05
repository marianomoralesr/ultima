-- Force Supabase/PostgREST to reload the schema cache
-- This is needed when function signatures change

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';

-- Also, verify the function definition is correct
SELECT
    'Function Verification' as check,
    proname as function_name,
    pronargs as num_args,
    proretset as returns_set,
    pg_get_function_result(oid) as return_type,
    pg_get_functiondef(oid) as full_definition
FROM pg_proc
WHERE proname = 'get_leads_for_dashboard'
AND pronamespace = 'public'::regnamespace;
