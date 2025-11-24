-- EMERGENCY FIX: Restore RLS Policies for Profiles and Roadmap
-- Run this IMMEDIATELY in Supabase SQL Editor to restore access

-- ============================================================
-- PART 1: FIX PROFILES TABLE RLS
-- ============================================================

-- Drop all existing policies on profiles (in case they're broken)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.profiles;

-- Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view their own profile
CREATE POLICY "Users can view own profile"
    ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Policy 2: Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Policy 3: Users can insert their own profile
CREATE POLICY "Users can insert own profile"
    ON public.profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Policy 4: Admins can view all profiles
CREATE POLICY "Admin users can view all profiles"
    ON public.profiles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Policy 5: Allow authenticated users to read profiles (needed for CRM)
CREATE POLICY "Authenticated users can view profiles"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (true);

-- ============================================================
-- PART 2: FIX ROADMAP_ITEMS TABLE RLS
-- ============================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view published roadmap items" ON public.roadmap_items;
DROP POLICY IF EXISTS "Admin users can manage all roadmap items" ON public.roadmap_items;

-- Ensure RLS is enabled
ALTER TABLE public.roadmap_items ENABLE ROW LEVEL SECURITY;

-- Policy 1: Anyone can view published items
CREATE POLICY "Anyone can view published roadmap items"
    ON public.roadmap_items
    FOR SELECT
    USING (is_published = true);

-- Policy 2: Admins can do everything
CREATE POLICY "Admin users can manage all roadmap items"
    ON public.roadmap_items
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- ============================================================
-- PART 3: VERIFICATION QUERIES
-- ============================================================

-- Check profiles policies
SELECT
    'Profiles RLS Policies' as table_name,
    policyname,
    cmd as operation,
    CASE WHEN qual IS NOT NULL THEN 'Has USING' ELSE 'No USING' END as using_clause,
    CASE WHEN with_check IS NOT NULL THEN 'Has WITH CHECK' ELSE 'No WITH CHECK' END as check_clause
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Check roadmap_items policies
SELECT
    'Roadmap Items RLS Policies' as table_name,
    policyname,
    cmd as operation,
    CASE WHEN qual IS NOT NULL THEN 'Has USING' ELSE 'No USING' END as using_clause,
    CASE WHEN with_check IS NOT NULL THEN 'Has WITH CHECK' ELSE 'No WITH CHECK' END as check_clause
FROM pg_policies
WHERE tablename = 'roadmap_items'
ORDER BY policyname;

-- Test profile access (should return your profile)
SELECT
    'Your Profile' as test,
    id,
    email,
    full_name,
    role
FROM profiles
WHERE id = auth.uid();

-- ============================================================
-- EXPECTED RESULTS:
-- ============================================================
-- After running this script you should see:
-- 1. 5 policies on profiles table
-- 2. 2 policies on roadmap_items table
-- 3. Your profile information in the test query
-- ============================================================
