-- This migration fixes the Row Level Security (RLS) policies for the 'profiles' table.
-- The previous policies were incomplete, lacking an INSERT rule and proper UPDATE checks,
-- which caused "violates row level security" errors when new users tried to save their profile.
-- This script replaces all old policies on the 'profiles' table with a complete, secure set.

-- Drop all existing RLS policies on the profiles table to avoid conflicts.
DROP POLICY IF EXISTS "Users can view their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Admins and sales can manage all profiles." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable full access for admin and sales roles" ON public.profiles;


-- Create a complete and correct set of policies for the 'profiles' table.

-- 1. Allow any authenticated user to INSERT their own profile row.
-- The 'id' of the new row must match their authentication ID.
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. Allow users to SELECT (view) their own profile.
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- 3. Allow users to UPDATE their own profile.
-- The USING clause checks which rows they are allowed to update.
-- The WITH CHECK clause ensures they can't change the 'id' to someone else's.
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 4. Allow admin and sales roles to have full access to all profiles.
CREATE POLICY "Admins and sales can manage all profiles" ON public.profiles
  FOR ALL USING (get_my_role() IN ('admin', 'sales')) WITH CHECK (get_my_role() IN ('admin', 'sales'));
