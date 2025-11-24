-- Create RPC functions for bank representative dashboard
-- These functions fetch statistics and assigned leads for bank representatives

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS get_bank_rep_dashboard_stats(UUID);
DROP FUNCTION IF EXISTS get_bank_rep_assigned_leads(UUID);

-- Function to get dashboard statistics for a bank representative
CREATE OR REPLACE FUNCTION get_bank_rep_dashboard_stats(bank_rep_uuid UUID)
RETURNS TABLE (
  total_assigned BIGINT,
  pending_review BIGINT,
  approved BIGINT,
  rejected BIGINT,
  feedback_provided BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the caller is the bank rep or an admin
  IF auth.uid() != bank_rep_uuid AND NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.email IN (
      'mariano.morales@autostrefa.mx',
      'fernando.trevino@autostrefa.mx',
      'lizeth.juarez@autostrefa.mx',
      'alejandro.trevino@autostrefa.mx',
      'alejandro.gallardo@autostrefa.mx',
      'hola@autostrefa.mx',
      'evelia.castillo@autostrefa.mx'
    )
  ) THEN
    RAISE EXCEPTION 'Unauthorized access';
  END IF;

  RETURN QUERY
  SELECT
    COUNT(*) AS total_assigned,
    COUNT(*) FILTER (WHERE ba.status = 'pending') AS pending_review,
    COUNT(*) FILTER (WHERE ba.status = 'approved') AS approved,
    COUNT(*) FILTER (WHERE ba.status = 'rejected') AS rejected,
    COUNT(*) FILTER (WHERE ba.status = 'feedback_provided') AS feedback_provided
  FROM bank_assignments ba
  WHERE ba.assigned_bank_rep_id = bank_rep_uuid;
END;
$$;

-- Function to get all assigned leads for a bank representative
CREATE OR REPLACE FUNCTION get_bank_rep_assigned_leads(bank_rep_uuid UUID)
RETURNS TABLE (
  assignment_id UUID,
  lead_id UUID,
  application_id UUID,
  status TEXT,
  assigned_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  vehicle_info TEXT,
  requested_amount NUMERIC,
  hours_since_assigned NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the caller is the bank rep or an admin
  IF auth.uid() != bank_rep_uuid AND NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.email IN (
      'mariano.morales@autostrefa.mx',
      'fernando.trevino@autostrefa.mx',
      'lizeth.juarez@autostrefa.mx',
      'alejandro.trevino@autostrefa.mx',
      'alejandro.gallardo@autostrefa.mx',
      'hola@autostrefa.mx',
      'evelia.castillo@autostrefa.mx'
    )
  ) THEN
    RAISE EXCEPTION 'Unauthorized access';
  END IF;

  RETURN QUERY
  SELECT
    ba.id AS assignment_id,
    ba.lead_id,
    ba.application_id,
    ba.status,
    ba.assigned_at,
    ba.updated_at,
    CONCAT(COALESCE(p.first_name, ''), ' ', COALESCE(p.last_name, '')) AS customer_name,
    p.email AS customer_email,
    p.phone AS customer_phone,
    COALESCE(
      CONCAT(
        COALESCE(fa.car_info->>'marca', ''), ' ',
        COALESCE(fa.car_info->>'modelo', ''), ' ',
        COALESCE(fa.car_info->>'anio', '')
      ),
      'N/A'
    ) AS vehicle_info,
    COALESCE((fa.car_info->>'monto_solicitado')::NUMERIC, 0) AS requested_amount,
    EXTRACT(EPOCH FROM (NOW() - ba.assigned_at)) / 3600 AS hours_since_assigned
  FROM bank_assignments ba
  LEFT JOIN profiles p ON ba.lead_id = p.id
  LEFT JOIN financing_applications fa ON ba.application_id = fa.id
  WHERE ba.assigned_bank_rep_id = bank_rep_uuid
  ORDER BY ba.assigned_at DESC;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_bank_rep_dashboard_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_bank_rep_assigned_leads(UUID) TO authenticated;

-- Add comments
COMMENT ON FUNCTION get_bank_rep_dashboard_stats IS 'Get dashboard statistics for a bank representative';
COMMENT ON FUNCTION get_bank_rep_assigned_leads IS 'Get all leads assigned to a bank representative with customer and vehicle details';
