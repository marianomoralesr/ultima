-- Fix infinite recursion in roadmap_items RLS policy
-- Similar issue as profiles table - policy queries profiles table causing recursion

-- Drop the problematic policy
DROP POLICY IF EXISTS "Admin users can manage all roadmap items" ON roadmap_items;

-- Create new policy using get_my_role() which is SECURITY DEFINER and bypasses RLS
CREATE POLICY "Admin users can manage all roadmap items" ON roadmap_items
    FOR ALL
    USING ((SELECT get_my_role()) = 'admin');

-- Verify the fix
SELECT policyname,
       CASE cmd
           WHEN 'r' THEN 'SELECT'
           WHEN 'a' THEN 'INSERT'
           WHEN 'w' THEN 'UPDATE'
           WHEN 'd' THEN 'DELETE'
           WHEN '*' THEN 'ALL'
           ELSE cmd::text
       END as command
FROM pg_policies
WHERE tablename = 'roadmap_items'
ORDER BY policyname;
