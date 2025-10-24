-- Fix get_my_role() function to query profiles table instead of JWT claims
-- The JWT claim 'user_role' is never set by handle_new_user trigger, causing permission errors

CREATE OR REPLACE FUNCTION "public"."get_my_role"() RETURNS "text"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  -- Query the profiles table directly instead of relying on JWT claims
  -- This is more reliable since the role is always stored in profiles
  SELECT role::text FROM public.profiles WHERE id = auth.uid();
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION "public"."get_my_role"() TO authenticated;

COMMENT ON FUNCTION "public"."get_my_role"() IS 'Returns the role of the current authenticated user by querying the profiles table directly';
