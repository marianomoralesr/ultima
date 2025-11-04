-- Fix the assignment mistake:
-- 1. Revert leads that were NULL back to NULL (they need to wait for users to save profile)
-- 2. Keep only the reassignment of leads from deleted asesor to David Rojas

DO $$
DECLARE
    david_rojas_id UUID;
    deleted_asesor_id UUID := '1c01c560-73f9-459e-9887-4a780aa6cd61';
    reverted_count INT;
BEGIN
    -- Get David Rojas user ID
    SELECT id INTO david_rojas_id
    FROM public.profiles
    WHERE email = 'david.rojas@autostrefa.mx'
    LIMIT 1;

    IF david_rojas_id IS NULL THEN
        RAISE EXCEPTION 'User david.rojas@autostrefa.mx not found';
    END IF;

    RAISE NOTICE '=== Reverting Incorrect Assignments ===';
    RAISE NOTICE 'David Rojas ID: %', david_rojas_id;

    -- Revert leads that were assigned from NULL to David back to NULL
    -- (These are leads that don't have applications yet, just created accounts)
    UPDATE public.profiles p
    SET
        asesor_asignado_id = NULL,
        updated_at = NOW()
    WHERE p.role = 'user'
      AND p.asesor_asignado_id = david_rojas_id
      AND NOT EXISTS (
          SELECT 1
          FROM public.financing_applications fa
          WHERE fa.user_id = p.id
      );

    GET DIAGNOSTICS reverted_count = ROW_COUNT;
    RAISE NOTICE '✓ Reverted % leads without applications back to NULL', reverted_count;

    RAISE NOTICE '=== Summary ===';
    RAISE NOTICE 'Leads reverted to NULL: %', reverted_count;
    RAISE NOTICE 'Leads from deleted asesor remain assigned to David Rojas';

END $$;

-- Verification: Show David's current assignments
SELECT
    'David Rojas - Final Assignment' as report,
    COUNT(*) as total_leads,
    COUNT(CASE WHEN fa.id IS NOT NULL THEN 1 END) as leads_with_applications,
    COUNT(CASE WHEN fa.id IS NULL THEN 1 END) as leads_without_applications
FROM public.profiles p
LEFT JOIN public.financing_applications fa ON fa.user_id = p.id
WHERE p.role = 'user'
  AND p.asesor_asignado_id = (SELECT id FROM public.profiles WHERE email = 'david.rojas@autostrefa.mx');

-- Verification: Check NULL asesores
SELECT
    'Leads with NULL Asesor' as report,
    COUNT(*) as total,
    COUNT(CASE WHEN fa.id IS NOT NULL THEN 1 END) as with_applications,
    COUNT(CASE WHEN fa.id IS NULL THEN 1 END) as without_applications
FROM public.profiles p
LEFT JOIN public.financing_applications fa ON fa.user_id = p.id
WHERE p.role = 'user'
  AND p.asesor_asignado_id IS NULL;
