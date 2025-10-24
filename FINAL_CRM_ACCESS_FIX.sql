-- ============================================================================
-- FINAL CRM ACCESS FIX
-- This fixes "Permission denied to access leads dashboard" error
-- ============================================================================

-- Step 1: Fix get_my_role() to query profiles table directly instead of JWT
-- (The JWT claim 'user_role' may not be set, causing permission issues)
-- ============================================================================

DROP FUNCTION IF EXISTS public.get_my_role();

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  -- Query the profiles table directly instead of relying on JWT claims
  -- This is more reliable since the role is always stored in profiles
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

ALTER FUNCTION public.get_my_role() OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;
COMMENT ON FUNCTION public.get_my_role() IS 'Returns the role of the current authenticated user by querying the profiles table directly';


-- Step 2: Update get_leads_for_dashboard() to use the fixed get_my_role()
-- Also handle the case where auth.uid() might be NULL
-- ============================================================================

DROP FUNCTION IF EXISTS public.get_leads_for_dashboard();

CREATE OR REPLACE FUNCTION public.get_leads_for_dashboard()
RETURNS TABLE(
  id uuid,
  first_name text,
  last_name text,
  email text,
  phone text,
  source text,
  contactado boolean,
  asesor_asignado text,
  latest_app_status text,
  latest_app_car_info jsonb,
  asesor_asignado_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    current_user_id uuid;
    current_user_role user_role;
BEGIN
    -- Get the current user's ID
    current_user_id := auth.uid();

    -- If auth.uid() is NULL, user is not authenticated
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;

    -- Get the user's role directly from profiles table
    SELECT role INTO current_user_role
    FROM profiles
    WHERE profiles.id = current_user_id;

    -- Check if user has permission (must be admin or sales)
    IF current_user_role NOT IN ('admin', 'sales') OR current_user_role IS NULL THEN
        RAISE EXCEPTION 'Permission denied to access leads dashboard. Your role is: %', COALESCE(current_user_role::text, 'NULL');
    END IF;

    -- Return the leads data
    RETURN QUERY
    SELECT
        p.id,
        p.first_name,
        p.last_name,
        p.email,
        p.phone,
        p.source,
        p.contactado,
        (SELECT u.email FROM auth.users u WHERE u.id = p.asesor_asignado_id) as asesor_asignado,
        latest_app.status as latest_app_status,
        latest_app.car_info as latest_app_car_info,
        p.asesor_asignado_id
    FROM
        public.profiles p
    LEFT JOIN LATERAL (
        SELECT fa.status, fa.car_info
        FROM public.financing_applications fa
        WHERE fa.user_id = p.id
        ORDER BY fa.created_at DESC
        LIMIT 1
    ) latest_app ON true
    WHERE p.role = 'user'  -- Only show actual user leads, not admin/sales accounts
    ORDER BY p.updated_at DESC NULLS LAST;
END;
$$;

ALTER FUNCTION public.get_leads_for_dashboard() OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.get_leads_for_dashboard() TO authenticated;


-- Step 3: Verify the fix worked
-- ============================================================================

-- This should return your role (should be 'admin')
SELECT public.get_my_role() as my_role;

-- This should return your auth.uid() (should not be NULL)
SELECT auth.uid() as my_auth_uid;

-- This should work now (if you're admin)
SELECT COUNT(*) as total_leads FROM public.get_leads_for_dashboard();

-- If you still get an error, check this:
SELECT
    auth.uid() as my_id,
    p.role as my_role_in_db,
    p.email
FROM profiles p
WHERE p.id = auth.uid();
