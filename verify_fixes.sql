-- Verification script for application creation and advisor assignment fixes

-- ==============================================================================
-- 1. Verify set_user_id_from_auth() function exists and is correct
-- ==============================================================================
SELECT
    proname as function_name,
    prosrc as source_code
FROM pg_proc
WHERE proname = 'set_user_id_from_auth';

-- ==============================================================================
-- 2. Verify triggers exist on financing_applications table
-- ==============================================================================
SELECT
    tgname as trigger_name,
    tgenabled as enabled,
    tgrelid::regclass as table_name,
    pg_get_triggerdef(oid) as trigger_definition
FROM pg_trigger
WHERE tgname = 'bi_set_user_id_financing_applications';

-- ==============================================================================
-- 3. Verify handle_new_user() function includes advisor assignment
-- ==============================================================================
SELECT
    proname as function_name,
    CASE
        WHEN prosrc LIKE '%assign_advisor%' THEN 'YES - includes advisor assignment'
        ELSE 'NO - missing advisor assignment'
    END as includes_advisor_assignment
FROM pg_proc
WHERE proname = 'handle_new_user';

-- ==============================================================================
-- 4. Check users without assigned advisors
-- ==============================================================================
SELECT
    COUNT(*) as users_without_advisor,
    (SELECT COUNT(*) FROM profiles WHERE role = 'user') as total_users
FROM profiles
WHERE role = 'user' AND asesor_asignado_id IS NULL;

-- ==============================================================================
-- 5. Check advisor assignment distribution
-- ==============================================================================
SELECT
    p_advisor.id as advisor_id,
    p_advisor.email as advisor_email,
    p_advisor.first_name || ' ' || COALESCE(p_advisor.last_name, '') as advisor_name,
    COUNT(p_user.id) as assigned_users_count,
    p_advisor.last_assigned_at
FROM profiles p_advisor
LEFT JOIN profiles p_user ON p_user.asesor_asignado_id = p_advisor.id AND p_user.role = 'user'
WHERE p_advisor.role = 'sales'
GROUP BY p_advisor.id, p_advisor.email, p_advisor.first_name, p_advisor.last_name, p_advisor.last_assigned_at
ORDER BY assigned_users_count DESC;

-- ==============================================================================
-- 6. Test application creation (will rollback, just testing)
-- ==============================================================================
BEGIN;
    -- This should work without RLS violation if trigger is correct
    INSERT INTO financing_applications (status)
    VALUES ('draft')
    RETURNING id, user_id, status;
ROLLBACK;
