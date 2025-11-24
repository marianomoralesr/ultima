-- Fix bank representative RPC functions - documents are stored in application_data JSONB
-- NOT as individual columns

-- Drop and recreate get_bank_rep_assigned_leads with correct document access
DROP FUNCTION IF EXISTS get_bank_rep_assigned_leads(UUID);

CREATE OR REPLACE FUNCTION get_bank_rep_assigned_leads(bank_rep_uuid UUID)
RETURNS TABLE (
  assignment_id UUID,
  lead_id UUID,
  application_id UUID,
  assignment_status TEXT,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  car_info JSONB,
  application_data JSONB,
  hours_since_received NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_bank_affiliation TEXT;
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

  -- Get the bank representative's bank affiliation
  SELECT brp.bank_affiliation INTO v_bank_affiliation
  FROM bank_representative_profiles brp
  WHERE brp.id = bank_rep_uuid;

  IF v_bank_affiliation IS NULL THEN
    RAISE EXCEPTION 'Bank representative profile not found';
  END IF;

  -- Return applications where bank is in selected_banks array
  RETURN QUERY
  SELECT
    COALESCE(ba.id, gen_random_uuid()) AS assignment_id,
    fa.user_id AS lead_id,
    fa.id AS application_id,
    COALESCE(ba.status, 'pending') AS assignment_status,
    p.first_name,
    p.last_name,
    p.email,
    p.phone,
    fa.car_info,
    fa.application_data,
    EXTRACT(EPOCH FROM (NOW() - fa.created_at)) / 3600 AS hours_since_received
  FROM financing_applications fa
  INNER JOIN profiles p ON fa.user_id = p.id
  LEFT JOIN bank_assignments ba ON ba.application_id = fa.id
    AND ba.assigned_bank_rep_id = bank_rep_uuid
  WHERE
    -- Filter by applications where bank is recommended in selected_banks
    v_bank_affiliation = ANY(fa.selected_banks)
    -- Only show submitted or reviewing applications
    AND fa.status IN ('submitted', 'reviewing', 'approved', 'rejected')
  ORDER BY fa.created_at DESC;
END;
$$;

-- Update get_bank_rep_lead_details to return application_data (which contains document URLs)
DROP FUNCTION IF EXISTS get_bank_rep_lead_details(UUID, UUID);

CREATE OR REPLACE FUNCTION get_bank_rep_lead_details(
  p_bank_rep_id UUID,
  p_lead_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_bank_affiliation TEXT;
  v_result JSON;
BEGIN
  -- Check if the caller is the bank rep or an admin
  IF auth.uid() != p_bank_rep_id AND NOT EXISTS (
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

  -- Get the bank representative's bank affiliation
  SELECT brp.bank_affiliation INTO v_bank_affiliation
  FROM bank_representative_profiles brp
  WHERE brp.id = p_bank_rep_id;

  IF v_bank_affiliation IS NULL THEN
    RAISE EXCEPTION 'Bank representative profile not found';
  END IF;

  -- Build result JSON - application_data contains all document URLs
  SELECT json_build_object(
    'success', true,
    'lead', (
      SELECT row_to_json(p.*)
      FROM profiles p
      WHERE p.id = p_lead_id
    ),
    'application', (
      SELECT json_agg(row_to_json(fa.*))
      FROM financing_applications fa
      WHERE fa.user_id = p_lead_id
        AND v_bank_affiliation = ANY(fa.selected_banks)
        AND fa.status IN ('submitted', 'reviewing', 'approved', 'rejected')
      ORDER BY fa.created_at DESC
    ),
    'assignment', (
      SELECT row_to_json(ba.*)
      FROM bank_assignments ba
      INNER JOIN financing_applications fa ON ba.application_id = fa.id
      WHERE ba.assigned_bank_rep_id = p_bank_rep_id
        AND fa.user_id = p_lead_id
        AND v_bank_affiliation = ANY(fa.selected_banks)
      ORDER BY ba.created_at DESC
      LIMIT 1
    ),
    'bank_profile', (
      SELECT json_build_object(
        'score', 75,
        'risk_level', 'medium'
      )
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_bank_rep_assigned_leads(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_bank_rep_lead_details(UUID, UUID) TO authenticated;

-- Add comments
COMMENT ON FUNCTION get_bank_rep_assigned_leads IS 'Get all applications visible to a bank representative - documents in application_data JSONB';
COMMENT ON FUNCTION get_bank_rep_lead_details IS 'Get detailed information about a lead - documents in application_data JSONB';
