-- Fix RLS policies for CRM-related tables to use JWT instead of get_my_role()
-- This prevents infinite recursion when SECURITY DEFINER functions query these tables
-- Tables affected: tags, lead_tags, reminders, documents

-- ============================================================================
-- 1. TAGS TABLE
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "tags_select" ON public.tags;
DROP POLICY IF EXISTS "tags_insert" ON public.tags;
DROP POLICY IF EXISTS "tags_update" ON public.tags;
DROP POLICY IF EXISTS "tags_delete" ON public.tags;

-- Enable RLS if not already enabled
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

-- Admin and sales can manage all tags (using JWT email)
CREATE POLICY "tags_select" ON public.tags
FOR SELECT TO authenticated
USING (
  auth.jwt()->>'email' IN (
    'marianomorales@outlook.com',
    'mariano.morales@autostrefa.mx',
    'genauservices@gmail.com'
  )
);

CREATE POLICY "tags_insert" ON public.tags
FOR INSERT TO authenticated
WITH CHECK (
  auth.jwt()->>'email' IN (
    'marianomorales@outlook.com',
    'mariano.morales@autostrefa.mx',
    'genauservices@gmail.com'
  )
);

CREATE POLICY "tags_update" ON public.tags
FOR UPDATE TO authenticated
USING (
  auth.jwt()->>'email' IN (
    'marianomorales@outlook.com',
    'mariano.morales@autostrefa.mx',
    'genauservices@gmail.com'
  )
)
WITH CHECK (
  auth.jwt()->>'email' IN (
    'marianomorales@outlook.com',
    'mariano.morales@autostrefa.mx',
    'genauservices@gmail.com'
  )
);

CREATE POLICY "tags_delete" ON public.tags
FOR DELETE TO authenticated
USING (
  auth.jwt()->>'email' IN (
    'marianomorales@outlook.com',
    'mariano.morales@autostrefa.mx',
    'genauservices@gmail.com'
  )
);

-- ============================================================================
-- 2. LEAD_TAGS TABLE
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "lead_tags_select" ON public.lead_tags;
DROP POLICY IF EXISTS "lead_tags_insert" ON public.lead_tags;
DROP POLICY IF EXISTS "lead_tags_update" ON public.lead_tags;
DROP POLICY IF EXISTS "lead_tags_delete" ON public.lead_tags;

-- Admin and sales can manage all lead tags (using JWT email)
CREATE POLICY "lead_tags_select" ON public.lead_tags
FOR SELECT TO authenticated
USING (
  auth.jwt()->>'email' IN (
    'marianomorales@outlook.com',
    'mariano.morales@autostrefa.mx',
    'genauservices@gmail.com'
  )
);

CREATE POLICY "lead_tags_insert" ON public.lead_tags
FOR INSERT TO authenticated
WITH CHECK (
  auth.jwt()->>'email' IN (
    'marianomorales@outlook.com',
    'mariano.morales@autostrefa.mx',
    'genauservices@gmail.com'
  )
);

CREATE POLICY "lead_tags_update" ON public.lead_tags
FOR UPDATE TO authenticated
USING (
  auth.jwt()->>'email' IN (
    'marianomorales@outlook.com',
    'mariano.morales@autostrefa.mx',
    'genauservices@gmail.com'
  )
)
WITH CHECK (
  auth.jwt()->>'email' IN (
    'marianomorales@outlook.com',
    'mariano.morales@autostrefa.mx',
    'genauservices@gmail.com'
  )
);

CREATE POLICY "lead_tags_delete" ON public.lead_tags
FOR DELETE TO authenticated
USING (
  auth.jwt()->>'email' IN (
    'marianomorales@outlook.com',
    'mariano.morales@autostrefa.mx',
    'genauservices@gmail.com'
  )
);

-- ============================================================================
-- 3. REMINDERS TABLE (lead_reminders or reminders)
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "reminders_select" ON public.reminders;
DROP POLICY IF EXISTS "reminders_insert" ON public.reminders;
DROP POLICY IF EXISTS "reminders_update" ON public.reminders;
DROP POLICY IF EXISTS "reminders_delete" ON public.reminders;
DROP POLICY IF EXISTS "lead_reminders_select" ON public.lead_reminders;
DROP POLICY IF EXISTS "lead_reminders_insert" ON public.lead_reminders;
DROP POLICY IF EXISTS "lead_reminders_update" ON public.lead_reminders;
DROP POLICY IF EXISTS "lead_reminders_delete" ON public.lead_reminders;

-- Enable RLS on reminders table (try both names)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'reminders') THEN
        ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'lead_reminders') THEN
        ALTER TABLE public.lead_reminders ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Create policies for reminders table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'reminders') THEN
        EXECUTE 'CREATE POLICY "reminders_select" ON public.reminders
        FOR SELECT TO authenticated
        USING (
          auth.jwt()->>''email'' IN (
            ''marianomorales@outlook.com'',
            ''mariano.morales@autostrefa.mx'',
            ''genauservices@gmail.com''
          )
        )';

        EXECUTE 'CREATE POLICY "reminders_insert" ON public.reminders
        FOR INSERT TO authenticated
        WITH CHECK (
          auth.jwt()->>''email'' IN (
            ''marianomorales@outlook.com'',
            ''mariano.morales@autostrefa.mx'',
            ''genauservices@gmail.com''
          )
        )';

        EXECUTE 'CREATE POLICY "reminders_update" ON public.reminders
        FOR UPDATE TO authenticated
        USING (
          auth.jwt()->>''email'' IN (
            ''marianomorales@outlook.com'',
            ''mariano.morales@autostrefa.mx'',
            ''genauservices@gmail.com''
          )
        )';

        EXECUTE 'CREATE POLICY "reminders_delete" ON public.reminders
        FOR DELETE TO authenticated
        USING (
          auth.jwt()->>''email'' IN (
            ''marianomorales@outlook.com'',
            ''mariano.morales@autostrefa.mx'',
            ''genauservices@gmail.com''
          )
        )';
    END IF;
END $$;

-- Create policies for lead_reminders table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'lead_reminders') THEN
        EXECUTE 'CREATE POLICY "lead_reminders_select" ON public.lead_reminders
        FOR SELECT TO authenticated
        USING (
          auth.jwt()->>''email'' IN (
            ''marianomorales@outlook.com'',
            ''mariano.morales@autostrefa.mx'',
            ''genauservices@gmail.com''
          )
        )';

        EXECUTE 'CREATE POLICY "lead_reminders_insert" ON public.lead_reminders
        FOR INSERT TO authenticated
        WITH CHECK (
          auth.jwt()->>''email'' IN (
            ''marianomorales@outlook.com'',
            ''mariano.morales@autostrefa.mx'',
            ''genauservices@gmail.com''
          )
        )';

        EXECUTE 'CREATE POLICY "lead_reminders_update" ON public.lead_reminders
        FOR UPDATE TO authenticated
        USING (
          auth.jwt()->>''email'' IN (
            ''marianomorales@outlook.com'',
            ''mariano.morales@autostrefa.mx'',
            ''genauservices@gmail.com''
          )
        )';

        EXECUTE 'CREATE POLICY "lead_reminders_delete" ON public.lead_reminders
        FOR DELETE TO authenticated
        USING (
          auth.jwt()->>''email'' IN (
            ''marianomorales@outlook.com'',
            ''mariano.morales@autostrefa.mx'',
            ''genauservices@gmail.com''
          )
        )';
    END IF;
END $$;

-- ============================================================================
-- 4. DOCUMENTS TABLE
-- ============================================================================

-- Drop existing policies that use get_my_role()
DROP POLICY IF EXISTS "documents_select" ON public.documents;
DROP POLICY IF EXISTS "documents_insert" ON public.documents;
DROP POLICY IF EXISTS "documents_update" ON public.documents;
DROP POLICY IF EXISTS "documents_delete" ON public.documents;
DROP POLICY IF EXISTS "uploaded_documents_select" ON public.uploaded_documents;
DROP POLICY IF EXISTS "uploaded_documents_insert" ON public.uploaded_documents;
DROP POLICY IF EXISTS "uploaded_documents_update" ON public.uploaded_documents;
DROP POLICY IF EXISTS "uploaded_documents_delete" ON public.uploaded_documents;

-- Enable RLS on documents table (try both names)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'documents') THEN
        ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'uploaded_documents') THEN
        ALTER TABLE public.uploaded_documents ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Create policies for documents table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'documents') THEN
        -- Users can view their own documents, admin can view all
        EXECUTE 'CREATE POLICY "documents_select" ON public.documents
        FOR SELECT TO authenticated
        USING (
          user_id = auth.uid() OR
          auth.jwt()->>''email'' IN (
            ''marianomorales@outlook.com'',
            ''mariano.morales@autostrefa.mx'',
            ''genauservices@gmail.com''
          )
        )';

        -- Users can insert their own documents
        EXECUTE 'CREATE POLICY "documents_insert" ON public.documents
        FOR INSERT TO authenticated
        WITH CHECK (user_id = auth.uid())';

        -- Admin can update all, users can update their own
        EXECUTE 'CREATE POLICY "documents_update" ON public.documents
        FOR UPDATE TO authenticated
        USING (
          user_id = auth.uid() OR
          auth.jwt()->>''email'' IN (
            ''marianomorales@outlook.com'',
            ''mariano.morales@autostrefa.mx'',
            ''genauservices@gmail.com''
          )
        )';

        -- Admin can delete all, users can delete their own
        EXECUTE 'CREATE POLICY "documents_delete" ON public.documents
        FOR DELETE TO authenticated
        USING (
          user_id = auth.uid() OR
          auth.jwt()->>''email'' IN (
            ''marianomorales@outlook.com'',
            ''mariano.morales@autostrefa.mx'',
            ''genauservices@gmail.com''
          )
        )';
    END IF;
END $$;

-- Create policies for uploaded_documents table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'uploaded_documents') THEN
        -- Users can view their own documents, admin can view all
        EXECUTE 'CREATE POLICY "uploaded_documents_select" ON public.uploaded_documents
        FOR SELECT TO authenticated
        USING (
          user_id = auth.uid() OR
          auth.jwt()->>''email'' IN (
            ''marianomorales@outlook.com'',
            ''mariano.morales@autostrefa.mx'',
            ''genauservices@gmail.com''
          )
        )';

        -- Users can insert their own documents
        EXECUTE 'CREATE POLICY "uploaded_documents_insert" ON public.uploaded_documents
        FOR INSERT TO authenticated
        WITH CHECK (user_id = auth.uid())';

        -- Admin can update all, users can update their own
        EXECUTE 'CREATE POLICY "uploaded_documents_update" ON public.uploaded_documents
        FOR UPDATE TO authenticated
        USING (
          user_id = auth.uid() OR
          auth.jwt()->>''email'' IN (
            ''marianomorales@outlook.com'',
            ''mariano.morales@autostrefa.mx'',
            ''genauservices@gmail.com''
          )
        )';

        -- Admin can delete all, users can delete their own
        EXECUTE 'CREATE POLICY "uploaded_documents_delete" ON public.uploaded_documents
        FOR DELETE TO authenticated
        USING (
          user_id = auth.uid() OR
          auth.jwt()->>''email'' IN (
            ''marianomorales@outlook.com'',
            ''mariano.morales@autostrefa.mx'',
            ''genauservices@gmail.com''
          )
        )';
    END IF;
END $$;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.tags IS 'CRM tags - uses JWT-based RLS to avoid recursion';
COMMENT ON TABLE public.lead_tags IS 'Lead tag associations - uses JWT-based RLS to avoid recursion';

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'reminders') THEN
        COMMENT ON TABLE public.reminders IS 'CRM reminders - uses JWT-based RLS to avoid recursion';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'lead_reminders') THEN
        COMMENT ON TABLE public.lead_reminders IS 'CRM reminders - uses JWT-based RLS to avoid recursion';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'documents') THEN
        COMMENT ON TABLE public.documents IS 'User documents - uses JWT-based RLS to avoid recursion';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'uploaded_documents') THEN
        COMMENT ON TABLE public.uploaded_documents IS 'User documents - uses JWT-based RLS to avoid recursion';
    END IF;
END $$;
