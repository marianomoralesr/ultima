-- ============================================================================
-- DEEP DIAGNOSIS - Find what's still breaking Auth
-- ============================================================================

-- 1. Check if there are any triggers on auth.users that might be failing
SELECT
  'TRIGGER: ' || trigger_name as issue,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users';

-- 2. Check for any RLS policies that might be too complex
SELECT
  'POLICY: ' || schemaname || '.' || tablename || ' - ' || policyname as issue,
  'CMD: ' || cmd as command,
  CASE
    WHEN qual IS NOT NULL THEN 'USING: ' || qual
    ELSE 'No USING clause'
  END as using_clause,
  CASE
    WHEN with_check IS NOT NULL THEN 'WITH CHECK: ' || with_check
    ELSE 'No WITH CHECK'
  END as with_check_clause
FROM pg_policies
WHERE schemaname IN ('public', 'auth')
  AND (qual ILIKE '%profiles%' OR with_check ILIKE '%profiles%')
ORDER BY schemaname, tablename, policyname;

-- 3. Check if supabase_auth_admin has proper ownership
SELECT
  schemaname,
  tablename,
  tableowner,
  CASE
    WHEN tableowner = 'supabase_auth_admin' THEN '✅ Correct owner'
    ELSE '❌ WRONG OWNER - Should be supabase_auth_admin'
  END as status
FROM pg_tables
WHERE schemaname = 'auth'
ORDER BY tablename;

-- 4. Check for foreign keys pointing to auth schema
SELECT
  'FK: ' || tc.table_schema || '.' || tc.table_name || ' -> ' || ccu.table_schema || '.' || ccu.table_name as issue,
  tc.constraint_name,
  kcu.column_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_schema = 'auth';

-- 5. Look for any remaining problematic functions
SELECT
  'FUNCTION: ' || proname as issue,
  pg_get_functiondef(oid) as definition
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND (
    prosrc ILIKE '%SELECT%role%FROM%profiles%WHERE%id%=%auth.uid()%'
    OR prosrc ILIKE '%get_my_role%'
  );

-- 6. Check postgres logs for recent errors (if we have access)
-- This part might not work depending on permissions
SELECT
  'Recent auth errors found in logs' as notice;
