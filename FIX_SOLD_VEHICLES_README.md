# Fix Sold Vehicles Showing in Inventory

## Problem
Some vehicles that have been sold (OrdenStatus = "Historico" or vendido = true in Airtable) are still showing as available on the website because their `ordenstatus` field in `inventario_cache` is still set to "Comprado".

## Root Cause
The airtable-sync function was not properly syncing the OrdenStatus and vendido fields when vehicles were marked as sold.

## Solution

### 1. Updated airtable-sync Function
The function now:
- Properly checks OrdenStatus from Airtable and updates it in Supabase
- Sets `vendido = true` if OrdenStatus is "Historico" or "Vendido"
- Always syncs the current OrdenStatus from Airtable

### 2. Fix Existing Inconsistent Records

**Option 1: Using Supabase Dashboard (Recommended)**
1. Go to your Supabase Dashboard SQL Editor: https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu/sql
2. Copy and paste the content of `fix_sold_vehicles_sync.sql`
3. Run the queries to:
   - See which records need fixing
   - Update all inconsistent records
   - View a summary of the fixes

**Option 2: Using Airtable to Trigger Webhooks**
If you have many records to fix, you can use the Airtable API to re-trigger the sync for all Historico vehicles:

```bash
# This will re-sync all records from Airtable
# Make sure you have the airtable-sync function deployed first
```

### 3. Deploy Updated Function

```bash
cd /Users/marianomorales/Downloads/ultima\ copy
supabase functions deploy airtable-sync
```

### 4. Verify the Fix

After running the SQL script and deploying the function:

1. Check that no vehicles with `ordenstatus = 'Historico'` have `vendido = false`
2. Check that no vehicles with `vendido = true` have `ordenstatus = 'Comprado'`
3. Verify on the frontend that sold vehicles are no longer showing

```sql
-- Run this query to verify all records are consistent
SELECT ordenstatus, vendido, COUNT(*)
FROM inventario_cache
GROUP BY ordenstatus, vendido;

-- Should show:
-- Comprado, false, <count>
-- Historico, true, <count>
-- Separado, false, <count>
```

## Prevention
The updated airtable-sync function will now automatically keep OrdenStatus and vendido in sync whenever:
- A new vehicle is added to Airtable
- An existing vehicle's OrdenStatus changes
- A vehicle is marked as sold

## Testing
1. Mark a vehicle as "Historico" in Airtable
2. Wait for the webhook to fire (or trigger it manually)
3. Check `inventario_cache` - the vehicle should have:
   - `ordenstatus = 'Historico'`
   - `vendido = true`
4. Verify the vehicle no longer shows on the website (filtered out by the `ordenstatus = 'Comprado'` query)
