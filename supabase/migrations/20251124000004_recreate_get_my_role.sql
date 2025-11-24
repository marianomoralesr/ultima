-- ============================================================================
-- RECREATE get_my_role() FUNCTION
-- ============================================================================
-- The HTTP 556 issue was NOT caused by this function.
-- Simply recreating it to restore admin/sales privileges.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;

COMMENT ON FUNCTION public.get_my_role() IS
'Returns the role of the current user. Uses SECURITY DEFINER to bypass RLS.';

-- ============================================================================
-- DONE - All existing policies will now work again
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ get_my_role() function recreated';
  RAISE NOTICE '✅ All existing RLS policies will work again';
  RAISE NOTICE '✅ Admins and Sales have their privileges back';
END $$;
