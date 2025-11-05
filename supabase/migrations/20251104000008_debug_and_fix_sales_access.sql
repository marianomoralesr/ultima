-- Debug and fix sales access issues
-- This migration will help identify and fix the problem

-- Step 1: Check if any users have the 'sales' role
DO $$
DECLARE
    sales_count INT;
    admin_count INT;
BEGIN
    SELECT COUNT(*) INTO sales_count FROM public.profiles WHERE role = 'sales';
    SELECT COUNT(*) INTO admin_count FROM public.profiles WHERE role = 'admin';

    RAISE NOTICE '=== Role Distribution ===';
    RAISE NOTICE 'Users with admin role: %', admin_count;
    RAISE NOTICE 'Users with sales role: %', sales_count;

    IF sales_count = 0 THEN
        RAISE NOTICE 'WARNING: No users have the sales role!';
    END IF;
END $$;

-- Step 2: Recreate the function with proper permissions (exactly as it should be)
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
  asesor_asignado_id uuid,
  last_sign_in_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  rfdm text,
  referrer text,
  landing_page text,
  first_visit_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_role text;
    current_user_id uuid;
BEGIN
    -- Get current user
    current_user_id := auth.uid();

    -- Get role from profiles table
    SELECT p.role INTO user_role
    FROM public.profiles p
    WHERE p.id = current_user_id;

    -- Debug logging
    RAISE NOTICE 'User ID: %, Role: %', current_user_id, user_role;

    -- Allow both admin and sales roles
    IF user_role IS NULL THEN
        RAISE EXCEPTION 'User not found in profiles table. User ID: %', current_user_id;
    END IF;

    IF user_role NOT IN ('admin', 'sales') THEN
        RAISE EXCEPTION 'Permission denied. User has role "%" but needs "admin" or "sales"', user_role;
    END IF;

    -- If we get here, user has permission
    RAISE NOTICE 'Permission granted for user with role: %', user_role;

    RETURN QUERY
    SELECT
        p.id,
        p.first_name,
        p.last_name,
        p.email,
        p.phone,
        p.source,
        p.contactado,
        COALESCE(asesor.email, '')::text as asesor_asignado,
        latest_app.status as latest_app_status,
        latest_app.car_info as latest_app_car_info,
        p.asesor_asignado_id,
        p.last_sign_in_at,
        p.created_at,
        p.updated_at,
        p.utm_source,
        p.utm_medium,
        p.utm_campaign,
        p.utm_term,
        p.utm_content,
        p.rfdm,
        p.referrer,
        p.landing_page,
        p.first_visit_at
    FROM
        public.profiles p
    LEFT JOIN public.profiles asesor ON asesor.id = p.asesor_asignado_id
    LEFT JOIN LATERAL (
        SELECT fa.status, fa.car_info
        FROM public.financing_applications fa
        WHERE fa.user_id = p.id
        ORDER BY fa.created_at DESC
        LIMIT 1
    ) latest_app ON true
    WHERE p.role = 'user'
    ORDER BY p.last_sign_in_at DESC NULLS LAST;
END;
$$;

-- Step 3: Set proper ownership and permissions
ALTER FUNCTION public.get_leads_for_dashboard() OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.get_leads_for_dashboard() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_leads_for_dashboard() TO anon;

COMMENT ON FUNCTION public.get_leads_for_dashboard() IS 'Returns leads for CRM dashboard with timestamps and source tracking. Only returns profiles with role=user. Requires admin or sales role. SECURITY DEFINER allows bypassing RLS.';

-- Step 4: Verify function signature matches what frontend expects
DO $$
DECLARE
    func_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.proname = 'get_leads_for_dashboard'
    ) INTO func_exists;

    IF func_exists THEN
        RAISE NOTICE '✓ Function get_leads_for_dashboard exists';
    ELSE
        RAISE EXCEPTION '✗ Function get_leads_for_dashboard does NOT exist!';
    END IF;
END $$;

-- Step 5: Show all sales users for verification
DO $$
DECLARE
    sales_user RECORD;
BEGIN
    RAISE NOTICE '=== Sales Users ===';
    FOR sales_user IN
        SELECT id, email, role, created_at
        FROM public.profiles
        WHERE role = 'sales'
        ORDER BY email
    LOOP
        RAISE NOTICE 'Email: %, Role: %, Created: %',
            sales_user.email,
            sales_user.role,
            sales_user.created_at;
    END LOOP;
END $$;

-- Final summary
DO $$
BEGIN
    RAISE NOTICE '=== Migration Complete ===';
    RAISE NOTICE '1. Function recreated with detailed error messages';
    RAISE NOTICE '2. Grants added to authenticated and anon roles';
    RAISE NOTICE '3. Debug logging enabled (check Supabase logs)';
    RAISE NOTICE '4. Sales users listed above';
    RAISE NOTICE '';
    RAISE NOTICE 'If sales users still cannot access:';
    RAISE NOTICE '  1. Check their role is exactly ''sales'' (not ''Sales'')';
    RAISE NOTICE '  2. Check Supabase logs for NOTICE messages';
    RAISE NOTICE '  3. Verify user is logged in correctly';
END $$;
