-- ============================================================================
-- FIX FINANCING APPLICATIONS RLS
-- Add direct JWT email check so admins can see all applications
-- This fixes the "Con Solicitud Activa" and "Solicitud Incompleta" showing 0
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "financing_apps_select" ON public.financing_applications;
DROP POLICY IF EXISTS "financing_apps_update" ON public.financing_applications;

-- Recreate SELECT policy with JWT email check + role check
CREATE POLICY "financing_apps_select"
ON public.financing_applications
FOR SELECT
TO authenticated
USING (
    -- Users can see their own applications
    user_id = auth.uid()
    OR
    -- Admins can see all (check by email from JWT - no recursion)
    auth.jwt()->>'email' IN (
        'marianomorales@outlook.com',
        'mariano.morales@autostrefa.mx',
        'genauservices@gmail.com',
        'alejandro.trevino@autostrefa.mx',
        'evelia.castillo@autostrefa.mx',
        'fernando.trevino@autostrefa.mx'
    )
    OR
    -- Also check role (uses SECURITY DEFINER function - safe)
    get_my_role() IN ('admin', 'sales')
);

-- Recreate UPDATE policy with JWT email check + role check
CREATE POLICY "financing_apps_update"
ON public.financing_applications
FOR UPDATE
TO authenticated
USING (
    -- Users can update their own
    user_id = auth.uid()
    OR
    -- Admins can update all (check by email from JWT - no recursion)
    auth.jwt()->>'email' IN (
        'marianomorales@outlook.com',
        'mariano.morales@autostrefa.mx',
        'genauservices@gmail.com',
        'alejandro.trevino@autostrefa.mx',
        'evelia.castillo@autostrefa.mx',
        'fernando.trevino@autostrefa.mx'
    )
    OR
    -- Also check role (uses SECURITY DEFINER function - safe)
    get_my_role() IN ('admin', 'sales')
)
WITH CHECK (
    user_id = auth.uid()
    OR
    auth.jwt()->>'email' IN (
        'marianomorales@outlook.com',
        'mariano.morales@autostrefa.mx',
        'genauservices@gmail.com',
        'alejandro.trevino@autostrefa.mx',
        'evelia.castillo@autostrefa.mx',
        'fernando.trevino@autostrefa.mx'
    )
    OR
    get_my_role() IN ('admin', 'sales')
);

-- Add comments
COMMENT ON POLICY "financing_apps_select" ON public.financing_applications IS
'Users see their own applications. Admins (by email OR role) see all applications. Uses JWT email check to avoid recursion.';

COMMENT ON POLICY "financing_apps_update" ON public.financing_applications IS
'Users can update their own applications. Admins (by email OR role) can update all applications.';

-- ============================================================================
-- Verification
-- ============================================================================

-- Test: How many financing applications can you see?
SELECT
    'Financing applications visible to you' as test,
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE status IN ('submitted', 'reviewing', 'pending_docs')) as active_apps,
    COUNT(*) FILTER (WHERE status = 'draft') as draft_apps,
    CASE
        WHEN COUNT(*) > 0 THEN '✅ SUCCESS - Can see applications'
        ELSE '❌ BLOCKED - Cannot see any applications'
    END as status
FROM public.financing_applications;

-- Test: Sample applications with user emails
SELECT
    'Sample applications with user info' as test,
    fa.id,
    fa.status,
    p.email as user_email,
    fa.created_at
FROM public.financing_applications fa
LEFT JOIN public.profiles p ON p.id = fa.user_id
ORDER BY fa.created_at DESC
LIMIT 5;

-- Success
SELECT '✅ FINANCING APPLICATIONS RLS FIXED!' as status;
