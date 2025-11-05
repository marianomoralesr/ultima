-- Comprehensive search for user 1c01c560-73f9-459e-9887-4a780aa6cd61

-- Check if user exists in auth.users
SELECT
    'auth.users' as table_name,
    id,
    email,
    created_at,
    last_sign_in_at
FROM auth.users
WHERE id = '1c01c560-73f9-459e-9887-4a780aa6cd61'

UNION ALL

-- Check if this ID appears in profiles
SELECT
    'profiles' as table_name,
    id,
    email,
    created_at::timestamptz,
    updated_at
FROM public.profiles
WHERE id = '1c01c560-73f9-459e-9887-4a780aa6cd61'

UNION ALL

-- Check if this ID is used as asesor_asignado_id
SELECT
    'profiles (as asesor)' as table_name,
    asesor_asignado_id as id,
    COUNT(*)::text as email,
    MIN(created_at)::timestamptz as created_at,
    MAX(updated_at)::timestamptz as last_sign_in_at
FROM public.profiles
WHERE asesor_asignado_id = '1c01c560-73f9-459e-9887-4a780aa6cd61'
GROUP BY asesor_asignado_id;

-- Show how many leads are assigned to this (possibly deleted) asesor
SELECT
    COUNT(*) as leads_assigned_to_deleted_asesor,
    COUNT(CASE WHEN fa.status IN ('draft', 'submitted', 'reviewing', 'pending_docs') THEN 1 END) as active_applications
FROM public.profiles p
LEFT JOIN public.financing_applications fa ON fa.user_id = p.id
WHERE p.asesor_asignado_id = '1c01c560-73f9-459e-9887-4a780aa6cd61';
