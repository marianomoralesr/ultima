-- Fix RLS policies for profiles table to allow admin users to read all profiles
-- This is needed for the CRM page to work

-- Drop existing conflicting policies if they exist
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin users can view all profiles" ON public.profiles;

-- Create a policy that allows users with admin emails to read all profiles
CREATE POLICY "Admins can read all profiles for CRM"
ON public.profiles
FOR SELECT
USING (
  -- Allow if user is authenticated and their email is in the admin list
  auth.uid() IS NOT NULL
  AND (
    (SELECT email FROM auth.users WHERE id = auth.uid()) IN (
      'marianomorales@outlook.com',
      'mariano.morales@autostrefa.mx',
      'genauservices@gmail.com'
    )
    OR
    -- Also allow if user has admin role in their profile
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  )
);

-- Also ensure users can read their own profile
CREATE POLICY IF NOT EXISTS "Users can read own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Ensure admins can update profiles (for contactado, lead_source, etc.)
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

CREATE POLICY "Admins can update profiles for CRM"
ON public.profiles
FOR UPDATE
USING (
  auth.uid() IS NOT NULL
  AND (
    (SELECT email FROM auth.users WHERE id = auth.uid()) IN (
      'marianomorales@outlook.com',
      'mariano.morales@autostrefa.mx',
      'genauservices@gmail.com'
    )
    OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  )
);

-- Add comment
COMMENT ON POLICY "Admins can read all profiles for CRM" ON public.profiles IS
'Allows admin users (by email or role) to read all profiles for CRM dashboard';
