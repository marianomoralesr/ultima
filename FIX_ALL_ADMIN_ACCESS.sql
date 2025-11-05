-- ============================================================================
-- COMPLETE FIX FOR ALL ADMIN ACCESS ISSUES
-- This script updates ALL RLS policies and RPC functions to include new admins:
-- - alejandro.trevino@autostrefa.mx
-- - evelia.castillo@autostrefa.mx
-- - fernando.trevino@autostrefa.mx
--
-- INSTRUCTIONS:
-- 1. Go to https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu/sql/new
-- 2. Copy and paste this ENTIRE script
-- 3. Click "Run" to execute
-- ============================================================================

-- ============================================================================
-- PART 1: Update profiles table RLS policies
-- ============================================================================

DROP POLICY IF EXISTS "Admins can read all profiles by email" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles by email" ON public.profiles;

CREATE POLICY "Admins can read all profiles by email"
ON public.profiles
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND auth.jwt()->>'email' IN (
    'marianomorales@outlook.com',
    'mariano.morales@autostrefa.mx',
    'genauservices@gmail.com',
    'alejandro.trevino@autostrefa.mx',
    'evelia.castillo@autostrefa.mx',
    'fernando.trevino@autostrefa.mx'
  )
);

CREATE POLICY "Admins can update all profiles by email"
ON public.profiles
FOR UPDATE
USING (
  auth.uid() IS NOT NULL
  AND auth.jwt()->>'email' IN (
    'marianomorales@outlook.com',
    'mariano.morales@autostrefa.mx',
    'genauservices@gmail.com',
    'alejandro.trevino@autostrefa.mx',
    'evelia.castillo@autostrefa.mx',
    'fernando.trevino@autostrefa.mx'
  )
);

-- ============================================================================
-- PART 2: Update get_secure_client_profile function
-- ============================================================================

DROP FUNCTION IF EXISTS get_secure_client_profile(uuid);

CREATE OR REPLACE FUNCTION get_secure_client_profile(client_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result jsonb;
    caller_email text;
    is_admin boolean;
BEGIN
    -- Get caller's email from JWT
    caller_email := auth.jwt()->>'email';

    -- Check if caller is admin (UPDATED WITH NEW EMAILS)
    is_admin := caller_email IN (
        'marianomorales@outlook.com',
        'mariano.morales@autostrefa.mx',
        'genauservices@gmail.com',
        'alejandro.trevino@autostrefa.mx',
        'evelia.castillo@autostrefa.mx',
        'fernando.trevino@autostrefa.mx'
    );

    -- If not admin, return null
    IF NOT is_admin THEN
        RETURN NULL;
    END IF;

    -- Build result with profile and related data
    SELECT jsonb_build_object(
        'profile', to_jsonb(p.*),
        'applications', COALESCE(
            (SELECT jsonb_agg(to_jsonb(fa.*) ORDER BY fa.created_at DESC)
             FROM financing_applications fa
             WHERE fa.user_id = client_id),
            '[]'::jsonb
        ),
        'tags', COALESCE(
            (SELECT jsonb_agg(jsonb_build_object(
                'id', lta.tag_id,
                'tag_name', lt.tag_name,
                'color', lt.color
            ))
             FROM lead_tag_associations lta
             JOIN lead_tags lt ON lt.id = lta.tag_id
             WHERE lta.lead_id = client_id),
            '[]'::jsonb
        ),
        'reminders', COALESCE(
            (SELECT jsonb_agg(to_jsonb(r.*) ORDER BY r.reminder_date ASC)
             FROM lead_reminders r
             WHERE r.lead_id = client_id),
            '[]'::jsonb
        ),
        'documents', COALESCE(
            (SELECT jsonb_agg(to_jsonb(d.*) ORDER BY d.created_at DESC)
             FROM uploaded_documents d
             WHERE d.user_id = client_id),
            '[]'::jsonb
        )
    ) INTO result
    FROM profiles p
    WHERE p.id = client_id;

    RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_secure_client_profile(uuid) TO authenticated;

COMMENT ON FUNCTION get_secure_client_profile(uuid) IS
'Returns complete client profile with applications, tags, reminders, and documents. Only accessible to admin users (by email from JWT). UPDATED to include all admin emails.';

-- ============================================================================
-- PART 3: Update user roles in database
-- ============================================================================

-- Ensure all admin emails have admin role
UPDATE public.profiles
SET role = 'admin'
WHERE email IN (
    'marianomorales@outlook.com',
    'mariano.morales@autostrefa.mx',
    'genauservices@gmail.com',
    'alejandro.trevino@autostrefa.mx',
    'evelia.castillo@autostrefa.mx',
    'fernando.trevino@autostrefa.mx'
)
AND role != 'admin';

-- ============================================================================
-- PART 4: Verification Queries
-- ============================================================================

-- Show all admin users
SELECT
    'Admin Users' as check_type,
    email,
    role,
    created_at,
    CASE
        WHEN email IN (
            'marianomorales@outlook.com',
            'mariano.morales@autostrefa.mx',
            'genauservices@gmail.com',
            'alejandro.trevino@autostrefa.mx',
            'evelia.castillo@autostrefa.mx',
            'fernando.trevino@autostrefa.mx'
        ) THEN '✅ In RLS Policy'
        ELSE '❌ NOT in RLS Policy'
    END as rls_status
FROM public.profiles
WHERE role = 'admin'
ORDER BY created_at;

-- Count all profiles
SELECT
    'Total Users' as metric,
    COUNT(*) as count
FROM public.profiles;

-- Count by role
SELECT
    role as metric,
    COUNT(*) as count
FROM public.profiles
GROUP BY role
ORDER BY count DESC;
