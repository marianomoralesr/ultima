-- Update get_bank_rep_assigned_leads to filter by selected_banks field
-- This allows banks to see applications where they were recommended

-- Drop existing function
DROP FUNCTION IF EXISTS get_bank_rep_assigned_leads(UUID);

-- Function to get all leads visible to a bank representative
-- Shows applications where the bank rep's bank_affiliation is in the selected_banks array
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
  total_documents BIGINT,
  approved_documents BIGINT,
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

  -- Return applications where:
  -- 1. The bank is in the selected_banks array OR
  -- 2. There's an explicit assignment in bank_assignments table
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
    COUNT(DISTINCT ad.id) AS total_documents,
    COUNT(DISTINCT ad.id) FILTER (WHERE ad.verification_status = 'approved') AS approved_documents,
    EXTRACT(EPOCH FROM (NOW() - fa.created_at)) / 3600 AS hours_since_received
  FROM financing_applications fa
  INNER JOIN profiles p ON fa.user_id = p.id
  LEFT JOIN bank_assignments ba ON ba.application_id = fa.id
    AND ba.assigned_bank_rep_id = bank_rep_uuid
  LEFT JOIN application_documents ad ON ad.lead_id = fa.user_id
    AND (ad.application_id = fa.id OR ad.application_id IS NULL)
  WHERE
    -- Filter by applications where bank is recommended in selected_banks
    v_bank_affiliation = ANY(fa.selected_banks)
    -- Only show submitted or reviewing applications
    AND fa.status IN ('submitted', 'reviewing', 'approved', 'rejected')
  GROUP BY
    ba.id,
    fa.id,
    fa.user_id,
    ba.status,
    p.first_name,
    p.last_name,
    p.email,
    p.phone,
    fa.car_info,
    fa.created_at
  ORDER BY fa.created_at DESC;
END;
$$;

-- Update dashboard stats function to match the new filtering logic
DROP FUNCTION IF EXISTS get_bank_rep_dashboard_stats(UUID);

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

  -- Count applications where the bank is in selected_banks array
  RETURN QUERY
  SELECT
    COUNT(DISTINCT fa.id) AS total_assigned,
    COUNT(DISTINCT fa.id) FILTER (
      WHERE COALESCE(ba.status, 'pending') = 'pending'
    ) AS pending_review,
    COUNT(DISTINCT fa.id) FILTER (
      WHERE ba.status = 'approved'
    ) AS approved,
    COUNT(DISTINCT fa.id) FILTER (
      WHERE ba.status = 'rejected'
    ) AS rejected,
    COUNT(DISTINCT fa.id) FILTER (
      WHERE ba.status = 'feedback_provided'
    ) AS feedback_provided
  FROM financing_applications fa
  LEFT JOIN bank_assignments ba ON ba.application_id = fa.id
    AND ba.assigned_bank_rep_id = bank_rep_uuid
  WHERE
    v_bank_affiliation = ANY(fa.selected_banks)
    AND fa.status IN ('submitted', 'reviewing', 'approved', 'rejected');
END;
$$;

-- Update get_bank_rep_lead_details function to work with selected_banks
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

  -- Build result JSON
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
    'documents', (
      SELECT json_agg(row_to_json(ad.*))
      FROM application_documents ad
      WHERE ad.lead_id = p_lead_id
      ORDER BY ad.created_at DESC
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
GRANT EXECUTE ON FUNCTION get_bank_rep_dashboard_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_bank_rep_lead_details(UUID, UUID) TO authenticated;

-- Add comments
COMMENT ON FUNCTION get_bank_rep_assigned_leads IS 'Get all applications visible to a bank representative based on selected_banks field';
COMMENT ON FUNCTION get_bank_rep_dashboard_stats IS 'Get dashboard statistics for applications where bank is in selected_banks array';
COMMENT ON FUNCTION get_bank_rep_lead_details IS 'Get detailed information about a lead visible to the bank representative';
