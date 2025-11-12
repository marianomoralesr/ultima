# Sales Role Permissions - Permanent Fix

## Problem
Sales users were experiencing permission issues when accessing CRM and leads data after certain migrations were run. This was a recurring issue that required manual fixes after each migration.

## Root Cause
The RLS (Row Level Security) policies for sales users were inconsistent across tables:
- Some policies allowed sales to see ALL user profiles
- Other policies only allowed sales to see ASSIGNED leads
- This mismatch caused permission errors in the CRM interface

## Permanent Solution
Migration `20251112000002_permanent_sales_access_fix.sql` implements the correct, permanent configuration:

### Sales Role Permissions
Sales users can now:
- ✓ View **ALL** user profiles (leads) in CRM
- ✓ Update `contactado` field and notes on leads
- ✓ View **ALL** financing applications from user leads
- ✓ Update applications from user leads
- ✓ View **ALL** documents from user leads
- ✓ Update documents from user leads
- ✓ Full access to lead tags and associations
- ✓ Full access to lead reminders

### Key Principles
1. **Sales sees ALL leads**: Not just assigned ones, but ALL user profiles with role='user'
2. **Consistency**: All tables use the same access pattern
3. **No Recursion**: Uses `public.get_my_role()` SECURITY DEFINER function
4. **Role Filtering**: Sales only sees user role='user', not other sales/admin users

### Technical Implementation
All policies use this pattern:

```sql
CREATE POLICY "table_select" ON public.table_name
FOR SELECT TO authenticated
USING (
  -- Users see own data
  user_id = auth.uid()
  OR
  -- Admin sees all
  public.get_my_role() = 'admin'
  OR
  -- Sales sees all data from USER leads (not sales/admin)
  (
    public.get_my_role() = 'sales'
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = table_name.user_id
        AND p.role = 'user'
    )
  )
);
```

### Tables Covered
1. `profiles` - User profiles (leads)
2. `financing_applications` - Loan applications
3. `uploaded_documents` - Document uploads
4. `lead_tag_associations` - Lead tagging
5. `lead_reminders` - Follow-up reminders

## Migration Protection
All policies are marked with `[PERMANENT]` in their comments to indicate this is the correct, stable configuration that should NOT be overwritten by future migrations.

## Future Migrations
When creating new migrations that touch these tables:
1. Read this document first
2. Do NOT change the sales access pattern
3. Use the same pattern for any new CRM-related tables
4. Always test with a sales role user before deploying

## Verification
After applying this migration, verify sales access with:
1. Log in as a sales user
2. Navigate to `/escritorio/ventas/crm`
3. Verify all leads are visible
4. Verify you can update `contactado` field
5. Verify you can view financing applications
6. Verify no infinite recursion errors occur

## Related Functions
- `public.get_my_role()` - Returns current user's role using SECURITY DEFINER to bypass RLS
- Migration: `20251111000006_fix_recursion_drop_function_first.sql`

## Contact
If sales permissions break again, check:
1. Was a new migration applied that drops/recreates these policies?
2. Is `get_my_role()` function still working correctly?
3. Do the policies match the patterns in this document?

Apply `20251112000002_permanent_sales_access_fix.sql` again to restore correct permissions.
