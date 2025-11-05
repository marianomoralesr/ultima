-- ============================================================================
-- ADD NEW ADMIN EMAILS TO RLS POLICIES
-- Add alejandro.trevino@autostrefa.mx, evelia.castillo@autostrefa.mx, and
-- fernando.trevino@autostrefa.mx to the RLS policies
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
