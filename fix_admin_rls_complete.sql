-- ============================================================================
-- COMPLETE FIX FOR ADMIN RLS POLICIES
-- This script adds alejandro.trevino@autostrefa.mx, evelia.castillo@autostrefa.mx,
-- and fernando.trevino@autostrefa.mx to ALL relevant RLS policies
--
-- INSTRUCTIONS:
-- 1. Go to https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu/sql/new
-- 2. Copy and paste this entire script
-- 3. Click "Run" to execute
-- ============================================================================

-- ============================================================================
-- STEP 1: Update profiles table RLS policies
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can read all profiles by email" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles by email" ON public.profiles;

-- Recreate read policy with all admin emails
CREATE POLICY "Admins can read all profiles by email"
ON public.profiles
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND auth.jwt()->>'email' IN (
    'marianomorales@outlook.com',
    'mariano.morales@autostrefa.mx',
    'genauservices@gmail.com',
    'alejandro.trevino@autostrefa.mx',
    'evelia.castillo@autostrefa.mx',
    'fernando.trevino@autostrefa.mx'
  )
);

-- Recreate update policy with all admin emails
CREATE POLICY "Admins can update all profiles by email"
ON public.profiles
FOR UPDATE
USING (
  auth.uid() IS NOT NULL
  AND auth.jwt()->>'email' IN (
    'marianomorales@outlook.com',
    'mariano.morales@autostrefa.mx',
    'genauservices@gmail.com',
    'alejandro.trevino@autostrefa.mx',
    'evelia.castillo@autostrefa.mx',
    'fernando.trevino@autostrefa.mx'
  )
);

-- Add comments
COMMENT ON POLICY "Admins can read all profiles by email" ON public.profiles IS
'Allows admin users (by email from JWT token) to read all profiles. Uses auth.jwt() to avoid recursion. Updated to include all admin emails.';

COMMENT ON POLICY "Admins can update all profiles by email" ON public.profiles IS
'Allows admin users (by email from JWT token) to update all profiles. Uses auth.jwt() to avoid recursion. Updated to include all admin emails.';

-- ============================================================================
-- STEP 2: Verify alejandro.trevino's profile has admin role
-- ============================================================================

-- Update alejandro.trevino's role to admin if it's not already
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'alejandro.trevino@autostrefa.mx'
  AND role != 'admin';

-- Update evelia.castillo's role to admin if it's not already
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'evelia.castillo@autostrefa.mx'
  AND role != 'admin';

-- Update fernando.trevino's role to admin if it's not already
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'fernando.trevino@autostrefa.mx'
  AND role != 'admin';

-- ============================================================================
-- STEP 3: Verify the changes
-- ============================================================================

-- Show all admin users
SELECT id, email, role, created_at
FROM public.profiles
WHERE role = 'admin'
ORDER BY created_at;
