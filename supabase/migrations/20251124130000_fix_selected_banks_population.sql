-- ============================================================================
-- FIX SELECTED_BANKS POPULATION AND BACKFILL
-- ============================================================================
-- Issue: selected_banks field is not being populated, so bank reps can't see
-- their assigned applications
-- ============================================================================

-- 1. Update submit_application function to populate selected_banks
DROP FUNCTION IF EXISTS submit_application(jsonb);

CREATE OR REPLACE FUNCTION submit_application(application_data jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_application_id uuid;
  user_id_from_data uuid;
  existing_app_id uuid;
  v_banco_recomendado text;
  v_banco_segunda_opcion text;
  v_selected_banks text[];
BEGIN
  -- Extract user_id and id from the application data
  user_id_from_data := (application_data->>'user_id')::uuid;
  existing_app_id := (application_data->>'id')::uuid;

  -- Get banco_recomendado from user's bank profile
  SELECT banco_recomendado, banco_segunda_opcion
  INTO v_banco_recomendado, v_banco_segunda_opcion
  FROM bank_profiles
  WHERE user_id = user_id_from_data;

  -- Build selected_banks array (lowercase bank names)
  IF v_banco_recomendado IS NOT NULL THEN
    v_selected_banks := ARRAY[LOWER(v_banco_recomendado)];

    -- Add second option if exists
    IF v_banco_segunda_opcion IS NOT NULL AND v_banco_segunda_opcion != '' THEN
      v_selected_banks := v_selected_banks || ARRAY[LOWER(v_banco_segunda_opcion)];
    END IF;
  END IF;

  -- If ID exists, update existing application
  IF existing_app_id IS NOT NULL THEN
    UPDATE public.financing_applications
    SET
      status = 'Completa',
      application_data = application_data - 'id' - 'user_id',
      car_info = application_data->'car_info',
      personal_info_snapshot = jsonb_build_object(
        'first_name', application_data->>'first_name',
        'last_name', application_data->>'last_name',
        'mother_last_name', application_data->>'mother_last_name',
        'email', application_data->>'email',
        'phone', application_data->>'phone',
        'address', application_data->>'address',
        'rfc', application_data->>'rfc',
        'birth_date', application_data->>'birth_date'
      ),
      selected_banks = COALESCE(v_selected_banks, ARRAY[]::text[]),
      updated_at = now()
    WHERE id = existing_app_id
      AND user_id = user_id_from_data;

    RETURN existing_app_id;
  END IF;

  -- Otherwise, create new application (shouldn't happen in normal flow)
  INSERT INTO public.financing_applications (
    user_id,
    status,
    application_data,
    car_info,
    personal_info_snapshot,
    selected_banks
  )
  VALUES (
    user_id_from_data,
    'Completa',
    application_data - 'user_id',
    application_data->'car_info',
    jsonb_build_object(
      'first_name', application_data->>'first_name',
      'last_name', application_data->>'last_name',
      'mother_last_name', application_data->>'mother_last_name',
      'email', application_data->>'email',
      'phone', application_data->>'phone',
      'address', application_data->>'address',
      'rfc', application_data->>'rfc',
      'birth_date', application_data->>'birth_date'
    ),
    COALESCE(v_selected_banks, ARRAY[]::text[])
  ) RETURNING id INTO new_application_id;

  RETURN new_application_id;
END;
$$;

GRANT EXECUTE ON FUNCTION submit_application(jsonb) TO authenticated;

COMMENT ON FUNCTION submit_application IS 'Submit application and populate selected_banks from user bank profile';

-- 2. Backfill selected_banks for existing applications
UPDATE financing_applications fa
SET selected_banks = (
  SELECT CASE
    WHEN bp.banco_recomendado IS NOT NULL THEN
      ARRAY[LOWER(bp.banco_recomendado)] ||
      CASE
        WHEN bp.banco_segunda_opcion IS NOT NULL AND bp.banco_segunda_opcion != ''
        THEN ARRAY[LOWER(bp.banco_segunda_opcion)]
        ELSE ARRAY[]::text[]
      END
    ELSE ARRAY[]::text[]
  END
  FROM bank_profiles bp
  WHERE bp.user_id = fa.user_id
)
WHERE (fa.selected_banks IS NULL OR fa.selected_banks = ARRAY[]::text[])
  AND EXISTS (
    SELECT 1 FROM bank_profiles bp
    WHERE bp.user_id = fa.user_id
      AND bp.banco_recomendado IS NOT NULL
  );

-- Log the backfill results
DO $$
DECLARE
  updated_count integer;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Backfilled selected_banks for % applications', updated_count;
END $$;
