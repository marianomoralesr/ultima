-- Assign advisors to existing users using round-robin logic
-- This will assign sales agents to users who don't currently have one

-- 1. First, let's see the current state
SELECT
    'Sales Agents' as category,
    COUNT(*) as count
FROM profiles
WHERE role = 'sales'
UNION ALL
SELECT
    'Regular Users' as category,
    COUNT(*) as count
FROM profiles
WHERE role = 'user'
UNION ALL
SELECT
    'Users WITHOUT Advisor' as category,
    COUNT(*) as count
FROM profiles
WHERE role = 'user' AND asesor_asignado_id IS NULL
UNION ALL
SELECT
    'Users WITH Advisor' as category,
    COUNT(*) as count
FROM profiles
WHERE role = 'user' AND asesor_asignado_id IS NOT NULL;

-- 2. Show which sales agents currently have assignments
SELECT
    s.id,
    s.email,
    s.first_name,
    s.last_name,
    COUNT(u.id) as assigned_users
FROM profiles s
LEFT JOIN profiles u ON u.asesor_asignado_id = s.id AND u.role = 'user'
WHERE s.role = 'sales'
GROUP BY s.id, s.email, s.first_name, s.last_name
ORDER BY assigned_users ASC;

-- 3. Assign advisors to users who don't have one
DO $$
DECLARE
    user_record RECORD;
    assigned_advisor_id uuid;
BEGIN
    -- Loop through all users without an advisor
    FOR user_record IN
        SELECT id, email
        FROM profiles
        WHERE role = 'user'
        AND asesor_asignado_id IS NULL
        ORDER BY created_at ASC  -- Oldest users first
    LOOP
        -- Call the assign_advisor function
        BEGIN
            PERFORM public.assign_advisor(user_record.id);
            RAISE NOTICE '✅ Assigned advisor to user: % (%)', user_record.email, user_record.id;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '❌ Failed to assign advisor to user: % - Error: %', user_record.email, SQLERRM;
        END;
    END LOOP;

    RAISE NOTICE '✅ Advisor assignment complete!';
END $$;

-- 4. Verify the assignments
SELECT
    'Assignment Summary' as title,
    '' as email,
    '' as advisor;

SELECT
    s.email as advisor_email,
    s.first_name || ' ' || s.last_name as advisor_name,
    COUNT(u.id) as assigned_users
FROM profiles s
LEFT JOIN profiles u ON u.asesor_asignado_id = s.id AND u.role = 'user'
WHERE s.role = 'sales'
GROUP BY s.id, s.email, s.first_name, s.last_name
ORDER BY assigned_users ASC;

-- 5. Show sample user assignments
SELECT
    u.email as user_email,
    u.first_name as user_first_name,
    s.email as advisor_email,
    s.first_name || ' ' || s.last_name as advisor_name
FROM profiles u
LEFT JOIN profiles s ON u.asesor_asignado_id = s.id
WHERE u.role = 'user'
ORDER BY u.created_at DESC
LIMIT 10;
