# Sales Dashboard - Setup Guide

## Quick Start

The Sales Dashboard has been successfully implemented! Here's what you need to do to get it running:

## 1. Database Setup (REQUIRED)

Run the SQL migration to create the required RPC functions:

```bash
# Connect to your Supabase project
supabase db push

# Or manually execute the migration file:
# supabase/migrations/sales_dashboard_functions.sql
```

The migration creates these functions:
- `get_sales_assigned_leads(UUID)` - Fetch assigned leads
- `get_sales_dashboard_stats(UUID)` - Get dashboard statistics
- `get_sales_client_profile(UUID, UUID)` - Get client profile with authorization check
- `verify_sales_access_to_lead(UUID, UUID)` - Verify sales access to a lead

## 2. Access the Dashboard

### For Sales Users:
Navigate to: `/escritorio/ventas/leads`

### For Admin Users (can access both):
- Sales Dashboard: `/escritorio/ventas/leads`
- Admin Dashboard: `/escritorio/admin/leads`

## 3. How It Works

### Lead Assignment
Sales users can only see leads where `asesor_asignado_id` matches their user ID.

```sql
-- Assign a lead to a sales user
UPDATE profiles
SET asesor_asignado_id = 'sales-user-uuid-here'
WHERE id = 'client-uuid-here';
```

### Access Authorization
Sales users can only access full client details if `autorizar_asesor_acceso = true`.

```sql
-- Grant access to sales user
UPDATE profiles
SET autorizar_asesor_acceso = true
WHERE id = 'client-uuid-here';
```

## 4. Features Available

### Sales Dashboard (`/escritorio/ventas/leads`)
✅ View all assigned leads
✅ Search by name, email, or phone
✅ Filter by contact status
✅ Filter by application status
✅ See statistics (total leads, active apps, not contacted, needing follow-up)
✅ Visual indicators for authorized access

### Client Profile (`/escritorio/ventas/cliente/:id`)
✅ View complete client information (if authorized)
✅ Manage tags
✅ Create/edit/delete reminders
✅ View application history
✅ Update application status
✅ View uploaded documents
✅ Sync with Kommo CRM

## 5. Security Model

### Multi-layer Security:
1. **Frontend**: `SalesRoute` component checks user role
2. **API**: `SalesService` enforces business logic
3. **Database**: RPC functions with `SECURITY DEFINER` verify permissions

### Access Requirements:
For a sales user to access a client's full profile:
- `asesor_asignado_id` MUST equal the sales user's ID
- `autorizar_asesor_acceso` MUST be `true`

Both conditions are required!

## 6. Files Created

### Frontend Components
- `src/pages/SalesLeadsDashboardPage.tsx` - Main dashboard
- `src/pages/SalesClientProfilePage.tsx` - Client profile page
- `src/components/SalesRoute.tsx` - Route guard
- `src/services/SalesService.ts` - API service layer

### Backend
- `supabase/migrations/sales_dashboard_functions.sql` - Database functions

### Documentation
- `docs/SALES_DASHBOARD.md` - Complete feature documentation

### Routes Added to App.tsx
```typescript
// Sales routes - accessible by sales and admin roles
<Route element={<SalesRoute />}>
  <Route path="ventas/leads" element={<SalesLeadsDashboardPage />} />
  <Route path="ventas/cliente/:id" element={<SalesClientProfilePage />} />
</Route>
```

## 7. Testing Checklist

### As Sales User:
- [ ] Can access `/escritorio/ventas/leads`
- [ ] Only see my assigned leads
- [ ] Can search and filter leads
- [ ] Can see "Acceso Autorizado" indicator
- [ ] Can access authorized client profiles
- [ ] Cannot access unauthorized client profiles
- [ ] Cannot access other sales users' leads
- [ ] Cannot access `/escritorio/admin/*` routes

### As Admin User:
- [ ] Can access both `/escritorio/ventas/leads` and `/escritorio/admin/leads`
- [ ] Can access all client profiles
- [ ] Can oversee sales operations

## 8. Common Issues & Solutions

### Issue: "No tienes autorización para modificar este lead"
**Solution**: Verify `autorizar_asesor_acceso = true` for the client

### Issue: Sales user sees empty dashboard
**Solution**: Verify leads are assigned with correct `asesor_asignado_id`

### Issue: "Could not fetch leads" error
**Solution**: Run the SQL migration to create RPC functions

### Issue: Sales user can't access admin routes
**Solution**: This is intentional! Sales users should use `/escritorio/ventas/*` routes

## 9. Next Steps

1. **Run the database migration** (most important!)
2. **Assign leads to sales users** using the admin dashboard or SQL
3. **Enable access authorization** for clients who consent
4. **Test the functionality** with a sales role user
5. **Review the full documentation** in `docs/SALES_DASHBOARD.md`

## 10. Support

For detailed documentation, see: `docs/SALES_DASHBOARD.md`

For questions about:
- **Routes**: Check `src/App.tsx` lines 45-46, 136-139
- **Authorization**: Check `src/components/SalesRoute.tsx`
- **API calls**: Check `src/services/SalesService.ts`
- **Database functions**: Check `supabase/migrations/sales_dashboard_functions.sql`

---

**Build Status**: ✅ Successful (verified)
**TypeScript**: ✅ No errors
**Routes**: ✅ Configured
**Components**: ✅ Created
**Database**: ⚠️ Migration required (see step 1)
