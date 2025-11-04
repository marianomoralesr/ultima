-- Reassign orphaned leads to David Rojas
-- This includes:
-- 1. Leads with NULL asesor_asignado_id
-- 2. Leads assigned to deleted asesor (1c01c560-73f9-459e-9887-4a780aa6cd61)
--
-- Does NOT modify leads already assigned to existing/active users

DO $$
DECLARE
    david_rojas_id UUID;
    deleted_asesor_id UUID := '1c01c560-73f9-459e-9887-4a780aa6cd61';
    null_asesor_count INT;
    deleted_asesor_count INT;
    total_affected INT;
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

    RAISE NOTICE '=== Reassignment Process Started ===';
    RAISE NOTICE 'David Rojas ID: %', david_rojas_id;
    RAISE NOTICE 'Deleted Asesor ID: %', deleted_asesor_id;

    -- Step 2: Count leads with NULL asesor
    SELECT COUNT(*) INTO null_asesor_count
    FROM public.profiles
    WHERE role = 'user'
      AND asesor_asignado_id IS NULL;

    RAISE NOTICE 'Leads with NULL asesor: %', null_asesor_count;

    -- Step 3: Count leads assigned to deleted asesor
    SELECT COUNT(*) INTO deleted_asesor_count
    FROM public.profiles
    WHERE role = 'user'
      AND asesor_asignado_id = deleted_asesor_id;

    RAISE NOTICE 'Leads assigned to deleted asesor: %', deleted_asesor_count;

    -- Step 4: Reassign leads with NULL asesor to David Rojas
    UPDATE public.profiles
    SET
        asesor_asignado_id = david_rojas_id,
        updated_at = NOW()
    WHERE role = 'user'
      AND asesor_asignado_id IS NULL;

    RAISE NOTICE '✓ Reassigned % leads with NULL asesor', null_asesor_count;

    -- Step 5: Reassign leads from deleted asesor to David Rojas
    UPDATE public.profiles
    SET
        asesor_asignado_id = david_rojas_id,
        updated_at = NOW()
    WHERE role = 'user'
      AND asesor_asignado_id = deleted_asesor_id;

    RAISE NOTICE '✓ Reassigned % leads from deleted asesor', deleted_asesor_count;

    total_affected := null_asesor_count + deleted_asesor_count;

    RAISE NOTICE '=== Summary ===';
    RAISE NOTICE 'Total leads reassigned to David Rojas: %', total_affected;
    RAISE NOTICE 'Process completed successfully!';

END $$;

-- Verification Report
-- Show David Rojas's current lead assignment
SELECT
    'David Rojas Lead Summary' as report_type,
    p.email,
    p.role,
    COUNT(DISTINCT leads.id) as total_assigned_leads,
    COUNT(DISTINCT CASE WHEN fa.status = 'draft' THEN leads.id END) as draft_leads,
    COUNT(DISTINCT CASE WHEN fa.status = 'submitted' THEN leads.id END) as submitted_leads,
    COUNT(DISTINCT CASE WHEN fa.status = 'reviewing' THEN leads.id END) as reviewing_leads,
    COUNT(DISTINCT CASE WHEN fa.status = 'pending_docs' THEN leads.id END) as pending_docs_leads,
    COUNT(DISTINCT CASE WHEN fa.status IN ('draft', 'submitted', 'reviewing', 'pending_docs') THEN leads.id END) as total_active_applications
FROM public.profiles p
LEFT JOIN public.profiles leads ON leads.asesor_asignado_id = p.id AND leads.role = 'user'
LEFT JOIN public.financing_applications fa ON fa.user_id = leads.id
WHERE p.email = 'david.rojas@autostrefa.mx'
GROUP BY p.email, p.role;

-- Check for any remaining orphaned leads
SELECT
    'Remaining Orphaned Leads' as report_type,
    COUNT(DISTINCT p.id) as leads_with_null_asesor,
    COUNT(DISTINCT CASE WHEN fa.status IN ('draft', 'submitted', 'reviewing', 'pending_docs') THEN p.id END) as with_active_applications
FROM public.profiles p
LEFT JOIN public.financing_applications fa ON fa.user_id = p.id
WHERE p.role = 'user'
  AND p.asesor_asignado_id IS NULL;

-- Check if any leads are still assigned to deleted asesor
SELECT
    'Leads Still Assigned to Deleted Asesor' as report_type,
    COUNT(*) as count,
    COUNT(CASE WHEN fa.status IN ('draft', 'submitted', 'reviewing', 'pending_docs') THEN 1 END) as with_active_applications
FROM public.profiles p
LEFT JOIN public.financing_applications fa ON fa.user_id = p.id
WHERE p.asesor_asignado_id = '1c01c560-73f9-459e-9887-4a780aa6cd61';
