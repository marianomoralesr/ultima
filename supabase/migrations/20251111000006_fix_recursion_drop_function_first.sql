-- Fix: Drop and recreate get_my_role function to ensure correct signature

DROP FUNCTION IF EXISTS public.get_my_role();

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
'Returns the role of the current user. Uses SECURITY DEFINER to bypass RLS and avoid recursion.';

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== get_my_role() FUNCTION RECREATED ===';
    RAISE NOTICE '';
    RAISE NOTICE 'Function signature: get_my_role() RETURNS text';
    RAISE NOTICE 'Security: SECURITY DEFINER (bypasses RLS)';
    RAISE NOTICE 'Usage in policies: public.get_my_role() = ''admin''';
    RAISE NOTICE '';
END $$;
