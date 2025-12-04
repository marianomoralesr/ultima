-- ============================================================================
-- EMERGENCY FIX V2 - Only remove the problematic function
-- ============================================================================
-- The policies already exist, we just need to remove the recursive function
-- ============================================================================

-- Drop the recursive function that's causing Auth to fail
DROP FUNCTION IF EXISTS public.get_my_role() CASCADE;

-- Verify it's gone
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'get_my_role'
    AND pronamespace = 'public'::regnamespace
  ) THEN
    RAISE NOTICE '✅ SUCCESS: get_my_role() function has been removed';
    RAISE NOTICE '⏳ Auth service should recover in 1-2 minutes';
  ELSE
    RAISE WARNING '⚠️  Function still exists, trying harder...';
  END IF;
END $$;

-- Also check for any other functions that might be querying profiles in RLS context
SELECT
  'Found potentially problematic function: ' || proname as warning,
  pg_get_functiondef(oid) as definition
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND prosrc ILIKE '%profiles%'
  AND prosrc ILIKE '%auth.uid()%'
  AND proname != 'get_leads_for_dashboard';
