-- Fix infinite recursion in profiles RLS policies
-- The "Admin users can view all profiles" policy was causing infinite recursion
-- because it queried the profiles table to check if user is admin, which triggered RLS again

-- Drop the problematic policy
DROP POLICY IF EXISTS "Admin users can view all profiles" ON profiles;

-- We don't need this policy because:
-- 1. Admin access is handled through SECURITY DEFINER functions (get_secure_client_profile, get_leads_for_dashboard)
-- 2. These functions use get_my_role() which is SECURITY DEFINER and bypasses RLS
-- 3. Regular users can only see their own profile via "Users can view own profile" policy
-- 4. Sales users use their own SECURITY DEFINER functions (get_sales_client_profile, get_sales_assigned_leads)

-- The existing policies are sufficient:
-- - "Users can view own profile" - allows users to see their own profile
-- - "Users can update own profile" - allows users to update their own profile
-- - "Users can insert own profile" - allows profile creation on signup
-- - "Authenticated users can view profiles" - allows basic profile lookups

-- Verify policies
SELECT policyname,
       CASE cmd
           WHEN 'r' THEN 'SELECT'
           WHEN 'a' THEN 'INSERT'
           WHEN 'w' THEN 'UPDATE'
           WHEN 'd' THEN 'DELETE'
           WHEN '*' THEN 'ALL'
           ELSE cmd::text
       END as command
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;
