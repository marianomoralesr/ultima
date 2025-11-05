-- ============================================================================
-- CHECK IF USER DATA STILL EXISTS
-- Run this as a SUPERUSER or with service_role key in Supabase SQL Editor
-- ============================================================================

-- Disable RLS temporarily to see all data
SET LOCAL ROLE postgres;

-- Count total users in profiles table
SELECT 'Total profiles' as check_type, COUNT(*) as count
FROM public.profiles;

-- Count users by role
SELECT 'Profiles by role' as check_type, role, COUNT(*) as count
FROM public.profiles
GROUP BY role
ORDER BY count DESC;

-- Show recent profiles (last 50)
SELECT 'Recent 50 profiles' as check_type, id, email, role, created_at
FROM public.profiles
ORDER BY created_at DESC
LIMIT 50;

-- Count financing applications
SELECT 'Total financing applications' as check_type, COUNT(*) as count
FROM public.financing_applications;

-- Check if specific admin users exist
SELECT 'Admin users check' as check_type, email, role, created_at
FROM public.profiles
WHERE email IN (
    'marianomorales@outlook.com',
    'mariano.morales@autostrefa.mx',
    'genauservices@gmail.com',
    'alejandro.trevino@autostrefa.mx',
    'evelia.castillo@autostrefa.mx',
    'fernando.trevino@autostrefa.mx'
)
ORDER BY email;
