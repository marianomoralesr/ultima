-- =====================================================================
-- Sales Dashboard Verification Script
-- Run this to verify your sales dashboard is properly configured
-- =====================================================================

-- 1. Check if RPC functions exist
SELECT
    'RPC Functions' as check_type,
    proname as function_name,
    'EXISTS' as status
FROM pg_proc
WHERE proname IN (
    'get_sales_assigned_leads',
    'get_sales_dashboard_stats',
    'get_sales_client_profile',
    'verify_sales_access_to_lead'
)
ORDER BY proname;

-- Expected: 4 functions should be listed

-- 2. Check for sales users
SELECT
    'Sales Users' as check_type,
    id,
    email,
    first_name,
    last_name,
    'EXISTS' as status
FROM profiles
WHERE role = 'sales'
LIMIT 10;

-- Expected: At least one sales user should exist

-- 3. Check for leads assigned to sales users
SELECT
    'Assigned Leads' as check_type,
    COUNT(*) as total_assigned_leads,
    COUNT(CASE WHEN autorizar_asesor_acceso = true THEN 1 END) as authorized_leads,
    COUNT(CASE WHEN autorizar_asesor_acceso = false OR autorizar_asesor_acceso IS NULL THEN 1 END) as unauthorized_leads
FROM profiles
WHERE asesor_asignado_id IS NOT NULL
  AND role = 'user';

-- Expected: Shows distribution of assigned leads

-- 4. Sample lead assignment check (replace UUIDs with real ones)
-- SELECT
--     p.id as lead_id,
--     p.email as lead_email,
--     p.asesor_asignado_id,
--     asesor.email as asesor_email,
--     p.autorizar_asesor_acceso,
--     CASE
--         WHEN p.autorizar_asesor_acceso = true THEN 'FULL ACCESS'
--         ELSE 'RESTRICTED'
--     END as access_level
-- FROM profiles p
-- LEFT JOIN profiles asesor ON p.asesor_asignado_id = asesor.id
-- WHERE p.asesor_asignado_id = 'YOUR-SALES-USER-UUID-HERE'
-- ORDER BY p.created_at DESC
-- LIMIT 10;

-- 5. Test the get_sales_assigned_leads function (replace UUID)
-- SELECT * FROM get_sales_assigned_leads('YOUR-SALES-USER-UUID-HERE');

-- 6. Test the get_sales_dashboard_stats function (replace UUID)
-- SELECT * FROM get_sales_dashboard_stats('YOUR-SALES-USER-UUID-HERE');

-- 7. Check for required columns in profiles table
SELECT
    'Profile Columns' as check_type,
    column_name,
    data_type,
    'EXISTS' as status
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name IN (
      'asesor_asignado_id',
      'autorizar_asesor_acceso',
      'role',
      'contactado'
  )
ORDER BY column_name;

-- Expected: All 4 columns should be listed

-- 8. Check lead_reminders table
SELECT
    'Lead Reminders Table' as check_type,
    COUNT(*) as total_reminders,
    COUNT(CASE WHEN is_completed = true THEN 1 END) as completed,
    COUNT(CASE WHEN is_completed = false OR is_completed IS NULL THEN 1 END) as pending
FROM lead_reminders;

-- 9. Check lead_tags table
SELECT
    'Lead Tags' as check_type,
    id,
    tag_name,
    color,
    'EXISTS' as status
FROM lead_tags
ORDER BY tag_name;

-- 10. Summary Report
SELECT
    'SUMMARY REPORT' as report_type,
    (SELECT COUNT(*) FROM profiles WHERE role = 'sales') as total_sales_users,
    (SELECT COUNT(*) FROM profiles WHERE asesor_asignado_id IS NOT NULL) as total_assigned_leads,
    (SELECT COUNT(*) FROM profiles WHERE autorizar_asesor_acceso = true) as leads_with_authorized_access,
    (SELECT COUNT(*) FROM lead_tags) as total_tags_available,
    (SELECT COUNT(*) FROM lead_reminders) as total_reminders;

-- =====================================================================
-- Quick Fix Queries (uncomment and modify as needed)
-- =====================================================================

-- Create a test sales user:
-- INSERT INTO profiles (id, email, role, first_name, last_name)
-- VALUES (
--     gen_random_uuid(),
--     'sales@example.com',
--     'sales',
--     'Test',
--     'Sales'
-- );

-- Assign a lead to a sales user:
-- UPDATE profiles
-- SET asesor_asignado_id = 'SALES-USER-UUID'
-- WHERE id = 'LEAD-USER-UUID';

-- Authorize sales access for a lead:
-- UPDATE profiles
-- SET autorizar_asesor_acceso = true
-- WHERE id = 'LEAD-USER-UUID';

-- Create sample tags:
-- INSERT INTO lead_tags (tag_name, color) VALUES
--     ('Alta Prioridad', '#EF4444'),
--     ('Necesita Seguimiento', '#F59E0B'),
--     ('Interesado', '#10B981'),
--     ('En Proceso', '#3B82F6'),
--     ('Cerrado', '#6B7280');
