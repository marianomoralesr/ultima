-- ============================================================================
-- CHECK IF YOUR JWT HAS ROLE CLAIM
-- ============================================================================
-- Run this FIRST to see if JWT-based solution will work
-- ============================================================================

-- Test 1: Check if we can read JWT claims
SELECT
  'JWT Claims Check' as test,
  CASE
    WHEN current_setting('request.jwt.claims', true) IS NOT NULL
    THEN '✅ JWT claims are accessible'
    ELSE '❌ No JWT claims found'
  END as result;

-- Test 2: Check what's in the JWT
SELECT
  'JWT Contents' as test,
  current_setting('request.jwt.claims', true)::json as jwt_data;

-- Test 3: Check if role is in JWT
SELECT
  'Role in JWT?' as test,
  current_setting('request.jwt.claims', true)::json->>'role' as role_value,
  CASE
    WHEN current_setting('request.jwt.claims', true)::json->>'role' IS NOT NULL
    THEN '✅ Role claim exists in JWT'
    ELSE '❌ Role NOT in JWT - need to add it'
  END as result;

-- Test 4: What roles exist in profiles table?
SELECT
  'Roles in Database' as test,
  role,
  COUNT(*) as user_count
FROM profiles
WHERE role IS NOT NULL
GROUP BY role
ORDER BY role;

-- ============================================================================
-- INTERPRETATION:
-- ============================================================================
-- If "Role in JWT?" shows ❌ Role NOT in JWT:
--   → You need to configure Supabase Auth to add role to JWT
--   → OR use the SECURITY DEFINER approach (but it was causing 556)
--   → OR use a different strategy
--
-- If "Role in JWT?" shows ✅ Role claim exists:
--   → JWT-based solution will work perfectly
--   → Safe to apply the migration
-- ============================================================================
