-- Force drop get_my_role function with all possible signatures

-- Try to drop with no parameters
DROP FUNCTION IF EXISTS public.get_my_role();

-- Try to drop with possible legacy signatures
DROP FUNCTION IF EXISTS public.get_my_role() CASCADE;

-- Recreate with correct signature
CREATE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role::text FROM profiles WHERE id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_role() TO anon;

COMMENT ON FUNCTION public.get_my_role() IS
'Returns the role of the current user as text. Uses SECURITY DEFINER to bypass RLS and avoid infinite recursion.';
