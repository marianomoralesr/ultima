-- Check the email of user with ID 1c01c560-73f9-459e-9887-4a780aa6cd61
SELECT
    id,
    email,
    first_name,
    last_name,
    role,
    asesor_asignado_id,
    created_at
FROM public.profiles
WHERE id = '1c01c560-73f9-459e-9887-4a780aa6cd61';
