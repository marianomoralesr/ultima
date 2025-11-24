# Filter Sidebar Bug Report - URGENT FIX NEEDED

**Date:** 2025-11-23
**Status:** CRITICAL - Filters not showing on /autos page
**Root Cause Identified:** Field name mismatch between database function and frontend component

---

## Executive Summary

The filter sidebar on the `/autos` page (VehicleListPage) is not showing any filter options. The sidebar appears but is empty. This is caused by a **field name mismatch** between the Supabase `get_filter_options()` database function and the `FilterSidebar.tsx` React component.

---

## Root Cause Analysis

### The Problem

The `get_filter_options()` database function returns filter data with **English field names**:
- `years`
- `warranties`
- `transmissions`
- `classifications`
- `promotions`
- `sucursales`

But the `FilterSidebar.tsx` component expects **Spanish field names**:
- `autoano` (not `years`)
- `garantia` (not `warranties`)
- `transmision` (not `transmissions`)
- `carroceria` (not `classifications`)
- `promociones` (not `promotions`)
- `ubicacion` (not `sucursales`)

### Where the Mismatch Occurs

**File:** `/src/components/FilterSidebar.tsx`
**Lines:** 125-134

```typescript
const counts = useMemo(() => ({
    marcas: Object.fromEntries((filterOptions?.marcas || []).map(s => [s.name, s.count])),
    autoano: Object.fromEntries((filterOptions?.autoano || []).map(y => [y.name, y.count])),  // ❌ expects 'autoano'
    garantia: Object.fromEntries((filterOptions?.garantia || []).map(c => [c.name, c.count])),  // ❌ expects 'garantia'
    transmision: Object.fromEntries((filterOptions?.transmision || []).map(t => [t.name, t.count])),  // ❌ expects 'transmision'
    combustible: Object.fromEntries((filterOptions?.combustible || []).map(f => [f.name, f.count])),
    carroceria: Object.fromEntries((filterOptions?.carroceria || []).map(w => [w.name, w.count])),  // ❌ expects 'carroceria'
    promociones: Object.fromEntries((filterOptions?.promociones || []).map(p => [p.name, p.count])),  // ❌ expects 'promociones'
    ubicacion: Object.fromEntries((filterOptions?.ubicacion || []).map(p => [p.name, p.count])),  // ❌ expects 'ubicacion'
}), [filterOptions]);
```

**Database Function:** `supabase/migrations/20251020121153_remote_schema.sql`
**Lines:** 591-649

The function returns a JSON object with these keys:
- `marcas` ✅
- `years` ❌ (should be `autoano`)
- `classifications` ❌ (should be `carroceria`)
- `transmissions` ❌ (should be `transmision`)
- `combustibles` ✅
- `sucursales` ❌ (should be `ubicacion`)
- `warranties` ❌ (should be `garantia`)
- `promotions` ❌ (should be `promociones`)

### When This Was Introduced

This bug was introduced in commit **5bdf190** ("feat: Redesign vehicle listings page with enhanced UX and performance") when the FilterSidebar component was refactored but the database function was not updated accordingly.

---

## The Solution

We need to update the `get_filter_options()` database function to return field names that match the component's expectations.

### Migration File Created

**File:** `/supabase/migrations/20251123000001_fix_get_filter_options_field_names.sql`

This migration updates the function to return the correct field names.

---

## How to Apply the Fix

### Option 1: Manual SQL Execution (RECOMMENDED)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy and paste the following SQL:

```sql
-- Migration: Fix get_filter_options to return field names matching FilterSidebar expectations
CREATE OR REPLACE FUNCTION "public"."get_filter_options"() RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    result jsonb;
BEGIN
    WITH vehicle_base AS (
        SELECT marca, autoano, clasificacionid, transmision, combustible, sucursal, autogarantia, promociones, precio, enganche_minimo
        FROM inventario_cache
        WHERE ordenstatus = 'Comprado'
    ),
    marcas_agg AS (
        SELECT marca AS name, COUNT(*) AS count FROM vehicle_base WHERE marca IS NOT NULL AND marca != '' GROUP BY marca
    ),
    years_agg AS (
        SELECT autoano AS name, COUNT(*) AS count FROM vehicle_base WHERE autoano IS NOT NULL GROUP BY autoano
    ),
    classifications_agg AS (
        SELECT name, COUNT(*) AS count FROM (SELECT unnest(string_to_array(clasificacionid, ',')) AS name FROM vehicle_base) s WHERE name IS NOT NULL AND name != '' GROUP BY name
    ),
    transmissions_agg AS (
        SELECT transmision AS name, COUNT(*) AS count FROM vehicle_base WHERE transmision IS NOT NULL AND transmision != '' GROUP BY transmision
    ),
    combustibles_agg AS (
        SELECT combustible AS name, COUNT(*) AS count FROM vehicle_base WHERE combustible IS NOT NULL AND combustible != '' GROUP BY combustible
    ),
    sucursales_agg AS (
        SELECT name, COUNT(*) AS count FROM (SELECT unnest(string_to_array(sucursal, ',')) AS name FROM vehicle_base) s WHERE name IS NOT NULL AND name != '' GROUP BY name
    ),
    warranties_agg AS (
        SELECT autogarantia AS name, COUNT(*) AS count FROM vehicle_base WHERE autogarantia IS NOT NULL AND autogarantia != '' GROUP BY autogarantia
    ),
    promotions_agg AS (
        SELECT value AS name, COUNT(*) AS count
        FROM vehicle_base, jsonb_array_elements_text(promociones)
        WHERE value IS NOT NULL AND value != ''
        GROUP BY name
    ),
    price_range AS (
        SELECT min(precio) AS minprice, max(precio) AS maxprice, min(enganche_minimo) AS minenganche, max(enganche_minimo) AS maxenganche FROM vehicle_base
    )
    SELECT jsonb_build_object(
        'marcas', (SELECT jsonb_agg(t) FROM marcas_agg t),
        'autoano', (SELECT jsonb_agg(t) FROM years_agg t ORDER BY name DESC),
        'carroceria', (SELECT jsonb_agg(t) FROM classifications_agg t),
        'transmision', (SELECT jsonb_agg(t) FROM transmissions_agg t),
        'combustible', (SELECT jsonb_agg(t) FROM combustibles_agg t),
        'ubicacion', (SELECT jsonb_agg(t) FROM sucursales_agg t),
        'garantia', (SELECT jsonb_agg(t) FROM warranties_agg t),
        'promociones', (SELECT jsonb_agg(t) FROM promotions_agg t),
        'minPrice', (SELECT minprice FROM price_range),
        'maxPrice', (SELECT maxprice FROM price_range),
        'enganchemin', (SELECT minenganche FROM price_range),
        'maxEnganche', (SELECT maxenganche FROM price_range)
    ) INTO result;

    RETURN result;
END;
$$;
```

5. Click **Run**
6. Verify success message

### Option 2: Using psql (Alternative)

If you have the database connection string with password, you can run:

```bash
psql "postgresql://postgres:[YOUR-PASSWORD]@db.jjepfehmuybpctdzipnu.supabase.co:5432/postgres" \
  -f supabase/migrations/20251123000001_fix_get_filter_options_field_names.sql
```

---

## Verification Steps

After applying the fix:

1. Open browser dev tools and go to the Network tab
2. Navigate to http://localhost:5173/autos
3. Look for the `get_filter_options` RPC call
4. Verify the response contains these fields:
   - `marcas`
   - `autoano` (not `years`)
   - `carroceria` (not `classifications`)
   - `transmision` (not `transmissions`)
   - `combustible`
   - `ubicacion` (not `sucursales`)
   - `garantia` (not `warranties`)
   - `promociones` (not `promotions`)

5. Confirm the filter sidebar now shows all filter sections with options

---

## Files Involved

### Modified Files
- `/supabase/migrations/20251123000001_fix_get_filter_options_field_names.sql` (NEW)

### Affected Files (No Changes Needed)
- `/src/components/FilterSidebar.tsx`
- `/src/pages/VehicleListPage.tsx`
- `/src/services/VehicleService.ts`

---

## Related to Recent Changes

This bug is related to the performance optimizations that were recently implemented:
- React Query configuration changes
- API caching utilities
- Service Worker
- Performance monitoring

However, the root cause is **not** in these optimizations. The bug existed before but might not have been noticed because:
1. The page was rendering empty filter arrays `[]` instead of `undefined`
2. The UI appeared "empty" rather than throwing an error
3. The component gracefully handled missing data

---

## Impact

- **User Impact:** HIGH - Users cannot filter vehicles on the main inventory page
- **Business Impact:** HIGH - Reduces conversion as users cannot narrow down their search
- **Technical Impact:** MEDIUM - Easy fix once identified, but was difficult to diagnose

---

## Prevention

To prevent similar issues in the future:

1. **Type Safety:** Add TypeScript interfaces for database function return types
2. **Integration Tests:** Add tests that verify the contract between DB functions and frontend
3. **Documentation:** Document expected return types for all RPC functions
4. **Linting:** Create a custom ESLint rule to check for field name consistency

---

## Contact

If you need assistance applying this fix, please refer to:
- Supabase Dashboard: https://supabase.com/dashboard
- Project ID: jjepfehmuybpctdzipnu
