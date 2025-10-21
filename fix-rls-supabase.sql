-- NUCLEAR FIX: Force disable everything on financing_applications
-- Copy and paste this entire file into Supabase SQL Editor

-- Step 1: Drop ALL triggers
DO $$
DECLARE
    trig RECORD;
BEGIN
    FOR trig IN
        SELECT trigger_name
        FROM information_schema.triggers
        WHERE event_object_table = 'financing_applications'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON financing_applications CASCADE;', trig.trigger_name);
        RAISE NOTICE 'Dropped trigger: %', trig.trigger_name;
    END LOOP;
END $$;

-- Step 2: Force drop ALL policies
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE tablename = 'financing_applications'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON financing_applications CASCADE;', pol.policyname);
        RAISE NOTICE 'Dropped policy: %', pol.policyname;
    END LOOP;
END $$;

-- Step 3: Force disable RLS
ALTER TABLE financing_applications DISABLE ROW LEVEL SECURITY;

-- Step 4: Verify everything
SELECT 'Verification Results:' as info;

SELECT
    'RLS Status' as check_type,
    tablename,
    CASE WHEN rowsecurity THEN 'ENABLED ❌' ELSE 'DISABLED ✓' END as status
FROM pg_tables
WHERE tablename = 'financing_applications'
UNION ALL
SELECT
    'Policies Count' as check_type,
    'financing_applications' as tablename,
    COUNT(*)::text || ' policies' as status
FROM pg_policies
WHERE tablename = 'financing_applications'
UNION ALL
SELECT
    'Triggers Count' as check_type,
    'financing_applications' as tablename,
    COUNT(*)::text || ' triggers' as status
FROM information_schema.triggers
WHERE event_object_table = 'financing_applications';
