-- Check your current user's role
-- Run this in Supabase SQL Editor while logged in

SELECT
    id,
    email,
    role,
    first_name,
    last_name,
    created_at
FROM profiles
WHERE email = 'YOUR_EMAIL_HERE'  -- Replace with your email
LIMIT 1;

-- If your role is not 'admin' or 'sales', update it:
-- UPDATE profiles
-- SET role = 'admin'
-- WHERE email = 'YOUR_EMAIL_HERE';

-- Check if the get_leads_for_dashboard function exists and works:
SELECT COUNT(*) as lead_count
FROM get_leads_for_dashboard();

-- Verify the function filters correctly (should only return role='user'):
SELECT DISTINCT role
FROM profiles
WHERE id IN (SELECT id FROM get_leads_for_dashboard());
-- Should only return 'user' or empty result
