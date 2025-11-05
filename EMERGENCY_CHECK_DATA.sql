-- ============================================================================
-- EMERGENCY: CHECK IF DATA ACTUALLY DELETED OR JUST BLOCKED BY RLS
-- Run this in Supabase SQL Editor to bypass all RLS policies
-- ============================================================================

-- Temporarily disable RLS to see ALL data
SET ROLE postgres;

-- Count ALL profiles (bypassing RLS completely)
SELECT
    'TOTAL PROFILES (bypassing RLS)' as check,
    COUNT(*) as count
FROM public.profiles;

-- Show sample of profiles by role
SELECT
    'PROFILES BY ROLE' as check,
    role,
    COUNT(*) as count
FROM public.profiles
GROUP BY role
ORDER BY count DESC;

-- Show last 20 profiles created (to see if user data exists)
SELECT
    'LAST 20 PROFILES CREATED' as check,
    id,
    email,
    first_name,
    last_name,
    role,
    created_at
FROM public.profiles
ORDER BY created_at DESC
LIMIT 20;

-- Check auth.users table (this is where Supabase stores actual user accounts)
SELECT
    'TOTAL AUTH USERS' as check,
    COUNT(*) as count
FROM auth.users;

-- Show recent auth users
SELECT
    'RECENT AUTH USERS' as check,
    id,
    email,
    created_at,
    last_sign_in_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 20;

-- Check if profiles exist in auth.users but not in public.profiles
SELECT
    'USERS WITHOUT PROFILES' as check,
    COUNT(*) as orphaned_count
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = au.id
);

-- Show users that exist in auth but not in profiles
SELECT
    'ORPHANED AUTH USERS (no profile)' as check,
    au.id,
    au.email,
    au.created_at
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = au.id
)
ORDER BY au.created_at DESC
LIMIT 20;

-- Count financing applications
SELECT
    'TOTAL FINANCING APPLICATIONS' as check,
    COUNT(*) as count
FROM public.financing_applications;

-- Reset role to normal
RESET ROLE;
