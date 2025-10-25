-- Fix RLS policies for profiles table to avoid infinite recursion
-- The issue was that policies were querying the profiles table to check if user is admin,
-- which creates a circular reference. We use auth.jwt() to get email from the JWT token.

-- Drop all existing policies
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can read all profiles for CRM" ON public.profiles;
DROP POLICY IF EXISTS "Admins can read all profiles by email" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles for CRM" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles by email" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Allow users to read their own profile (no recursion)
CREATE POLICY "Users can read own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Allow admin users (by email from JWT) to read all profiles
-- This avoids recursion by using the JWT token email claim
CREATE POLICY "Admins can read all profiles by email"
ON public.profiles
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND auth.jwt()->>'email' IN (
    'marianomorales@outlook.com',
    'mariano.morales@autostrefa.mx',
    'genauservices@gmail.com'
  )
);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

-- Allow admin users (by email from JWT) to update all profiles
CREATE POLICY "Admins can update all profiles by email"
ON public.profiles
FOR UPDATE
USING (
  auth.uid() IS NOT NULL
  AND auth.jwt()->>'email' IN (
    'marianomorales@outlook.com',
    'mariano.morales@autostrefa.mx',
    'genauservices@gmail.com'
  )
);

-- Allow users to insert their own profile (for signup)
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Add comments
COMMENT ON POLICY "Admins can read all profiles by email" ON public.profiles IS
'Allows admin users (by email from JWT token) to read all profiles. Uses auth.jwt() to avoid recursion.';

COMMENT ON POLICY "Admins can update all profiles by email" ON public.profiles IS
'Allows admin users (by email from JWT token) to update all profiles. Uses auth.jwt() to avoid recursion.';
