-- Debug advisor assignment issue

-- 1. Check if there are any sales agents
SELECT
    id,
    email,
    role,
    first_name,
    last_name
FROM profiles
WHERE role = 'sales';

-- 2. Check agent_assignment_state table exists and has data
SELECT * FROM agent_assignment_state;

-- 3. Check your current user profile
SELECT
    id,
    email,
    role,
    asesor_asignado_id,
    first_name,
    last_name
FROM profiles
WHERE id = auth.uid();

-- 4. Test the get_next_sales_agent function
SELECT get_next_sales_agent() as next_agent_id;

-- 5. Check if there's an issue with the profiles update RLS policy
SELECT
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'profiles' AND cmd = 'UPDATE';
