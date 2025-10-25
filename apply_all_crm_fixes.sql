-- ============================================================================
-- COMBINED CRM FIX MIGRATION
-- Apply all three fixes in order to resolve CRM profile loading issues
-- ============================================================================

-- ============================================================================
-- FIX 1: Fix ORDER BY syntax in get_secure_client_profile
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
    caller_email := auth.jwt()->>'email';

    is_admin := caller_email IN (
        'marianomorales@outlook.com',
        'mariano.morales@autostrefa.mx',
        'genauservices@gmail.com'
    );

    IF NOT is_admin THEN
        RETURN NULL;
    END IF;

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
                'id', lt.tag_id,
                'tag_name', t.tag_name,
                'color', t.color
            ))
             FROM lead_tags lt
             JOIN tags t ON t.id = lt.tag_id
             WHERE lt.lead_id = client_id),
            '[]'::jsonb
        ),
        'reminders', COALESCE(
            (SELECT jsonb_agg(to_jsonb(r.*) ORDER BY r.reminder_date ASC)
             FROM reminders r
             WHERE r.lead_id = client_id),
            '[]'::jsonb
        ),
        'documents', COALESCE(
            (SELECT jsonb_agg(to_jsonb(d.*) ORDER BY d.created_at DESC)
             FROM documents d
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

-- ============================================================================
-- FIX 2: Fix type mismatch in get_leads_for_dashboard
-- ============================================================================

DROP FUNCTION IF EXISTS public.get_leads_for_dashboard();

CREATE OR REPLACE FUNCTION public.get_leads_for_dashboard()
RETURNS TABLE(
  id uuid,
  first_name text,
  last_name text,
  email text,
  phone text,
  source text,
  contactado boolean,
  asesor_asignado text,
  latest_app_status text,
  latest_app_car_info jsonb,
  asesor_asignado_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    caller_email text;
    is_admin boolean;
BEGIN
    caller_email := auth.jwt()->>'email';

    is_admin := caller_email IN (
        'marianomorales@outlook.com',
        'mariano.morales@autostrefa.mx',
        'genauservices@gmail.com'
    );

    IF NOT is_admin THEN
        RAISE EXCEPTION 'Permission denied to access leads dashboard.';
    END IF;

    RETURN QUERY
    SELECT
        p.id,
        p.first_name,
        p.last_name,
        p.email,
        p.phone,
        p.source,
        p.contactado,
        COALESCE(asesor.email, '')::text as asesor_asignado,
        latest_app.status as latest_app_status,
        latest_app.car_info as latest_app_car_info,
        p.asesor_asignado_id
    FROM
        public.profiles p
    LEFT JOIN public.profiles asesor ON asesor.id = p.asesor_asignado_id
    LEFT JOIN LATERAL (
        SELECT fa.status, fa.car_info
        FROM public.financing_applications fa
        WHERE fa.user_id = p.id
        ORDER BY fa.created_at DESC
        LIMIT 1
    ) latest_app ON true
    WHERE p.role = 'user'
    ORDER BY p.updated_at DESC NULLS LAST;
END;
$$;

ALTER FUNCTION public.get_leads_for_dashboard() OWNER TO postgres;

-- ============================================================================
-- FIX 3: Fix RLS policies for CRM tables to use JWT
-- ============================================================================

-- TAGS
DROP POLICY IF EXISTS "tags_select" ON public.tags;
DROP POLICY IF EXISTS "tags_insert" ON public.tags;
DROP POLICY IF EXISTS "tags_update" ON public.tags;
DROP POLICY IF EXISTS "tags_delete" ON public.tags;

ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tags_select" ON public.tags
FOR SELECT TO authenticated
USING (auth.jwt()->>'email' IN ('marianomorales@outlook.com', 'mariano.morales@autostrefa.mx', 'genauservices@gmail.com'));

CREATE POLICY "tags_insert" ON public.tags
FOR INSERT TO authenticated
WITH CHECK (auth.jwt()->>'email' IN ('marianomorales@outlook.com', 'mariano.morales@autostrefa.mx', 'genauservices@gmail.com'));

CREATE POLICY "tags_update" ON public.tags
FOR UPDATE TO authenticated
USING (auth.jwt()->>'email' IN ('marianomorales@outlook.com', 'mariano.morales@autostrefa.mx', 'genauservices@gmail.com'));

CREATE POLICY "tags_delete" ON public.tags
FOR DELETE TO authenticated
USING (auth.jwt()->>'email' IN ('marianomorales@outlook.com', 'mariano.morales@autostrefa.mx', 'genauservices@gmail.com'));

-- LEAD_TAGS
DROP POLICY IF EXISTS "lead_tags_select" ON public.lead_tags;
DROP POLICY IF EXISTS "lead_tags_insert" ON public.lead_tags;
DROP POLICY IF EXISTS "lead_tags_update" ON public.lead_tags;
DROP POLICY IF EXISTS "lead_tags_delete" ON public.lead_tags;

CREATE POLICY "lead_tags_select" ON public.lead_tags
FOR SELECT TO authenticated
USING (auth.jwt()->>'email' IN ('marianomorales@outlook.com', 'mariano.morales@autostrefa.mx', 'genauservices@gmail.com'));

CREATE POLICY "lead_tags_insert" ON public.lead_tags
FOR INSERT TO authenticated
WITH CHECK (auth.jwt()->>'email' IN ('marianomorales@outlook.com', 'mariano.morales@autostrefa.mx', 'genauservices@gmail.com'));

CREATE POLICY "lead_tags_update" ON public.lead_tags
FOR UPDATE TO authenticated
USING (auth.jwt()->>'email' IN ('marianomorales@outlook.com', 'mariano.morales@autostrefa.mx', 'genauservices@gmail.com'));

CREATE POLICY "lead_tags_delete" ON public.lead_tags
FOR DELETE TO authenticated
USING (auth.jwt()->>'email' IN ('marianomorales@outlook.com', 'mariano.morales@autostrefa.mx', 'genauservices@gmail.com'));

-- REMINDERS (handle both table names)
DROP POLICY IF EXISTS "reminders_select" ON public.reminders;
DROP POLICY IF EXISTS "reminders_insert" ON public.reminders;
DROP POLICY IF EXISTS "reminders_update" ON public.reminders;
DROP POLICY IF EXISTS "reminders_delete" ON public.reminders;
DROP POLICY IF EXISTS "lead_reminders_select" ON public.lead_reminders;
DROP POLICY IF EXISTS "lead_reminders_insert" ON public.lead_reminders;
DROP POLICY IF EXISTS "lead_reminders_update" ON public.lead_reminders;
DROP POLICY IF EXISTS "lead_reminders_delete" ON public.lead_reminders;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'reminders') THEN
        ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
        EXECUTE 'CREATE POLICY "reminders_select" ON public.reminders FOR SELECT TO authenticated USING (auth.jwt()->>''email'' IN (''marianomorales@outlook.com'', ''mariano.morales@autostrefa.mx'', ''genauservices@gmail.com''))';
        EXECUTE 'CREATE POLICY "reminders_insert" ON public.reminders FOR INSERT TO authenticated WITH CHECK (auth.jwt()->>''email'' IN (''marianomorales@outlook.com'', ''mariano.morales@autostrefa.mx'', ''genauservices@gmail.com''))';
        EXECUTE 'CREATE POLICY "reminders_update" ON public.reminders FOR UPDATE TO authenticated USING (auth.jwt()->>''email'' IN (''marianomorales@outlook.com'', ''mariano.morales@autostrefa.mx'', ''genauservices@gmail.com''))';
        EXECUTE 'CREATE POLICY "reminders_delete" ON public.reminders FOR DELETE TO authenticated USING (auth.jwt()->>''email'' IN (''marianomorales@outlook.com'', ''mariano.morales@autostrefa.mx'', ''genauservices@gmail.com''))';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'lead_reminders') THEN
        ALTER TABLE public.lead_reminders ENABLE ROW LEVEL SECURITY;
        EXECUTE 'CREATE POLICY "lead_reminders_select" ON public.lead_reminders FOR SELECT TO authenticated USING (auth.jwt()->>''email'' IN (''marianomorales@outlook.com'', ''mariano.morales@autostrefa.mx'', ''genauservices@gmail.com''))';
        EXECUTE 'CREATE POLICY "lead_reminders_insert" ON public.lead_reminders FOR INSERT TO authenticated WITH CHECK (auth.jwt()->>''email'' IN (''marianomorales@outlook.com'', ''mariano.morales@autostrefa.mx'', ''genauservices@gmail.com''))';
        EXECUTE 'CREATE POLICY "lead_reminders_update" ON public.lead_reminders FOR UPDATE TO authenticated USING (auth.jwt()->>''email'' IN (''marianomorales@outlook.com'', ''mariano.morales@autostrefa.mx'', ''genauservices@gmail.com''))';
        EXECUTE 'CREATE POLICY "lead_reminders_delete" ON public.lead_reminders FOR DELETE TO authenticated USING (auth.jwt()->>''email'' IN (''marianomorales@outlook.com'', ''mariano.morales@autostrefa.mx'', ''genauservices@gmail.com''))';
    END IF;
END $$;

-- DOCUMENTS (handle both table names)
DROP POLICY IF EXISTS "documents_select" ON public.documents;
DROP POLICY IF EXISTS "documents_insert" ON public.documents;
DROP POLICY IF EXISTS "documents_update" ON public.documents;
DROP POLICY IF EXISTS "documents_delete" ON public.documents;
DROP POLICY IF EXISTS "uploaded_documents_select" ON public.uploaded_documents;
DROP POLICY IF EXISTS "uploaded_documents_insert" ON public.uploaded_documents;
DROP POLICY IF EXISTS "uploaded_documents_update" ON public.uploaded_documents;
DROP POLICY IF EXISTS "uploaded_documents_delete" ON public.uploaded_documents;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'documents') THEN
        ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
        EXECUTE 'CREATE POLICY "documents_select" ON public.documents FOR SELECT TO authenticated USING (user_id = auth.uid() OR auth.jwt()->>''email'' IN (''marianomorales@outlook.com'', ''mariano.morales@autostrefa.mx'', ''genauservices@gmail.com''))';
        EXECUTE 'CREATE POLICY "documents_insert" ON public.documents FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid())';
        EXECUTE 'CREATE POLICY "documents_update" ON public.documents FOR UPDATE TO authenticated USING (user_id = auth.uid() OR auth.jwt()->>''email'' IN (''marianomorales@outlook.com'', ''mariano.morales@autostrefa.mx'', ''genauservices@gmail.com''))';
        EXECUTE 'CREATE POLICY "documents_delete" ON public.documents FOR DELETE TO authenticated USING (user_id = auth.uid() OR auth.jwt()->>''email'' IN (''marianomorales@outlook.com'', ''mariano.morales@autostrefa.mx'', ''genauservices@gmail.com''))';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'uploaded_documents') THEN
        ALTER TABLE public.uploaded_documents ENABLE ROW LEVEL SECURITY;
        EXECUTE 'CREATE POLICY "uploaded_documents_select" ON public.uploaded_documents FOR SELECT TO authenticated USING (user_id = auth.uid() OR auth.jwt()->>''email'' IN (''marianomorales@outlook.com'', ''mariano.morales@autostrefa.mx'', ''genauservices@gmail.com''))';
        EXECUTE 'CREATE POLICY "uploaded_documents_insert" ON public.uploaded_documents FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid())';
        EXECUTE 'CREATE POLICY "uploaded_documents_update" ON public.uploaded_documents FOR UPDATE TO authenticated USING (user_id = auth.uid() OR auth.jwt()->>''email'' IN (''marianomorales@outlook.com'', ''mariano.morales@autostrefa.mx'', ''genauservices@gmail.com''))';
        EXECUTE 'CREATE POLICY "uploaded_documents_delete" ON public.uploaded_documents FOR DELETE TO authenticated USING (user_id = auth.uid() OR auth.jwt()->>''email'' IN (''marianomorales@outlook.com'', ''mariano.morales@autostrefa.mx'', ''genauservices@gmail.com''))';
    END IF;
END $$;

-- ============================================================================
-- DONE
-- ============================================================================
