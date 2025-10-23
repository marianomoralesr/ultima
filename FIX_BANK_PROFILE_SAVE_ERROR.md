# Fix Bank Profile Save Error - "record 'new' has no field 'uid'"

## Problem

When users try to save their bank profile form, the save fails with error:
```
Error: Could not save bank profile: record "new" has no field "uid"
```

## Root Cause

The `set_user_id_from_auth()` trigger function (used by `bank_profiles`, `financing_applications`, `applications`, `uploaded_documents`, and `user_vehicles_for_sale` tables) references `NEW.uid`, but all these tables use column name `user_id`, not `uid`.

**Broken Function** (lines 1432-1439 in remote_schema.sql):
```sql
CREATE OR REPLACE FUNCTION "public"."set_user_id_from_auth"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$BEGIN
  IF NEW.uid IS NULL THEN      -- ❌ Column is "user_id" not "uid"
    NEW.uid := auth.uid();
  END IF;
  RETURN NEW;
END;$$;
```

**Tables Affected:**
- ✅ `bank_profiles` - has `user_id` column
- ✅ `financing_applications` - has `user_id` column
- ✅ `applications` - has `user_id` column
- ✅ `uploaded_documents` - has `user_id` column
- ✅ `user_vehicles_for_sale` - has `user_id` column

All use `user_id`, so changing `NEW.uid` to `NEW.user_id` fixes all of them.

## The Fix

**File**: `supabase/migrations/20251023100000_fix_bank_profile_trigger_uid_column.sql`

```sql
CREATE OR REPLACE FUNCTION "public"."set_user_id_from_auth"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$BEGIN
  -- Changed from NEW.uid to NEW.user_id to match actual column names
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  RETURN NEW;
END;$$;
```

## How to Apply

### Option 1: Supabase SQL Editor (Fastest)

1. Go to: https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu/sql
2. Copy the contents of `supabase/migrations/20251023100000_fix_bank_profile_trigger_uid_column.sql`
3. Paste and click **Run**

### Option 2: Supabase CLI

```bash
cd /Users/marianomorales/Downloads/ultima\ copy
supabase db push
```

## Verification

After applying the fix:

1. **Test Bank Profile Save**:
   - Go to `/escritorio/bank-profiling`
   - Fill out the bank profiling form
   - Click "Guardar y Analizar Perfil"
   - Should save successfully without errors

2. **Check Browser Console**:
   - No more "record 'new' has no field 'uid'" errors
   - Should see successful save confirmation

3. **Verify Database**:
   ```sql
   SELECT user_id, banco_recomendado, is_complete
   FROM bank_profiles
   WHERE user_id = auth.uid();
   ```

## Expected Behavior After Fix

- ✅ Bank profile form saves successfully
- ✅ User automatically redirected to financing application after 7 seconds
- ✅ Recommended bank and second option displayed correctly
- ✅ Confetti animation shows if score is good
- ✅ No console errors

## Impact

This fix resolves:
- ❌ Bank profile save failures (blocking all users from completing bank profiling)
- ❌ Potentially affects financing applications, document uploads, and vehicle sales submissions

After fix:
- ✅ Bank profiling flow works end-to-end
- ✅ Users can proceed to financing application
- ✅ All triggers using `set_user_id_from_auth()` work correctly
