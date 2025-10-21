-- Add an INSERT policy to the profiles table to allow new users to create their own profile.
-- This is necessary because the original RLS policies were missing an INSERT rule,
-- which caused an error for any new user trying to save their profile for the first time.

CREATE POLICY "Users can insert their own profile." ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
