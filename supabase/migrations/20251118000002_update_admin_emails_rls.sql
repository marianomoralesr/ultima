-- ============================================================================
-- UPDATE ADMIN EMAILS IN RLS POLICIES
-- Update all admin email lists to match the authorized TREFA team members
-- Includes: mariano.morales, evelia.castillo, alejandro.trevino,
--           fernando.trevino, alejandro.gallardo, lizeth.juarez
-- ============================================================================

-- Drop existing policies that use email-based admin checks
DROP POLICY IF EXISTS "Admins can read all profiles by email" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles by email" ON public.profiles;

-- Recreate read policy with complete admin email list
CREATE POLICY "Admins can read all profiles by email"
ON public.profiles
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND auth.jwt()->>'email' IN (
    'marianomorales@outlook.com',
    'mariano.morales@autostrefa.mx',
    'evelia.castillo@autostrefa.mx',
    'alejandro.trevino@autostrefa.mx',
    'fernando.trevino@autostrefa.mx',
    'alejandro.gallardo@autostrefa.mx',
    'lizeth.juarez@autostrefa.mx'
  )
);

-- Recreate update policy with complete admin email list
CREATE POLICY "Admins can update all profiles by email"
ON public.profiles
FOR UPDATE
USING (
  auth.uid() IS NOT NULL
  AND auth.jwt()->>'email' IN (
    'marianomorales@outlook.com',
    'mariano.morales@autostrefa.mx',
    'evelia.castillo@autostrefa.mx',
    'alejandro.trevino@autostrefa.mx',
    'fernando.trevino@autostrefa.mx',
    'alejandro.gallardo@autostrefa.mx',
    'lizeth.juarez@autostrefa.mx'
  )
);

-- Add comments
COMMENT ON POLICY "Admins can read all profiles by email" ON public.profiles IS
'Allows TREFA admin users (by email from JWT token) to read all profiles. Uses auth.jwt() to avoid recursion.';

COMMENT ON POLICY "Admins can update all profiles by email" ON public.profiles IS
'Allows TREFA admin users (by email from JWT token) to update all profiles. Uses auth.jwt() to avoid recursion.';
