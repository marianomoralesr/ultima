-- Verification script for sales user access to CRM

-- 1. Check if sales role functions exist
SELECT
    proname as function_name,
    pg_get_function_identity_arguments(oid) as arguments
FROM pg_proc
WHERE proname IN (
    'get_sales_client_profile',
    'get_sales_assigned_leads',
    'get_sales_dashboard_stats',
    'verify_sales_access_to_lead',
    'get_leads_for_dashboard'
)
ORDER BY proname;

-- 2. Check RLS policies for profiles table (should allow admin and sales)
SELECT
    policyname,
    CASE cmd
        WHEN 'r' THEN 'SELECT'
        WHEN 'a' THEN 'INSERT'
        WHEN 'w' THEN 'UPDATE'
        WHEN 'd' THEN 'DELETE'
        WHEN '*' THEN 'ALL'
        ELSE cmd::text
    END as command,
    qual as using_expression
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 3. Verify sales users exist
SELECT COUNT(*) as sales_users_count FROM profiles WHERE role = 'sales';

-- 4. Check if get_my_role helper function exists
SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'get_my_role';
