-- This migration updates the 'get_leads_for_dashboard' function to include additional
-- fields required by the Admin Leads Dashboard. It adds 'asesor_asignado_id',
-- 'contactado', and 'latest_app_car_info' to the returned table, ensuring the
-- dashboard can display all necessary information for each lead.

-- Drop the existing function to redefine it.
DROP FUNCTION IF EXISTS public.get_leads_for_dashboard();

-- Recreate the function with the additional fields.
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
    p.metadata->>'contactado' IS NOT NULL AS contactado,
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
