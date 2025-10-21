-- FIX uploaded_documents table RLS
-- Copy and paste this entire file into Supabase SQL Editor

-- Step 1: Drop ALL triggers on uploaded_documents
DO $$
DECLARE
    trig RECORD;
BEGIN
    FOR trig IN
        SELECT trigger_name
        FROM information_schema.triggers
        WHERE event_object_table = 'uploaded_documents'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON uploaded_documents CASCADE;', trig.trigger_name);
        RAISE NOTICE 'Dropped trigger: %', trig.trigger_name;
    END LOOP;
END $$;

-- Step 2: Force drop ALL policies on uploaded_documents
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE tablename = 'uploaded_documents'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON uploaded_documents CASCADE;', pol.policyname);
        RAISE NOTICE 'Dropped policy: %', pol.policyname;
    END LOOP;
END $$;

-- Step 3: Force disable RLS on uploaded_documents
ALTER TABLE uploaded_documents DISABLE ROW LEVEL SECURITY;

-- Step 4: Verify everything
SELECT 'Verification Results for uploaded_documents:' as info;

SELECT
    'RLS Status' as check_type,
    tablename,
    CASE WHEN rowsecurity THEN 'ENABLED ❌' ELSE 'DISABLED ✓' END as status
FROM pg_tables
WHERE tablename = 'uploaded_documents'
UNION ALL
SELECT
    'Policies Count' as check_type,
    'uploaded_documents' as tablename,
    COUNT(*)::text || ' policies' as status
FROM pg_policies
WHERE tablename = 'uploaded_documents'
UNION ALL
SELECT
    'Triggers Count' as check_type,
    'uploaded_documents' as tablename,
    COUNT(*)::text || ' triggers' as status
FROM information_schema.triggers
WHERE event_object_table = 'uploaded_documents';
