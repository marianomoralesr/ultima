-- Comprehensive verification and fix for trigger issues

-- 1. CHECK: Current trigger function source
SELECT
    proname as function_name,
    prosrc as source_code
FROM pg_proc
WHERE proname = 'set_user_id_from_auth';

-- If the source shows NEW.uid instead of NEW.user_id, run this fix:

-- FIX: Update the trigger function
CREATE OR REPLACE FUNCTION "public"."set_user_id_from_auth"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$BEGIN
  -- Changed from NEW.uid to NEW.user_id to match actual column names
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  RETURN NEW;
END;$$;

-- 2. VERIFY: Test the trigger works
BEGIN;

-- This should successfully set user_id from auth.uid()
INSERT INTO financing_applications (status)
VALUES ('draft')
RETURNING id, user_id, status;

ROLLBACK;

-- 3. CHECK: Your current profile and auth
SELECT
    auth.uid() as auth_user_id,
    p.id as profile_id,
    p.email,
    p.role,
    p.asesor_asignado_id
FROM profiles p
WHERE p.id = auth.uid();

-- 4. FIX: Initialize agent_assignment_state if needed
INSERT INTO agent_assignment_state (last_assigned_index)
VALUES (0)
ON CONFLICT DO NOTHING;

-- 5. TEST: Get next sales agent
SELECT get_next_sales_agent() as next_agent_id;

-- 6. FIX: Manually assign advisor to current user
UPDATE profiles
SET asesor_asignado_id = (
    SELECT id FROM profiles WHERE role = 'sales' LIMIT 1
)
WHERE id = auth.uid()
AND role = 'user'
AND asesor_asignado_id IS NULL
RETURNING id, email, asesor_asignado_id;
