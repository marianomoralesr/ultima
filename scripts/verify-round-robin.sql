-- =====================================================================
-- Round-Robin Assignment Verification Script
-- =====================================================================

-- 1. Check Sales Agents
SELECT
    '1. SALES AGENTS' as section,
    id,
    email,
    first_name || ' ' || COALESCE(last_name, '') as full_name,
    created_at
FROM profiles
WHERE role = 'sales'
ORDER BY created_at;

-- Expected: 4 sales agents

-- 2. Check Assignment Status
SELECT
    '2. ASSIGNMENT STATUS' as section,
    COUNT(DISTINCT CASE WHEN role = 'sales' THEN id END) as total_sales_agents,
    COUNT(CASE WHEN role = 'user' THEN 1 END) as total_users,
    COUNT(CASE WHEN role = 'user' AND asesor_asignado_id IS NOT NULL THEN 1 END) as users_with_agent,
    COUNT(CASE WHEN role = 'user' AND asesor_asignado_id IS NULL THEN 1 END) as users_without_agent,
    ROUND(
        100.0 * COUNT(CASE WHEN role = 'user' AND asesor_asignado_id IS NOT NULL THEN 1 END) /
        NULLIF(COUNT(CASE WHEN role = 'user' THEN 1 END), 0),
        2
    ) as percentage_assigned
FROM profiles;

-- 3. Distribution Per Agent
SELECT
    '3. DISTRIBUTION PER AGENT' as section,
    s.email as sales_agent,
    s.first_name || ' ' || COALESCE(s.last_name, '') as agent_name,
    COUNT(u.id) as assigned_users,
    ROUND(
        100.0 * COUNT(u.id) /
        NULLIF(SUM(COUNT(u.id)) OVER (), 0),
        2
    ) as percentage_of_total
FROM profiles s
LEFT JOIN profiles u ON u.asesor_asignado_id = s.id AND u.role = 'user'
WHERE s.role = 'sales'
GROUP BY s.id, s.email, s.first_name, s.last_name
ORDER BY assigned_users DESC;

-- Expected: Fairly balanced distribution (within 10-15% of each other)

-- 4. Check Round-Robin State
SELECT
    '4. ROUND-ROBIN STATE' as section,
    last_assigned_index as current_index,
    (SELECT COUNT(*) FROM profiles WHERE role = 'sales') as total_agents,
    CASE
        WHEN last_assigned_index < (SELECT COUNT(*) FROM profiles WHERE role = 'sales')
        THEN 'Valid'
        ELSE 'Needs Reset'
    END as state_status
FROM agent_assignment_state;

-- 5. Recent Assignments (Last 10 users)
SELECT
    '5. RECENT ASSIGNMENTS' as section,
    u.email as user_email,
    u.created_at as user_created,
    s.email as assigned_to_agent,
    u.asesor_asignado_id IS NOT NULL as has_assignment
FROM profiles u
LEFT JOIN profiles s ON u.asesor_asignado_id = s.id
WHERE u.role = 'user'
ORDER BY u.created_at DESC
LIMIT 10;

-- 6. Unassigned Users (if any)
SELECT
    '6. UNASSIGNED USERS' as section,
    id,
    email,
    created_at,
    EXTRACT(DAY FROM NOW() - created_at) as days_since_creation
FROM profiles
WHERE role = 'user'
  AND asesor_asignado_id IS NULL
ORDER BY created_at DESC;

-- Expected: 0 rows after running the migration

-- 7. Test Round-Robin Function
SELECT
    '7. TEST ROUND-ROBIN' as section,
    get_next_sales_agent() as next_agent_1,
    get_next_sales_agent() as next_agent_2,
    get_next_sales_agent() as next_agent_3,
    get_next_sales_agent() as next_agent_4;

-- Expected: Different agent UUIDs in rotation

-- 8. Agent Names for Test Results
SELECT
    '8. AGENT MAPPING' as section,
    id as agent_id,
    email,
    first_name || ' ' || COALESCE(last_name, '') as name
FROM profiles
WHERE role = 'sales'
ORDER BY email;

-- =====================================================================
-- SUMMARY REPORT
-- =====================================================================

SELECT
    '=' as separator,
    'SUMMARY REPORT' as title,
    '=' as separator;

WITH assignment_stats AS (
    SELECT
        COUNT(DISTINCT CASE WHEN role = 'sales' THEN id END) as agents,
        COUNT(CASE WHEN role = 'user' THEN 1 END) as total_users,
        COUNT(CASE WHEN role = 'user' AND asesor_asignado_id IS NOT NULL THEN 1 END) as assigned,
        COUNT(CASE WHEN role = 'user' AND asesor_asignado_id IS NULL THEN 1 END) as unassigned
    FROM profiles
),
balance_check AS (
    SELECT
        MAX(count) - MIN(count) as imbalance,
        AVG(count) as average_per_agent
    FROM (
        SELECT COUNT(u.id) as count
        FROM profiles s
        LEFT JOIN profiles u ON u.asesor_asignado_id = s.id AND u.role = 'user'
        WHERE s.role = 'sales'
        GROUP BY s.id
    ) counts
)
SELECT
    agents as "Sales Agents",
    total_users as "Total Users",
    assigned as "Assigned Users",
    unassigned as "Unassigned Users",
    ROUND(100.0 * assigned / NULLIF(total_users, 0), 2) as "% Assigned",
    ROUND(average_per_agent, 2) as "Avg Per Agent",
    imbalance as "Max Imbalance"
FROM assignment_stats, balance_check;

-- =====================================================================
-- INTERPRETATION GUIDE
-- =====================================================================
--
-- Good Results:
-- - 4 sales agents found
-- - 100% of users have assignments (% Assigned = 100.00)
-- - Max Imbalance < 5 (fairly balanced)
-- - No rows in "Unassigned Users" section
--
-- Issues to Watch:
-- - Unassigned Users > 0: Run the assignment migration
-- - Max Imbalance > 10: Consider manual rebalancing
-- - State Status = 'Needs Reset': Reset agent_assignment_state
-- =====================================================================
