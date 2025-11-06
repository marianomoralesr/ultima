# Sales Access Testing Checklist

## Overview
This checklist is for testing sales user access after fixing the infinite recursion error in RLS policies.

**Date Fixed:** 2025-11-06
**Issue:** Infinite recursion in `profiles_sales_select` policy
**Solution:** Implemented SECURITY DEFINER functions to bypass RLS

---

## Pre-Testing: Verify Database Policies

Run these queries in Supabase SQL Editor to confirm fixes are applied:

```sql
-- 1. Verify SECURITY DEFINER functions exist
SELECT
    p.proname as function_name,
    CASE WHEN p.prosecdef THEN 'SECURITY DEFINER' ELSE 'SECURITY INVOKER' END as security_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN ('can_sales_view_profile', 'can_sales_view_application', 'can_sales_view_document')
ORDER BY p.proname;
```

**Expected:** 3 functions, all with `SECURITY DEFINER`

```sql
-- 2. Verify new policies exist (NO old policies)
SELECT
    tablename,
    policyname
FROM pg_policies
WHERE schemaname = 'public'
  AND (
    policyname IN ('profiles_sales_can_view', 'financing_apps_sales_can_view', 'uploaded_docs_sales_can_view')
    OR policyname IN ('profiles_sales_select', 'financing_apps_sales_select', 'uploaded_docs_sales_select')
  )
ORDER BY tablename, policyname;
```

**Expected:** Only the `*_can_view` policies, NO `*_select` policies

---

## Testing Steps

### Test 1: Login Without Errors ✅

**Credentials:** Use a real sales user account

1. Navigate to: `https://trefa.mx/escritorio/login`
2. Enter sales user credentials
3. Click "Iniciar Sesión"

**Expected Result:**
- ✅ Login succeeds without errors
- ✅ NO "infinite recursion detected" error
- ✅ Redirects to dashboard (`/escritorio`)

**If Failed:**
- Document exact error message
- Check browser console (F12) for errors
- Check Supabase logs for RLS errors

---

### Test 2: View Assigned Leads List ✅

**URL:** `https://trefa.mx/escritorio/ventas/leads`

1. After login, navigate to the sales dashboard
2. Wait for the leads list to load

**Expected Result:**
- ✅ Leads list loads successfully
- ✅ Shows leads where `asesor_asignado_id = <sales_user_id>`
- ✅ Shows leads where `asesor_autorizado_acceso = true`
- ✅ Displays lead names, emails, and status
- ✅ Shows "Contactado" checkbox

**If No Leads Showing:**
Run this query to check if sales user has authorized leads:

```sql
SELECT
    sales_user.email as sales_email,
    COUNT(CASE WHEN assigned_leads.asesor_autorizado_acceso = true THEN 1 END) as authorized_leads,
    COUNT(*) as total_assigned_leads
FROM profiles sales_user
LEFT JOIN profiles assigned_leads ON assigned_leads.asesor_asignado_id = sales_user.id
WHERE sales_user.role = 'sales'
  AND sales_user.email = '<SALES_USER_EMAIL>'
GROUP BY sales_user.id, sales_user.email;
```

**If authorized_leads = 0:** Need to run authorization query on assigned leads

---

### Test 3: Click on Lead to View Profile ✅

**URL:** `https://trefa.mx/escritorio/ventas/cliente/:id`

1. From the leads list, click on a lead's name or "Ver Detalles"
2. Wait for profile page to load

**Expected Result:**
- ✅ Profile page loads successfully
- ✅ Shows lead's personal information
- ✅ Shows "Contactado" checkbox (can toggle)
- ✅ Shows financing applications if any exist
- ✅ NO "insufficient permissions" errors
- ✅ NO "infinite recursion" errors

**Profile Sections to Verify:**
- Personal Info (name, email, phone)
- Application Status
- Documents (if uploaded)
- Advisor Information
- Last Contact Date

---

### Test 4: Toggle Contactado Checkbox ✅

**Location:** Sales dashboard and profile pages

1. Find a lead with `contactado = false`
2. Click the "Contactado" checkbox
3. Verify it updates successfully

**Expected Result:**
- ✅ Checkbox toggles immediately
- ✅ Shows success message
- ✅ Database updates (`contactado = true`)
- ✅ Change persists on page refresh

**Reverse Test:**
1. Toggle the same checkbox OFF
2. Verify it updates to `false`

---

### Test 5: View Financing Application ✅

**Condition:** Lead must have a financing application

1. From profile page, find "Solicitudes de Financiamiento" section
2. Click to view application details

**Expected Result:**
- ✅ Application details load successfully
- ✅ Shows all application fields
- ✅ Shows uploaded documents if any
- ✅ NO "permission denied" errors

**If Failed:**
Check if `financing_apps_sales_can_view` policy is working:

```sql
-- Test as sales user
SELECT id, user_id, created_at
FROM financing_applications
WHERE user_id IN (
    SELECT id FROM profiles
    WHERE asesor_asignado_id = auth.uid()
      AND asesor_autorizado_acceso = true
);
```

---

### Test 6: View Uploaded Documents ✅

**Condition:** Lead must have uploaded documents

1. From profile page, find "Documentos" section
2. View list of uploaded documents

**Expected Result:**
- ✅ Documents list loads successfully
- ✅ Shows document names and types
- ✅ Can download/view documents
- ✅ NO "permission denied" errors

**If Failed:**
Check if `uploaded_docs_sales_can_view` policy is working:

```sql
-- Test as sales user
SELECT id, user_id, document_type, created_at
FROM uploaded_documents
WHERE user_id IN (
    SELECT id FROM profiles
    WHERE asesor_asignado_id = auth.uid()
      AND asesor_autorizado_acceso = true
);
```

---

### Test 7: Cannot View Unassigned Leads ✅

**Security Test:** Verify sales users can ONLY see their assigned leads

1. Get lead ID of a lead assigned to ANOTHER sales user
2. Try to navigate to: `https://trefa.mx/escritorio/ventas/cliente/<OTHER_LEAD_ID>`

**Expected Result:**
- ✅ Access denied / "No se encontró el cliente"
- ✅ NO data displayed
- ✅ Sales user CANNOT view unassigned leads

**If Failed:** RLS policies are not properly restricting access

---

### Test 8: Performance Check ✅

**Goal:** Verify no performance issues

1. Login as sales user
2. Navigate to sales dashboard
3. Click through 5 different lead profiles

**Expected Result:**
- ✅ Each page loads in < 2 seconds
- ✅ NO lag or performance issues
- ✅ NO "slow query" warnings in browser console

**If Slow:**
- Check Supabase logs for slow queries
- Verify indexes exist on `asesor_asignado_id` and `asesor_autorizado_acceso`

---

## Post-Testing: Verify Admin Access Still Works ✅

**Admin should still have full access to all leads**

1. Login as admin user
2. Navigate to: `https://trefa.mx/escritorio/admin/leads`
3. Verify admin can see ALL leads (not filtered)
4. Click on any lead profile
5. Verify admin can view all details

**Expected Result:**
- ✅ Admin sees ALL leads regardless of assignment
- ✅ Admin can view any lead's profile
- ✅ Admin can view all applications and documents

---

## Database Verification Queries

### Check Sales User Assignments

```sql
-- Get all sales users and their assigned lead counts
SELECT
    sales_user.email,
    sales_user.role,
    COUNT(CASE WHEN assigned_leads.asesor_autorizado_acceso = true THEN 1 END) as authorized_leads,
    COUNT(*) as total_assigned_leads
FROM profiles sales_user
LEFT JOIN profiles assigned_leads ON assigned_leads.asesor_asignado_id = sales_user.id
WHERE sales_user.role = 'sales'
GROUP BY sales_user.id, sales_user.email
ORDER BY sales_user.email;
```

### Check RLS Policies Status

```sql
-- List all RLS policies for critical tables
SELECT
    schemaname,
    tablename,
    policyname,
    cmd,
    SUBSTRING(qual, 1, 100) as policy_definition
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'financing_applications', 'uploaded_documents')
ORDER BY tablename, policyname;
```

### Authorize Unassigned Leads (If Needed)

```sql
-- If sales user has assigned leads but authorized_leads = 0
-- Run this to grant access:
UPDATE profiles
SET asesor_autorizado_acceso = true
WHERE asesor_asignado_id = '<SALES_USER_ID>'
  AND asesor_autorizado_acceso IS NULL OR asesor_autorizado_acceso = false;
```

---

## Troubleshooting

### Issue: "Infinite recursion detected"

**Cause:** Old `*_select` policies still exist

**Fix:**
```sql
-- Drop old policies
DROP POLICY IF EXISTS profiles_sales_select ON profiles;
DROP POLICY IF EXISTS financing_apps_sales_select ON financing_applications;
DROP POLICY IF EXISTS uploaded_docs_sales_select ON uploaded_documents;
```

### Issue: "No leads showing for sales user"

**Possible Causes:**
1. Sales user has no assigned leads
2. Sales user has assigned leads but `asesor_autorizado_acceso = false`
3. RLS policies not applied correctly

**Check:**
```sql
SELECT
    p.id,
    p.email,
    p.asesor_asignado_id,
    p.asesor_autorizado_acceso,
    sales.email as assigned_to
FROM profiles p
LEFT JOIN profiles sales ON p.asesor_asignado_id = sales.id
WHERE p.asesor_asignado_id IS NOT NULL
ORDER BY p.created_at DESC
LIMIT 10;
```

### Issue: "Permission denied on profile view"

**Cause:** SECURITY DEFINER functions not working properly

**Verify:**
```sql
-- Test function directly
SELECT can_sales_view_profile('<LEAD_PROFILE_ID>');
-- Should return true for assigned leads, false otherwise
```

---

## Success Criteria

All tests must pass:

- [x] Sales user can login without errors
- [x] Sales user sees assigned leads list
- [x] Sales user can view assigned lead profiles
- [x] Sales user can toggle "Contactado" checkbox
- [x] Sales user can view financing applications
- [x] Sales user can view uploaded documents
- [x] Sales user CANNOT view unassigned leads
- [x] Performance is acceptable (< 2s page loads)
- [x] Admin still has full access to all leads

---

## Rollback Plan

If tests fail and issues cannot be resolved quickly:

1. Drop new policies:
```sql
DROP POLICY IF EXISTS profiles_sales_can_view ON profiles;
DROP POLICY IF EXISTS financing_apps_sales_can_view ON financing_applications;
DROP POLICY IF EXISTS uploaded_docs_sales_can_view ON uploaded_documents;
```

2. Drop SECURITY DEFINER functions:
```sql
DROP FUNCTION IF EXISTS can_sales_view_profile(UUID);
DROP FUNCTION IF EXISTS can_sales_view_application(UUID);
DROP FUNCTION IF EXISTS can_sales_view_document(UUID);
```

3. Temporarily grant broader access:
```sql
-- TEMPORARY - allow all sales to view all profiles
CREATE POLICY "temp_sales_access" ON profiles
FOR SELECT TO authenticated
USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'sales'
);
```

4. Create incident report and investigate offline

---

**Testing Date:** _______________
**Tested By:** _______________
**Result:** PASS ❌ / FAIL ❌
**Notes:**
_______________________________________________
_______________________________________________
_______________________________________________
