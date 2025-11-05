-- Test the function directly to see if it works
-- Run this in Supabase SQL Editor while logged in as your admin user

-- First, verify your user and role
SELECT
    'Current User Info' as check_type,
    auth.uid() as user_id,
    p.email,
    p.role
FROM public.profiles p
WHERE p.id = auth.uid();

-- Now try calling the function
SELECT
    'Function Call Test' as check_type,
    COUNT(*) as lead_count
FROM public.get_leads_for_dashboard();

-- Show first lead with all fields to verify structure
SELECT
    'First Lead Sample' as check_type,
    *
FROM public.get_leads_for_dashboard()
LIMIT 1;

-- Verify the function signature
SELECT
    'Function Signature' as check_type,
    p.proname as function_name,
    pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname = 'get_leads_for_dashboard';
