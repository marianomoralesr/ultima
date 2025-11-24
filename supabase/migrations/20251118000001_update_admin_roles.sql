-- Update admin roles for TREFA team members
-- This ensures only authorized personnel have admin access

-- First, reset all existing admin roles to user (except the ones we want to keep)
UPDATE public.profiles
SET role = 'user'
WHERE role = 'admin'
AND email NOT IN (
    'mariano.morales@autostrefa.mx',
    'marianomorales@outlook.com',
    'evelia.castillo@autostrefa.mx',
    'alejandro.trevino@autostrefa.mx',
    'fernando.trevino@autostrefa.mx',
    'alejandro.gallardo@autostrefa.mx',
    'lizeth.juarez@autostrefa.mx'
);

-- Now set admin role for authorized users
UPDATE public.profiles
SET role = 'admin'
WHERE email IN (
    'mariano.morales@autostrefa.mx',
    'marianomorales@outlook.com',
    'evelia.castillo@autostrefa.mx',
    'alejandro.trevino@autostrefa.mx',
    'fernando.trevino@autostrefa.mx',
    'alejandro.gallardo@autostrefa.mx',
    'lizeth.juarez@autostrefa.mx'
);

-- Display the updated admin users
SELECT email, role, first_name, last_name
FROM public.profiles
WHERE role = 'admin'
ORDER BY email;
