-- Fix: Add all columns first, THEN create the function
-- This ensures the structure matches

-- Step 1: Add all source tracking columns if they don't exist
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

-- Step 2: Verify all columns exist
DO $$
DECLARE
    col_count INT;
BEGIN
    SELECT COUNT(*)
    INTO col_count
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name IN ('utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'rfdm', 'referrer', 'landing_page', 'first_visit_at');

    RAISE NOTICE 'Source tracking columns found: % out of 9', col_count;

    IF col_count < 9 THEN
        RAISE EXCEPTION 'Not all source tracking columns were created!';
    END IF;
END $$;

-- Step 3: Now drop and recreate the function
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

-- Step 4: Set ownership and grants
ALTER FUNCTION public.get_leads_for_dashboard() OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.get_leads_for_dashboard() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_leads_for_dashboard() TO anon;
GRANT EXECUTE ON FUNCTION public.get_leads_for_dashboard() TO service_role;

-- Step 5: Test that the function works now
DO $$
DECLARE
    test_result RECORD;
    lead_count INT := 0;
BEGIN
    -- Count how many leads the function returns
    SELECT COUNT(*) INTO lead_count
    FROM public.get_leads_for_dashboard();

    RAISE NOTICE '✓ Function created successfully!';
    RAISE NOTICE '✓ Function returns % leads', lead_count;
    RAISE NOTICE '';
    RAISE NOTICE '=== Next Steps ===';
    RAISE NOTICE '1. Have sales users log out and back in';
    RAISE NOTICE '2. Clear browser cache/localStorage';
    RAISE NOTICE '3. Try accessing the CRM page';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '✗ Function test failed: %', SQLERRM;
        RAISE NOTICE 'Note: This is normal if you are not an admin/sales user';
END $$;

COMMENT ON FUNCTION public.get_leads_for_dashboard() IS 'Returns leads for CRM dashboard with timestamps and source tracking. Accessible by admin and sales roles via profiles.role check. SECURITY DEFINER bypasses RLS.';
