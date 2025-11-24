-- Fix sales access by adding SELECT policy and authorizing existing assigned leads
-- This migration solves the issue where sales agents cannot see their assigned leads

-- ============================================================================
-- 1. ADD SELECT POLICY FOR SALES TO VIEW THEIR ASSIGNED LEADS
-- ============================================================================

-- Drop existing select policies that might conflict
DROP POLICY IF EXISTS "profiles_sales_select_assigned" ON public.profiles;

-- Create a SELECT policy for sales users to view their assigned leads
CREATE POLICY "profiles_sales_select_assigned" ON public.profiles
FOR SELECT TO authenticated
USING (
  -- Sales users can view profiles that are:
  -- 1. Assigned to them (asesor_asignado_id = current user)
  -- 2. Have authorized access (asesor_autorizado_acceso = true)
  -- AND the current user has role 'sales'
  EXISTS (
    SELECT 1 FROM public.profiles sales
    WHERE sales.id = auth.uid()
      AND sales.role = 'sales'
  )
  AND profiles.asesor_asignado_id = auth.uid()
  AND COALESCE(profiles.asesor_autorizado_acceso, false) = true
);

COMMENT ON POLICY "profiles_sales_select_assigned" ON public.profiles IS
'Sales users can view profiles assigned to them where asesor_autorizado_acceso is true';

-- ============================================================================
-- 2. AUTHORIZE ALL EXISTING LEADS WITH ASSIGNED ADVISORS
-- ============================================================================

-- Set asesor_autorizado_acceso = true for all profiles that have an assigned advisor
-- This ensures sales agents can immediately see their assigned leads
UPDATE public.profiles
SET asesor_autorizado_acceso = true,
    updated_at = NOW()
WHERE asesor_asignado_id IS NOT NULL
  AND (asesor_autorizado_acceso IS NULL OR asesor_autorizado_acceso = false);

-- ============================================================================
-- 3. ADD POLICY FOR FINANCING_APPLICATIONS ACCESS BY SALES
-- ============================================================================

DROP POLICY IF EXISTS "financing_apps_sales_assigned" ON public.financing_applications;

-- Sales can view applications for their assigned and authorized leads
CREATE POLICY "financing_apps_sales_assigned" ON public.financing_applications
FOR SELECT TO authenticated
USING (
  -- Sales users can view applications from leads assigned to them
  EXISTS (
    SELECT 1 FROM public.profiles sales
    WHERE sales.id = auth.uid()
      AND sales.role = 'sales'
  )
  AND EXISTS (
    SELECT 1 FROM public.profiles lead
    WHERE lead.id = financing_applications.user_id
      AND lead.asesor_asignado_id = auth.uid()
      AND COALESCE(lead.asesor_autorizado_acceso, false) = true
  )
);

COMMENT ON POLICY "financing_apps_sales_assigned" ON public.financing_applications IS
'Sales users can view applications from their assigned and authorized leads';

-- ============================================================================
-- 4. ADD POLICY FOR UPLOADED_DOCUMENTS ACCESS BY SALES
-- ============================================================================

DROP POLICY IF EXISTS "uploaded_documents_sales_assigned" ON public.uploaded_documents;

-- Sales can view documents for their assigned and authorized leads
CREATE POLICY "uploaded_documents_sales_assigned" ON public.uploaded_documents
FOR SELECT TO authenticated
USING (
  -- Sales users can view documents from leads assigned to them
  EXISTS (
    SELECT 1 FROM public.profiles sales
    WHERE sales.id = auth.uid()
      AND sales.role = 'sales'
  )
  AND EXISTS (
    SELECT 1 FROM public.profiles lead
    WHERE lead.id = uploaded_documents.user_id
      AND lead.asesor_asignado_id = auth.uid()
      AND COALESCE(lead.asesor_autorizado_acceso, false) = true
  )
);

COMMENT ON POLICY "uploaded_documents_sales_assigned" ON public.uploaded_documents IS
'Sales users can view documents from their assigned and authorized leads';

-- ============================================================================
-- 5. ADD POLICY FOR STORAGE DOCUMENTS ACCESS BY SALES
-- ============================================================================

DROP POLICY IF EXISTS "documents_sales_assigned" ON storage.objects;

-- Sales can view documents for their assigned and authorized leads
CREATE POLICY "documents_sales_assigned" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'documents'
  AND EXISTS (
    SELECT 1 FROM public.profiles sales
    WHERE sales.id = auth.uid()
      AND sales.role = 'sales'
  )
  AND EXISTS (
    SELECT 1 FROM public.profiles lead
    WHERE lead.id::text = (storage.foldername(name))[1]
      AND lead.asesor_asignado_id = auth.uid()
      AND COALESCE(lead.asesor_autorizado_acceso, false) = true
  )
);

COMMENT ON POLICY "documents_sales_assigned" ON storage.objects IS
'Sales users can view storage documents from their assigned and authorized leads';

-- ============================================================================
-- 6. CREATE TRIGGER TO AUTOMATICALLY AUTHORIZE LEADS WHEN ASSIGNED
-- ============================================================================

-- Create or replace function to auto-authorize when assigning advisor
CREATE OR REPLACE FUNCTION public.auto_authorize_assigned_lead()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- If asesor_asignado_id is being set (not null), automatically authorize access
    IF NEW.asesor_asignado_id IS NOT NULL AND (OLD.asesor_asignado_id IS NULL OR OLD.asesor_asignado_id != NEW.asesor_asignado_id) THEN
        NEW.asesor_autorizado_acceso := true;
    END IF;

    RETURN NEW;
END;
$$;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_auto_authorize_assigned_lead ON public.profiles;

-- Create trigger on profiles table
CREATE TRIGGER trigger_auto_authorize_assigned_lead
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_authorize_assigned_lead();

COMMENT ON FUNCTION public.auto_authorize_assigned_lead() IS
'Automatically sets asesor_autorizado_acceso = true when asesor_asignado_id is assigned';

-- ============================================================================
-- 7. VERIFY AND LOG RESULTS
-- ============================================================================

DO $$
DECLARE
    sales_count INT;
    leads_authorized INT;
    leads_pending INT;
BEGIN
    SELECT COUNT(*) INTO sales_count
    FROM public.profiles
    WHERE role = 'sales';

    SELECT COUNT(*) INTO leads_authorized
    FROM public.profiles
    WHERE asesor_asignado_id IS NOT NULL
      AND COALESCE(asesor_autorizado_acceso, false) = true;

    SELECT COUNT(*) INTO leads_pending
    FROM public.profiles
    WHERE asesor_asignado_id IS NOT NULL
      AND (asesor_autorizado_acceso IS NULL OR asesor_autorizado_acceso = false);

    RAISE NOTICE '';
    RAISE NOTICE '=== SALES ACCESS FIX APPLIED ===';
    RAISE NOTICE '';
    RAISE NOTICE 'Statistics:';
    RAISE NOTICE '  - Sales users: %', sales_count;
    RAISE NOTICE '  - Authorized assigned leads: %', leads_authorized;
    RAISE NOTICE '  - Pending authorization: %', leads_pending;
    RAISE NOTICE '';
    RAISE NOTICE 'Changes Made:';
    RAISE NOTICE '  ✓ Added SELECT policy for sales to view assigned leads';
    RAISE NOTICE '  ✓ Authorized all existing assigned leads';
    RAISE NOTICE '  ✓ Added policies for financing_applications access';
    RAISE NOTICE '  ✓ Added policies for uploaded_documents access';
    RAISE NOTICE '  ✓ Added policies for storage documents access';
    RAISE NOTICE '  ✓ Created trigger to auto-authorize future assignments';
    RAISE NOTICE '';
    RAISE NOTICE 'Sales users can now:';
    RAISE NOTICE '  - View their assigned leads (SELECT)';
    RAISE NOTICE '  - View applications from assigned leads';
    RAISE NOTICE '  - View documents from assigned leads';
    RAISE NOTICE '  - Update contactado field (from previous migration)';
    RAISE NOTICE '';
END $$;
