-- Fix Admin Dashboard Functions for Production
-- This script updates database functions to match what the frontend expects
-- Run this in Supabase SQL Editor (PRODUCTION)

-- ============================================
-- Step 1: Update get_leads_for_dashboard function
-- ============================================
-- This fixes the "column p.asesor_asignado does not exist" error
-- The function now returns the correct column name: asesor_asignado_id

DROP FUNCTION IF EXISTS public.get_leads_for_dashboard();

CREATE OR REPLACE FUNCTION public.get_leads_for_dashboard()
RETURNS TABLE(
  id uuid,
  first_name text,
  last_name text,
  email text,
  phone text,
  last_application_status text,
  created_at timestamptz,
  asesor_asignado_id uuid,
  contactado boolean,
  latest_app_car_info jsonb
) AS $$
BEGIN
  -- Ensure only authorized staff can call this function.
  IF public.get_my_role() NOT IN ('admin', 'sales') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.first_name,
    p.last_name,
    p.email,
    p.phone,
    (
      SELECT fa.status
      FROM public.financing_applications fa
      WHERE fa.user_id = p.id
      ORDER BY fa.created_at DESC
      LIMIT 1
    ) AS last_application_status,
    p.created_at,
    p.asesor_asignado_id,
    (p.metadata->>'contactado')::boolean AS contactado,
    (
      SELECT fa.car_info
      FROM public.financing_applications fa
      WHERE fa.user_id = p.id
      ORDER BY fa.created_at DESC
      LIMIT 1
    ) AS latest_app_car_info
  FROM public.profiles p
  WHERE p.role = 'user'
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.get_leads_for_dashboard() IS 'Returns a list of leads with extended details for the staff dashboard.';

-- ============================================
-- Step 2: Verify the function exists
-- ============================================
SELECT 'Admin functions updated successfully!' as status;

-- Verify get_leads_for_dashboard
SELECT
  'get_leads_for_dashboard' as function_name,
  COUNT(*) as exists
FROM pg_proc
WHERE proname = 'get_leads_for_dashboard';

-- Verify get_crm_dashboard_stats
SELECT
  'get_crm_dashboard_stats' as function_name,
  COUNT(*) as exists
FROM pg_proc
WHERE proname = 'get_crm_dashboard_stats';
