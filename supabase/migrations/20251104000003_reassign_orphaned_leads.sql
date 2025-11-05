-- Reassign orphaned leads (applications without an assigned asesor) to David Rojas
-- This script:
-- 1. Finds David Rojas user ID
-- 2. Finds all users with draft or submitted applications but no asesor assigned
-- 3. Assigns them to David Rojas
-- 4. Does NOT modify leads already assigned to other users

DO $$
DECLARE
    david_rojas_id UUID;
    affected_count INT;
BEGIN
    -- Step 1: Get David Rojas user ID
    SELECT id INTO david_rojas_id
    FROM public.profiles
    WHERE email = 'david.rojas@autostrefa.mx'
    LIMIT 1;

    -- Check if David Rojas exists
    IF david_rojas_id IS NULL THEN
        RAISE EXCEPTION 'User david.rojas@autostrefa.mx not found in profiles table';
    END IF;

    RAISE NOTICE 'Found David Rojas with ID: %', david_rojas_id;

    -- Step 2: Find and count orphaned leads
    SELECT COUNT(DISTINCT p.id) INTO affected_count
    FROM public.profiles p
    INNER JOIN public.financing_applications fa ON fa.user_id = p.id
    WHERE p.role = 'user'
      AND p.asesor_asignado_id IS NULL
      AND fa.status IN ('draft', 'submitted', 'reviewing', 'pending_docs');

    RAISE NOTICE 'Found % orphaned leads with active applications', affected_count;

    -- Step 3: Assign orphaned leads to David Rojas
    UPDATE public.profiles p
    SET
        asesor_asignado_id = david_rojas_id,
        updated_at = NOW()
    FROM public.financing_applications fa
    WHERE p.id = fa.user_id
      AND p.role = 'user'
      AND p.asesor_asignado_id IS NULL
      AND fa.status IN ('draft', 'submitted', 'reviewing', 'pending_docs');

    -- Get final count
    GET DIAGNOSTICS affected_count = ROW_COUNT;

    RAISE NOTICE 'Successfully assigned % leads to David Rojas', affected_count;

    -- Step 4: Show summary of reassignment
    RAISE NOTICE '--- Summary Report ---';
    RAISE NOTICE 'David Rojas ID: %', david_rojas_id;
    RAISE NOTICE 'Leads reassigned: %', affected_count;

END $$;

-- Verification query - shows David's assigned leads count
SELECT
    p.email,
    p.role,
    COUNT(DISTINCT fa.user_id) as total_assigned_leads,
    COUNT(DISTINCT CASE WHEN fa.status = 'draft' THEN fa.user_id END) as draft_leads,
    COUNT(DISTINCT CASE WHEN fa.status = 'submitted' THEN fa.user_id END) as submitted_leads,
    COUNT(DISTINCT CASE WHEN fa.status = 'reviewing' THEN fa.user_id END) as reviewing_leads
FROM public.profiles p
LEFT JOIN public.profiles leads ON leads.asesor_asignado_id = p.id
LEFT JOIN public.financing_applications fa ON fa.user_id = leads.id
WHERE p.email = 'david.rojas@autostrefa.mx'
GROUP BY p.email, p.role;

-- Check for any remaining orphaned leads
SELECT
    COUNT(DISTINCT p.id) as remaining_orphaned_leads
FROM public.profiles p
INNER JOIN public.financing_applications fa ON fa.user_id = p.id
WHERE p.role = 'user'
  AND p.asesor_asignado_id IS NULL
  AND fa.status IN ('draft', 'submitted', 'reviewing', 'pending_docs');
