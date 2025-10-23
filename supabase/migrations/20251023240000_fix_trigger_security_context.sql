-- Fix trigger function to use SECURITY INVOKER instead of SECURITY DEFINER
-- This allows auth.uid() to work correctly in the trigger context

-- Drop and recreate the trigger function with correct security context
DROP FUNCTION IF EXISTS public.set_user_id_from_auth() CASCADE;

CREATE OR REPLACE FUNCTION public.set_user_id_from_auth()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER  -- Changed from SECURITY DEFINER!
SET search_path TO 'public'
AS $$
BEGIN
  -- Set user_id from auth.uid() if not provided
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;

  -- Raise an error if auth.uid() is still NULL (not authenticated)
  IF NEW.user_id IS NULL THEN
    RAISE EXCEPTION 'user_id cannot be NULL. User must be authenticated.';
  END IF;

  RETURN NEW;
END;
$$;

-- Recreate the trigger on financing_applications
DROP TRIGGER IF EXISTS bi_set_user_id_financing_applications ON public.financing_applications;

CREATE TRIGGER bi_set_user_id_financing_applications
BEFORE INSERT ON public.financing_applications
FOR EACH ROW
EXECUTE FUNCTION public.set_user_id_from_auth();

-- Also check if there's a trigger on the older 'applications' table
DROP TRIGGER IF EXISTS bi_set_user_id_applications ON public.applications;

CREATE TRIGGER bi_set_user_id_applications
BEFORE INSERT ON public.applications
FOR EACH ROW
EXECUTE FUNCTION public.set_user_id_from_auth();

COMMENT ON FUNCTION public.set_user_id_from_auth() IS
'Automatically sets user_id from auth.uid() on INSERT. Uses SECURITY INVOKER to preserve auth context.';
