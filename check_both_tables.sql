-- Check BOTH applications tables

-- 1. Check if both tables exist
SELECT
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('applications', 'financing_applications')
ORDER BY tablename;

-- 2. Check RLS policies for 'applications' table
SELECT
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE tablename = 'applications'
ORDER BY cmd, policyname;

-- 3. Check RLS policies for 'financing_applications' table
SELECT
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE tablename = 'financing_applications'
ORDER BY cmd, policyname;

-- 4. Check triggers on BOTH tables
SELECT
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    tgenabled as enabled
FROM pg_trigger
WHERE tgrelid::regclass::text IN ('applications', 'financing_applications')
AND tgname LIKE '%user_id%'
ORDER BY tgrelid::regclass::text;
