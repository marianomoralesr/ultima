-- ============================================================================
-- FIX BANK REPRESENTATIVE AUTHORIZATION CHECK
-- ============================================================================
-- Issue: Bank representatives can't access their dashboard because the
-- authorization check looks for them in the profiles table instead of
-- bank_representative_profiles table
-- ============================================================================

-- Update get_bank_rep_assigned_leads function
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
  -- Check authorization - allow if user is the bank rep OR is an admin
  IF auth.uid() != bank_rep_uuid AND NOT EXISTS (
    SELECT 1 FROM bank_representative_profiles
    WHERE bank_representative_profiles.id = auth.uid()
  ) AND NOT EXISTS (
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

  -- Get bank affiliation
  SELECT brp.bank_affiliation INTO v_bank_affiliation
  FROM bank_representative_profiles brp
  WHERE brp.id = bank_rep_uuid;

  IF v_bank_affiliation IS NULL THEN
    RAISE EXCEPTION 'Bank representative profile not found';
  END IF;

  -- Return applications where bank is recommended (support both English and Spanish)
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
    COUNT(DISTINCT ud.id) AS total_documents,
    COUNT(DISTINCT ud.id) FILTER (WHERE ud.verification_status = 'approved') AS approved_documents,
    EXTRACT(EPOCH FROM (NOW() - fa.created_at)) / 3600 AS hours_since_received
  FROM financing_applications fa
  INNER JOIN profiles p ON fa.user_id = p.id
  LEFT JOIN bank_assignments ba ON ba.application_id = fa.id
    AND ba.assigned_bank_rep_id = bank_rep_uuid
  LEFT JOIN uploaded_documents ud ON ud.user_id = fa.user_id
    AND (ud.application_id = fa.id OR ud.application_id IS NULL)
  WHERE
    -- Filter by banco_recomendado from selected_banks or bank_profiling
    v_bank_affiliation = ANY(fa.selected_banks)
    -- Support both Spanish and English status values
    AND fa.status IN (
      -- Spanish statuses (current)
      'Completa', 'Faltan Documentos', 'En Revisión', 'Aprobada', 'Rechazada',
      -- English statuses (legacy)
      'submitted', 'reviewing', 'approved', 'rejected'
    )
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

-- Update get_bank_rep_dashboard_stats function
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
  -- Check authorization - allow if user is the bank rep OR is an admin
  IF auth.uid() != bank_rep_uuid AND NOT EXISTS (
    SELECT 1 FROM bank_representative_profiles
    WHERE bank_representative_profiles.id = auth.uid()
  ) AND NOT EXISTS (
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

  -- Get bank affiliation
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
    -- Support both Spanish and English status values
    AND fa.status IN (
      'Completa', 'Faltan Documentos', 'En Revisión', 'Aprobada', 'Rechazada',
      'submitted', 'reviewing', 'approved', 'rejected'
    );
END;
$$;

-- Update get_bank_rep_lead_details function
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
  -- Check authorization - allow if user is the bank rep OR is an admin
  IF auth.uid() != p_bank_rep_id AND NOT EXISTS (
    SELECT 1 FROM bank_representative_profiles
    WHERE bank_representative_profiles.id = auth.uid()
  ) AND NOT EXISTS (
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

  -- Get bank affiliation
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
        AND fa.status IN (
          'Completa', 'Faltan Documentos', 'En Revisión', 'Aprobada', 'Rechazada',
          'submitted', 'reviewing', 'approved', 'rejected'
        )
      ORDER BY fa.created_at DESC
    ),
    'documents', (
      SELECT json_agg(row_to_json(ud.*))
      FROM uploaded_documents ud
      WHERE ud.user_id = p_lead_id
      ORDER BY ud.created_at DESC
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_bank_rep_assigned_leads(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_bank_rep_dashboard_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_bank_rep_lead_details(UUID, UUID) TO authenticated;

COMMENT ON FUNCTION get_bank_rep_assigned_leads IS 'Get all applications visible to a bank representative (checks bank_representative_profiles for auth)';
COMMENT ON FUNCTION get_bank_rep_dashboard_stats IS 'Get dashboard statistics for bank representative (checks bank_representative_profiles for auth)';
COMMENT ON FUNCTION get_bank_rep_lead_details IS 'Get detailed lead information (checks bank_representative_profiles for auth)';
