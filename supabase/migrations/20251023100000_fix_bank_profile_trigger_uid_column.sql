-- Fix bank profile save error: "record 'new' has no field 'uid'"
-- The set_user_id_from_auth() trigger references NEW.uid but bank_profiles has user_id column

CREATE OR REPLACE FUNCTION "public"."set_user_id_from_auth"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$BEGIN
  -- Changed from NEW.uid to NEW.user_id to match actual column names
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  RETURN NEW;
END;$$;
