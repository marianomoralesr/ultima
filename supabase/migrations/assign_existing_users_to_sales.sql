-- =====================================================================
-- Assign Sales Agents to Existing Users (Round Robin)
-- =====================================================================
-- This migration assigns sales agents to all existing users who don't
-- currently have one assigned, using the round-robin mechanism.
-- =====================================================================

-- Create a function to batch assign users to sales agents
CREATE OR REPLACE FUNCTION assign_users_to_sales_agents()
RETURNS TABLE (
    users_assigned BIGINT,
    assignments_per_agent JSONB
) AS $$
DECLARE
    unassigned_users CURSOR FOR
        SELECT id
        FROM profiles
        WHERE role = 'user'
          AND asesor_asignado_id IS NULL
        ORDER BY created_at ASC; -- Oldest users first

    user_record RECORD;
    agent_id UUID;
    total_assigned BIGINT := 0;
    agent_counts JSONB := '{}'::JSONB;
    agent_email TEXT;
BEGIN
    -- Open the cursor
    OPEN unassigned_users;

    -- Loop through each unassigned user
    LOOP
        FETCH unassigned_users INTO user_record;
        EXIT WHEN NOT FOUND;

        -- Get the next sales agent using round-robin
        SELECT get_next_sales_agent() INTO agent_id;

        -- If we got an agent, assign the user
        IF agent_id IS NOT NULL THEN
            UPDATE profiles
            SET asesor_asignado_id = agent_id,
                updated_at = NOW()
            WHERE id = user_record.id;

            total_assigned := total_assigned + 1;

            -- Track assignments per agent for reporting
            SELECT email INTO agent_email FROM profiles WHERE id = agent_id;
            IF agent_counts ? agent_email THEN
                agent_counts := jsonb_set(
                    agent_counts,
                    ARRAY[agent_email],
                    to_jsonb((agent_counts->>agent_email)::int + 1)
                );
            ELSE
                agent_counts := jsonb_set(agent_counts, ARRAY[agent_email], '1'::jsonb);
            END IF;
        END IF;
    END LOOP;

    -- Close the cursor
    CLOSE unassigned_users;

    -- Return the results
    RETURN QUERY SELECT total_assigned, agent_counts;
END;
$$ LANGUAGE plpgsql;

-- Execute the assignment
DO $$
DECLARE
    result_record RECORD;
BEGIN
    -- Call the assignment function
    SELECT * INTO result_record FROM assign_users_to_sales_agents();

    -- Log the results
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Sales Agent Assignment Complete';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total users assigned: %', result_record.users_assigned;
    RAISE NOTICE 'Assignments per agent: %', result_record.assignments_per_agent;
    RAISE NOTICE '========================================';
END $$;

-- Drop the temporary function (we don't need it after this migration)
DROP FUNCTION IF EXISTS assign_users_to_sales_agents();

-- =====================================================================
-- Verification Query
-- =====================================================================
-- Run this to verify the assignments were successful:
--
-- SELECT
--     s.email as sales_agent,
--     s.first_name || ' ' || s.last_name as agent_name,
--     COUNT(u.id) as assigned_users
-- FROM profiles s
-- LEFT JOIN profiles u ON u.asesor_asignado_id = s.id
-- WHERE s.role = 'sales'
-- GROUP BY s.id, s.email, s.first_name, s.last_name
-- ORDER BY assigned_users DESC;
-- =====================================================================

-- =====================================================================
-- Summary Statistics
-- =====================================================================

-- Show current assignment distribution
SELECT
    'Assignment Summary' as report_type,
    COUNT(DISTINCT CASE WHEN role = 'sales' THEN id END) as total_sales_agents,
    COUNT(CASE WHEN role = 'user' AND asesor_asignado_id IS NOT NULL THEN 1 END) as users_with_agent,
    COUNT(CASE WHEN role = 'user' AND asesor_asignado_id IS NULL THEN 1 END) as users_without_agent,
    COUNT(CASE WHEN role = 'user' THEN 1 END) as total_users
FROM profiles;

-- Show detailed distribution per agent
SELECT
    s.email as sales_agent_email,
    COALESCE(s.first_name || ' ' || s.last_name, 'Unknown') as sales_agent_name,
    COUNT(u.id) as assigned_users_count
FROM profiles s
LEFT JOIN profiles u ON u.asesor_asignado_id = s.id AND u.role = 'user'
WHERE s.role = 'sales'
GROUP BY s.id, s.email, s.first_name, s.last_name
ORDER BY assigned_users_count DESC;

-- =====================================================================
-- Comments
-- =====================================================================

COMMENT ON FUNCTION get_next_sales_agent IS 'Returns the next sales agent ID using round-robin distribution. Automatically called when new users are created without an assigned agent.';

-- =====================================================================
-- Future-proofing: Ensure new users get assigned automatically
-- =====================================================================

-- The AuthContext.tsx already handles automatic assignment for new users
-- via the get_next_sales_agent() function when profile.role === 'user'
-- and profile.asesor_asignado_id is NULL.

-- This migration only handles existing users who were created before
-- the round-robin assignment was implemented.
