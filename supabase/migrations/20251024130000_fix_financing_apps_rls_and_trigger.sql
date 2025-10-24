-- ============================================================================
-- FIX FINANCING APPLICATIONS RLS AND TRIGGER
-- This migration fixes the RLS policies and trigger for financing_applications
-- to allow authenticated users to create draft applications
-- ============================================================================

-- Step 1: Fix the trigger function to use SECURITY INVOKER and handle explicit user_id
DROP FUNCTION IF EXISTS public.set_user_id_from_auth() CASCADE;

CREATE OR REPLACE FUNCTION public.set_user_id_from_auth()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER  -- Preserves auth context
SET search_path TO 'public'
AS $$
BEGIN
  -- Set user_id from auth.uid() if not provided
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;

  -- Raise an error if user_id is still NULL (not authenticated)
  IF NEW.user_id IS NULL THEN
    RAISE EXCEPTION 'user_id cannot be NULL. User must be authenticated.';
  END IF;

  RETURN NEW;
END;
$$;

-- Step 2: Recreate the trigger on financing_applications
DROP TRIGGER IF EXISTS bi_set_user_id_financing_applications ON public.financing_applications;

CREATE TRIGGER bi_set_user_id_financing_applications
BEFORE INSERT ON public.financing_applications
FOR EACH ROW
EXECUTE FUNCTION public.set_user_id_from_auth();

-- Step 3: Drop ALL existing RLS policies on financing_applications
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'financing_applications' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.financing_applications CASCADE';
    END LOOP;
END $$;

-- Step 4: Create simple RLS policies that work with explicit user_id
CREATE POLICY "financing_apps_insert" ON public.financing_applications
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());  -- Verify user is inserting their own data

CREATE POLICY "financing_apps_select" ON public.financing_applications
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR get_my_role() IN ('admin', 'sales'));

CREATE POLICY "financing_apps_update" ON public.financing_applications
FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "financing_apps_delete" ON public.financing_applications
FOR DELETE TO authenticated
USING (user_id = auth.uid() AND status = 'draft');

-- Step 5: Add comments
COMMENT ON FUNCTION public.set_user_id_from_auth() IS
'Automatically sets user_id from auth.uid() on INSERT if not provided. Uses SECURITY INVOKER to preserve auth context.';

COMMENT ON POLICY "financing_apps_insert" ON public.financing_applications IS
'Allow authenticated users to insert their own financing applications. Trigger sets user_id if not provided.';
