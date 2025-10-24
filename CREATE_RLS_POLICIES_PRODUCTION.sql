-- ============================================================================
-- CREATE RLS POLICIES FOR REMAINING TABLES - RUN THIS IN SUPABASE SQL EDITOR
-- This creates RLS policies for tables that currently have none:
-- lead_tags, lead_reminders, lead_tag_associations, vehicle_inspections,
-- job_applications, and vacancies
-- ============================================================================

-- ============================================================================
-- 1. LEAD_TAGS
-- ============================================================================

-- Enable RLS on lead_tags
ALTER TABLE public.lead_tags ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'lead_tags' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.lead_tags CASCADE';
    END LOOP;
END $$;

-- Admin and sales can manage all tags
CREATE POLICY "lead_tags_select" ON public.lead_tags
FOR SELECT TO authenticated
USING (get_my_role() IN ('admin', 'sales'));

CREATE POLICY "lead_tags_insert" ON public.lead_tags
FOR INSERT TO authenticated
WITH CHECK (get_my_role() IN ('admin', 'sales'));

CREATE POLICY "lead_tags_update" ON public.lead_tags
FOR UPDATE TO authenticated
USING (get_my_role() IN ('admin', 'sales'))
WITH CHECK (get_my_role() IN ('admin', 'sales'));

CREATE POLICY "lead_tags_delete" ON public.lead_tags
FOR DELETE TO authenticated
USING (get_my_role() IN ('admin', 'sales'));

COMMENT ON POLICY "lead_tags_select" ON public.lead_tags IS
'Allow admin and sales to view all lead tags';

-- ============================================================================
-- 2. LEAD_REMINDERS
-- ============================================================================

-- Enable RLS on lead_reminders
ALTER TABLE public.lead_reminders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'lead_reminders' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.lead_reminders CASCADE';
    END LOOP;
END $$;

-- Admin and sales can view all reminders
CREATE POLICY "lead_reminders_select" ON public.lead_reminders
FOR SELECT TO authenticated
USING (get_my_role() IN ('admin', 'sales'));

-- Users can only insert reminders they create
CREATE POLICY "lead_reminders_insert" ON public.lead_reminders
FOR INSERT TO authenticated
WITH CHECK (
    created_by = auth.uid() AND
    get_my_role() IN ('admin', 'sales')
);

-- Users can update their own reminders, admin can update all
CREATE POLICY "lead_reminders_update" ON public.lead_reminders
FOR UPDATE TO authenticated
USING (
    created_by = auth.uid() OR
    get_my_role() = 'admin'
)
WITH CHECK (
    created_by = auth.uid() OR
    get_my_role() = 'admin'
);

-- Users can delete their own reminders, admin can delete all
CREATE POLICY "lead_reminders_delete" ON public.lead_reminders
FOR DELETE TO authenticated
USING (
    created_by = auth.uid() OR
    get_my_role() = 'admin'
);

COMMENT ON POLICY "lead_reminders_select" ON public.lead_reminders IS
'Allow admin and sales to view all lead reminders';

-- ============================================================================
-- 3. LEAD_TAG_ASSOCIATIONS
-- ============================================================================

-- Enable RLS on lead_tag_associations
ALTER TABLE public.lead_tag_associations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'lead_tag_associations' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.lead_tag_associations CASCADE';
    END LOOP;
END $$;

-- Admin and sales can manage all tag associations
CREATE POLICY "lead_tag_associations_select" ON public.lead_tag_associations
FOR SELECT TO authenticated
USING (get_my_role() IN ('admin', 'sales'));

CREATE POLICY "lead_tag_associations_insert" ON public.lead_tag_associations
FOR INSERT TO authenticated
WITH CHECK (get_my_role() IN ('admin', 'sales'));

CREATE POLICY "lead_tag_associations_update" ON public.lead_tag_associations
FOR UPDATE TO authenticated
USING (get_my_role() IN ('admin', 'sales'))
WITH CHECK (get_my_role() IN ('admin', 'sales'));

CREATE POLICY "lead_tag_associations_delete" ON public.lead_tag_associations
FOR DELETE TO authenticated
USING (get_my_role() IN ('admin', 'sales'));

COMMENT ON POLICY "lead_tag_associations_select" ON public.lead_tag_associations IS
'Allow admin and sales to view all lead tag associations';

-- ============================================================================
-- 4. VEHICLE_INSPECTIONS
-- ============================================================================

-- Enable RLS on vehicle_inspections
ALTER TABLE public.vehicle_inspections ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'vehicle_inspections' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.vehicle_inspections CASCADE';
    END LOOP;
END $$;

-- Users can view their own inspections, admin and sales can view all
CREATE POLICY "vehicle_inspections_select" ON public.vehicle_inspections
FOR SELECT TO authenticated
USING (
    user_id = auth.uid() OR
    get_my_role() IN ('admin', 'sales')
);

-- Users can create their own inspections
CREATE POLICY "vehicle_inspections_insert" ON public.vehicle_inspections
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can update their own pending inspections, admin can update all
CREATE POLICY "vehicle_inspections_update" ON public.vehicle_inspections
FOR UPDATE TO authenticated
USING (
    (user_id = auth.uid() AND status = 'pending') OR
    get_my_role() IN ('admin', 'sales')
)
WITH CHECK (
    (user_id = auth.uid() AND status = 'pending') OR
    get_my_role() IN ('admin', 'sales')
);

-- Users can delete their own pending inspections, admin can delete all
CREATE POLICY "vehicle_inspections_delete" ON public.vehicle_inspections
FOR DELETE TO authenticated
USING (
    (user_id = auth.uid() AND status = 'pending') OR
    get_my_role() = 'admin'
);

COMMENT ON POLICY "vehicle_inspections_select" ON public.vehicle_inspections IS
'Allow users to view their own inspections, admin and sales can view all';

-- ============================================================================
-- 5. JOB_APPLICATIONS
-- ============================================================================

-- Enable RLS on job_applications
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'job_applications' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.job_applications CASCADE';
    END LOOP;
END $$;

-- Users can view their own applications, admin can view all
CREATE POLICY "job_applications_select" ON public.job_applications
FOR SELECT TO authenticated
USING (
    user_id = auth.uid() OR
    get_my_role() = 'admin'
);

-- Authenticated users can create job applications
CREATE POLICY "job_applications_insert" ON public.job_applications
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can update their own pending applications, admin can update all
CREATE POLICY "job_applications_update" ON public.job_applications
FOR UPDATE TO authenticated
USING (
    (user_id = auth.uid() AND status IN ('pending', 'draft')) OR
    get_my_role() = 'admin'
)
WITH CHECK (
    (user_id = auth.uid() AND status IN ('pending', 'draft')) OR
    get_my_role() = 'admin'
);

-- Users can delete their own draft applications, admin can delete any
CREATE POLICY "job_applications_delete" ON public.job_applications
FOR DELETE TO authenticated
USING (
    (user_id = auth.uid() AND status = 'draft') OR
    get_my_role() = 'admin'
);

COMMENT ON POLICY "job_applications_select" ON public.job_applications IS
'Allow users to view their own job applications, admin can view all';

-- ============================================================================
-- 6. VACANCIES
-- ============================================================================

-- Enable RLS on vacancies
ALTER TABLE public.vacancies ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'vacancies' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.vacancies CASCADE';
    END LOOP;
END $$;

-- Everyone (including anonymous) can view active vacancies
CREATE POLICY "vacancies_select_public" ON public.vacancies
FOR SELECT TO authenticated, anon
USING (status = 'active' OR get_my_role() = 'admin');

-- Only admin can insert vacancies
CREATE POLICY "vacancies_insert" ON public.vacancies
FOR INSERT TO authenticated
WITH CHECK (get_my_role() = 'admin');

-- Only admin can update vacancies
CREATE POLICY "vacancies_update" ON public.vacancies
FOR UPDATE TO authenticated
USING (get_my_role() = 'admin')
WITH CHECK (get_my_role() = 'admin');

-- Only admin can delete vacancies
CREATE POLICY "vacancies_delete" ON public.vacancies
FOR DELETE TO authenticated
USING (get_my_role() = 'admin');

COMMENT ON POLICY "vacancies_select_public" ON public.vacancies IS
'Allow everyone to view active vacancies, admin can view all';

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================

-- Verify all policies were created
SELECT
    '✅ RLS enabled and policies created' as status,
    tablename,
    COUNT(*) as policy_count
FROM pg_policies
WHERE tablename IN (
    'lead_tags',
    'lead_reminders',
    'lead_tag_associations',
    'vehicle_inspections',
    'job_applications',
    'vacancies'
)
AND schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- Show all created policies
SELECT
    tablename,
    policyname,
    cmd as operation,
    CASE
        WHEN roles::text LIKE '%authenticated%' AND roles::text LIKE '%anon%' THEN 'authenticated + anon'
        WHEN roles::text LIKE '%authenticated%' THEN 'authenticated'
        ELSE roles::text
    END as allowed_roles
FROM pg_policies
WHERE tablename IN (
    'lead_tags',
    'lead_reminders',
    'lead_tag_associations',
    'vehicle_inspections',
    'job_applications',
    'vacancies'
)
AND schemaname = 'public'
ORDER BY tablename, cmd, policyname;
