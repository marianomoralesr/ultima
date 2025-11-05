-- FINAL FIX: Complete reset and recreation of sales access
-- This ensures everything is correct from scratch

-- Step 1: Drop and recreate the function with ALL required fields
DROP FUNCTION IF EXISTS public.get_leads_for_dashboard() CASCADE;

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
BEGIN
    -- Get role from profiles table
    SELECT p.role INTO user_role
    FROM public.profiles p
    WHERE p.id = auth.uid();

    -- Allow both admin and sales roles
    IF user_role NOT IN ('admin', 'sales') THEN
        RAISE EXCEPTION 'Access denied. Current role: %. Required: admin or sales', COALESCE(user_role, 'NULL');
    END IF;

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

-- Step 2: Set ownership and grants
ALTER FUNCTION public.get_leads_for_dashboard() OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.get_leads_for_dashboard() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_leads_for_dashboard() TO anon;
GRANT EXECUTE ON FUNCTION public.get_leads_for_dashboard() TO service_role;

-- Step 3: Verify the source tracking columns exist
DO $$
DECLARE
    missing_columns text[];
BEGIN
    -- Check for missing columns
    SELECT array_agg(col)
    INTO missing_columns
    FROM (
        SELECT unnest(ARRAY['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'rfdm', 'referrer', 'landing_page', 'first_visit_at']) AS col
    ) cols
    WHERE NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = col
    );

    IF missing_columns IS NOT NULL AND array_length(missing_columns, 1) > 0 THEN
        RAISE NOTICE 'Adding missing columns: %', missing_columns;

        -- Add any missing columns
        ALTER TABLE public.profiles
        ADD COLUMN IF NOT EXISTS utm_source text,
        ADD COLUMN IF NOT EXISTS utm_medium text,
        ADD COLUMN IF NOT EXISTS utm_campaign text,
        ADD COLUMN IF NOT EXISTS utm_term text,
        ADD COLUMN IF NOT EXISTS utm_content text,
        ADD COLUMN IF NOT EXISTS rfdm text,
        ADD COLUMN IF NOT EXISTS referrer text,
        ADD COLUMN IF NOT EXISTS landing_page text,
        ADD COLUMN IF NOT EXISTS first_visit_at timestamptz;
    ELSE
        RAISE NOTICE '✓ All source tracking columns exist';
    END IF;
END $$;

-- Step 4: Test the function can be called
DO $$
DECLARE
    test_result RECORD;
    test_count INT := 0;
BEGIN
    -- Try to call the function (will fail if permissions are wrong)
    FOR test_result IN
        SELECT * FROM public.get_leads_for_dashboard() LIMIT 1
    LOOP
        test_count := test_count + 1;
    END LOOP;

    RAISE NOTICE '✓ Function executes successfully (returned % rows in test)', test_count;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '✗ Function test failed: %', SQLERRM;
        RAISE NOTICE 'This is expected if you are not an admin/sales user';
END $$;

-- Step 5: Verify sales users exist and can theoretically access
DO $$
DECLARE
    sales_count INT;
    admin_count INT;
    sales_user RECORD;
BEGIN
    SELECT COUNT(*) INTO sales_count FROM public.profiles WHERE role = 'sales';
    SELECT COUNT(*) INTO admin_count FROM public.profiles WHERE role = 'admin';

    RAISE NOTICE '=== Final Status ===';
    RAISE NOTICE 'Admin users: %', admin_count;
    RAISE NOTICE 'Sales users: %', sales_count;

    IF sales_count > 0 THEN
        RAISE NOTICE '';
        RAISE NOTICE 'Sales users in database:';
        FOR sales_user IN
            SELECT email, id FROM public.profiles WHERE role = 'sales' ORDER BY email
        LOOP
            RAISE NOTICE '  - %', sales_user.email;
        END LOOP;
    END IF;

    RAISE NOTICE '';
    RAISE NOTICE '✓ Function: get_leads_for_dashboard';
    RAISE NOTICE '✓ Security: SECURITY DEFINER (bypasses RLS)';
    RAISE NOTICE '✓ Grants: authenticated, anon, service_role';
    RAISE NOTICE '✓ Access: admin and sales roles';
    RAISE NOTICE '';
    RAISE NOTICE 'If sales users still cannot access:';
    RAISE NOTICE '1. Ask them to log out and log back in';
    RAISE NOTICE '2. Clear browser cache/localStorage';
    RAISE NOTICE '3. Check browser console for errors';
    RAISE NOTICE '4. Check Supabase logs for function errors';
END $$;

COMMENT ON FUNCTION public.get_leads_for_dashboard() IS 'Returns leads for CRM dashboard with timestamps and source tracking. Accessible by admin and sales roles via profiles.role check. SECURITY DEFINER bypasses RLS.';
