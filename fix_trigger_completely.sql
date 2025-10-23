-- COMPLETE FIX: Recreate trigger and function from scratch

-- Step 1: Check current trigger status
SELECT
    tgname as trigger_name,
    tgenabled as enabled,
    tgrelid::regclass as table_name
FROM pg_trigger
WHERE tgname = 'bi_set_user_id_financing_applications';

-- Step 2: Drop and recreate the function
DROP FUNCTION IF EXISTS public.set_user_id_from_auth() CASCADE;

CREATE FUNCTION public.set_user_id_from_auth()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Set user_id from authenticated user
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

-- Step 3: Recreate the trigger on financing_applications
DROP TRIGGER IF EXISTS bi_set_user_id_financing_applications ON public.financing_applications;

CREATE TRIGGER bi_set_user_id_financing_applications
  BEFORE INSERT ON public.financing_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_id_from_auth();

-- Step 4: Recreate triggers for other tables
DROP TRIGGER IF EXISTS bi_set_user_id_bank_profiles ON public.bank_profiles;
CREATE TRIGGER bi_set_user_id_bank_profiles
  BEFORE INSERT ON public.bank_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_id_from_auth();

DROP TRIGGER IF EXISTS bi_set_user_id_applications ON public.applications;
CREATE TRIGGER bi_set_user_id_applications
  BEFORE INSERT ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_id_from_auth();

DROP TRIGGER IF EXISTS bi_set_user_id_uploaded_documents ON public.uploaded_documents;
CREATE TRIGGER bi_set_user_id_uploaded_documents
  BEFORE INSERT ON public.uploaded_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_id_from_auth();

DROP TRIGGER IF EXISTS bi_set_user_id_user_vehicles_for_sale ON public.user_vehicles_for_sale;
CREATE TRIGGER bi_set_user_id_user_vehicles_for_sale
  BEFORE INSERT ON public.user_vehicles_for_sale
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_id_from_auth();

-- Step 5: VERIFY it works now
BEGIN;
INSERT INTO financing_applications (status)
VALUES ('draft')
RETURNING id, user_id, status;
ROLLBACK;

-- Step 6: Assign advisor
UPDATE profiles
SET asesor_asignado_id = (SELECT id FROM profiles WHERE role = 'sales' LIMIT 1)
WHERE id = auth.uid() AND role = 'user'
RETURNING email, asesor_asignado_id;
