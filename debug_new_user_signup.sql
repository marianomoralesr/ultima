-- Debug new user signup and advisor assignment
-- Run this while logged in as the test user

-- 1. Check if the test user profile was created correctly
SELECT
    id,
    email,
    role,
    asesor_asignado_id,
    first_name,
    last_name,
    created_at
FROM profiles
WHERE id = auth.uid();

-- 2. Check if there are sales agents available
SELECT
    id,
    email,
    first_name,
    last_name
FROM profiles
WHERE role = 'sales';

-- 3. Check agent_assignment_state
SELECT * FROM agent_assignment_state;

-- 4. Test the get_next_sales_agent function (should return a UUID)
SELECT get_next_sales_agent() as next_agent;

-- 5. Test if you can manually update your profile
BEGIN;

UPDATE profiles
SET asesor_asignado_id = (SELECT id FROM profiles WHERE role = 'sales' LIMIT 1)
WHERE id = auth.uid()
RETURNING id, email, asesor_asignado_id;

ROLLBACK;

-- 6. Check if you can insert into financing_applications
BEGIN;

INSERT INTO financing_applications (status)
VALUES ('draft')
RETURNING id, user_id, status, created_at;

ROLLBACK;
