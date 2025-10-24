-- Fix get_my_role() function to query profiles table instead of JWT claims
-- The JWT claim 'user_role' is never set by handle_new_user trigger, causing permission errors

-- Drop all versions of the function (handles both text and user_role return types)
DROP FUNCTION IF EXISTS "public"."get_my_role"() CASCADE;

-- Recreate get_my_role() function to query profiles table instead of JWT claims
CREATE FUNCTION "public"."get_my_role"()
RETURNS "public"."user_role"
LANGUAGE "sql"
STABLE
SECURITY DEFINER
AS $$
  -- Query the profiles table directly instead of relying on JWT claims
  -- This is more reliable since the role is always stored in profiles
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Set owner
ALTER FUNCTION "public"."get_my_role"() OWNER TO "postgres";

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION "public"."get_my_role"() TO authenticated;

-- Add comment
COMMENT ON FUNCTION "public"."get_my_role"() IS 'Returns the role of the current authenticated user by querying the profiles table directly';
