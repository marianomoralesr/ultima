# Sales Dashboard - Final Setup Checklist

## ✅ Completed Steps

- [x] **Frontend Components Created**
  - SalesLeadsDashboardPage.tsx
  - SalesClientProfilePage.tsx
  - SalesRoute.tsx guard component
  - SalesService.ts API layer

- [x] **Routes Configured**
  - `/escritorio/ventas/leads` → Sales Dashboard
  - `/escritorio/ventas/cliente/:id` → Client Profile

- [x] **Database Migration Applied** ✨
  - `get_sales_assigned_leads(UUID)` function created
  - `get_sales_dashboard_stats(UUID)` function created
  - `get_sales_client_profile(UUID, UUID)` function created
  - `verify_sales_access_to_lead(UUID, UUID)` function created

- [x] **Build Verified**
  - No TypeScript errors
  - All components compile successfully
  - Bundle size: ~7.88 KB (dashboard) + 14.47 KB (profile)

- [x] **Documentation Created**
  - Setup guide (SALES_DASHBOARD_SETUP.md)
  - Feature documentation (docs/SALES_DASHBOARD.md)
  - Architecture docs (docs/SALES_DASHBOARD_ARCHITECTURE.md)
  - Verification script (scripts/verify-sales-setup.sql)

## 🎯 Next Steps to Go Live

### 1. Verify Database Functions (5 minutes)

Run this query to confirm all functions exist:

\`\`\`sql
SELECT proname as function_name
FROM pg_proc
WHERE proname IN (
    'get_sales_assigned_leads',
    'get_sales_dashboard_stats',
    'get_sales_client_profile',
    'verify_sales_access_to_lead'
)
ORDER BY proname;
\`\`\`

**Expected Result:** 4 rows (all functions listed)

### 2. Create/Verify Sales Users (2 minutes)

Check if you have sales users:

\`\`\`sql
SELECT id, email, first_name, last_name, role
FROM profiles
WHERE role = 'sales';
\`\`\`

If needed, promote an existing user to sales:

\`\`\`sql
UPDATE profiles
SET role = 'sales'
WHERE email = 'your-sales-user@example.com';
\`\`\`

Or create a new sales user through your normal signup flow, then update their role.

### 3. Assign Leads to Sales Users (3 minutes)

Assign some test leads:

\`\`\`sql
-- Replace 'SALES-USER-UUID' with actual sales user ID
UPDATE profiles
SET asesor_asignado_id = 'SALES-USER-UUID'
WHERE role = 'user'
  AND id IN (
    SELECT id FROM profiles WHERE role = 'user' LIMIT 5
  );
\`\`\`

### 4. Authorize Access for Test Leads (1 minute)

Enable access for testing:

\`\`\`sql
-- Authorize access for the assigned leads
UPDATE profiles
SET autorizar_asesor_acceso = true
WHERE asesor_asignado_id IS NOT NULL
  AND role = 'user';
\`\`\`

**Note:** In production, this should be controlled by the client/user themselves, not set globally.

### 5. Test the Dashboard (10 minutes)

#### As Sales User:

1. **Login** as a user with `role = 'sales'`

2. **Navigate** to `/escritorio/ventas/leads`
   - ✅ Should see only your assigned leads
   - ✅ Should see statistics in the cards
   - ✅ Should see "Acceso Autorizado" column

3. **Test Search**
   - Type a client name/email in search box
   - ✅ Results should filter instantly

4. **Test Filters**
   - Change "Contactado" filter
   - Change "Estado Solicitud" filter
   - ✅ Results should update

5. **Click "Ver Perfil"** on an authorized lead
   - ✅ Should navigate to `/escritorio/ventas/cliente/:id`
   - ✅ Should see full client information

6. **Test Tag Management**
   - Click "Editar" on Tags section
   - Select/deselect some tags
   - Click "Guardar Cambios"
   - ✅ Tags should save successfully

7. **Test Reminders**
   - Click the + icon
   - Add a test reminder
   - ✅ Should appear in the list
   - Toggle the checkbox to complete it
   - ✅ Should show as completed (green background)

8. **Try Accessing Unauthorized Lead**
   - Manually navigate to `/escritorio/ventas/cliente/[unauthorized-lead-id]`
   - ✅ Should see "Acceso No Autorizado" message
   - ✅ Should have link back to dashboard

9. **Try Accessing Admin Routes**
   - Navigate to `/escritorio/admin/leads`
   - ✅ Should redirect to `/escritorio`

#### As Admin User:

1. **Login** as a user with `role = 'admin'`

2. **Verify Admin Access**
   - Navigate to `/escritorio/admin/leads`
   - ✅ Should work (see all leads)

3. **Verify Sales Access**
   - Navigate to `/escritorio/ventas/leads`
   - ✅ Should work (admin can access sales routes for oversight)

### 6. Create Sample Tags (Optional, 2 minutes)

If you don't have tags yet:

\`\`\`sql
INSERT INTO lead_tags (tag_name, color) VALUES
    ('Alta Prioridad', '#EF4444'),
    ('Necesita Seguimiento', '#F59E0B'),
    ('Interesado', '#10B981'),
    ('En Proceso', '#3B82F6'),
    ('Pre-Aprobado', '#8B5CF6'),
    ('Documentación Pendiente', '#F59E0B'),
    ('Listo para Cierre', '#10B981'),
    ('Cerrado', '#6B7280')
ON CONFLICT DO NOTHING;
\`\`\`

## 🔍 Troubleshooting Guide

### Issue: "Could not fetch leads"

**Possible Causes:**
1. RPC functions not created (migration didn't run)
2. User ID is null/undefined
3. Database connection issue

**Solutions:**
\`\`\`sql
-- Check if functions exist
SELECT proname FROM pg_proc WHERE proname LIKE '%sales%';

-- Test function directly
SELECT * FROM get_sales_assigned_leads('your-sales-user-uuid');
\`\`\`

### Issue: Empty Dashboard (No Leads Showing)

**Possible Causes:**
1. No leads assigned to this sales user
2. Wrong user ID being passed

**Solutions:**
\`\`\`sql
-- Check assignments
SELECT
    COUNT(*) as total_assigned,
    asesor_asignado_id
FROM profiles
WHERE role = 'user'
  AND asesor_asignado_id IS NOT NULL
GROUP BY asesor_asignado_id;

-- Verify specific user's assignments
SELECT id, email, first_name, last_name
FROM profiles
WHERE asesor_asignado_id = 'your-sales-user-uuid';
\`\`\`

### Issue: "Acceso Restringido" for All Leads

**Cause:** `autorizar_asesor_acceso` is false/null

**Solution:**
\`\`\`sql
-- Check authorization status
SELECT
    id,
    email,
    asesor_asignado_id,
    autorizar_asesor_acceso
FROM profiles
WHERE asesor_asignado_id = 'your-sales-user-uuid';

-- Enable access (for testing)
UPDATE profiles
SET autorizar_asesor_acceso = true
WHERE asesor_asignado_id = 'your-sales-user-uuid';
\`\`\`

### Issue: Tags Not Saving

**Possible Causes:**
1. `lead_tags` table empty
2. `lead_tag_associations` table has constraints failing

**Solutions:**
\`\`\`sql
-- Check available tags
SELECT * FROM lead_tags;

-- Check existing associations
SELECT * FROM lead_tag_associations WHERE lead_id = 'client-uuid';
\`\`\`

### Issue: Redirected to /escritorio When Accessing Sales Routes

**Cause:** User role is not 'sales' or 'admin'

**Solution:**
\`\`\`sql
-- Check user's role
SELECT id, email, role FROM profiles WHERE id = 'user-uuid';

-- Update role if needed
UPDATE profiles SET role = 'sales' WHERE id = 'user-uuid';
\`\`\`

## 📊 Performance Optimization (Optional)

For better performance with large datasets, add these indexes:

\`\`\`sql
-- Optimize sales lead queries
CREATE INDEX IF NOT EXISTS idx_profiles_asesor_asignado
ON profiles(asesor_asignado_id)
WHERE role = 'user';

CREATE INDEX IF NOT EXISTS idx_profiles_asesor_authorized
ON profiles(asesor_asignado_id, autorizar_asesor_acceso)
WHERE role = 'user' AND autorizar_asesor_acceso = true;

-- Optimize application lookups
CREATE INDEX IF NOT EXISTS idx_applications_user_created
ON applications(user_id, created_at DESC);

-- Optimize reminder queries
CREATE INDEX IF NOT EXISTS idx_lead_reminders_lead_date
ON lead_reminders(lead_id, reminder_date DESC);

-- Optimize tag lookups
CREATE INDEX IF NOT EXISTS idx_lead_tag_associations_lead
ON lead_tag_associations(lead_id);
\`\`\`

## 🎉 Production Readiness

### Before Deploying to Production:

- [ ] Test with real sales users
- [ ] Verify all error messages are user-friendly and in Spanish
- [ ] Ensure `autorizar_asesor_acceso` defaults to `false` for new users
- [ ] Set up monitoring/logging for RPC function calls
- [ ] Review and adjust RLS policies if needed
- [ ] Add analytics tracking for sales dashboard usage
- [ ] Train sales team on how to use the dashboard
- [ ] Create user documentation for end-users (how to authorize access)

### Security Review:

- [ ] Verify RPC functions only return authorized data
- [ ] Test that sales users cannot access other sales users' leads
- [ ] Test that sales users cannot access admin routes
- [ ] Verify that unauthorized profile access shows proper error
- [ ] Test with different user roles (user, sales, admin)

### User Experience:

- [ ] Test on mobile devices
- [ ] Verify all Spanish translations are correct
- [ ] Test with slow network (loading states)
- [ ] Test with large datasets (100+ leads)
- [ ] Verify search performance
- [ ] Test filter combinations

## 📈 Success Metrics to Track

Once live, monitor these metrics:

1. **Adoption**
   - % of sales users logging in daily
   - Average session duration
   - Most used features

2. **Lead Management**
   - Average time to first contact
   - % of leads with authorized access
   - Tags usage patterns

3. **Conversion**
   - Leads with active applications
   - Application status progression
   - Time from assignment to closed deal

4. **Technical**
   - Page load times
   - API response times
   - Error rates

## 🆘 Support Resources

- **Setup Guide:** \`SALES_DASHBOARD_SETUP.md\`
- **Full Documentation:** \`docs/SALES_DASHBOARD.md\`
- **Architecture:** \`docs/SALES_DASHBOARD_ARCHITECTURE.md\`
- **Database Verification:** \`scripts/verify-sales-setup.sql\`

## ✨ You're All Set!

The Sales Dashboard is fully functional and ready for testing. Follow the test steps above to verify everything works correctly, then roll out to your sales team!

**Quick Start Command for Sales Users:**
→ Navigate to: \`/escritorio/ventas/leads\`

**Questions?** Check the documentation or run the verification script.
