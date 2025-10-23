# CRITICAL: Fix Trigger and Clear Cache

## Issue
The staging deployment has the client-side fixes, but:
1. The database trigger `set_user_id_from_auth()` might not be updated
2. Browser has cached old JavaScript
3. Profile fetch getting 406 error

## Fix Instructions (DO IN ORDER)

### Step 1: Fix Database Trigger
**Go to:** https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu/sql

**Run ALL of:** `verify_and_fix_trigger.sql`

This will:
- ✅ Show current trigger source (check if it says NEW.uid or NEW.user_id)
- ✅ Fix the trigger if needed
- ✅ Test that trigger works
- ✅ Initialize agent_assignment_state
- ✅ Assign advisor to your test user

**Expected output from query #2:**
Should show a row with `user_id` populated (NOT NULL)

---

### Step 2: Clear Browser Cache
**In your browser on staging:**

1. **Open DevTools** (F12)
2. **Right-click the refresh button** (next to address bar)
3. **Click "Empty Cache and Hard Reload"**

OR manually:
- **Chrome/Edge:** Cmd+Shift+Delete (Mac) or Ctrl+Shift+Delete (Windows) → Clear "Cached images and files"
- **Firefox:** Cmd+Shift+Delete → Clear "Cache"

---

### Step 3: Clear sessionStorage
**In browser console (F12), run:**
```javascript
sessionStorage.clear();
localStorage.clear();
location.reload();
```

---

### Step 4: Sign Out and Sign In Again
1. Sign out of staging
2. Sign in with your test user account
3. Check console for errors

---

### Step 5: Verify Everything Works

**Check 1: Profile loaded**
Console should show: `✅ Profile fetched from Supabase and cached.`

**Check 2: Advisor assigned**
```sql
SELECT asesor_asignado_id FROM profiles WHERE id = auth.uid();
```
Should NOT be NULL

**Check 3: Can create application**
Go to `/escritorio/aplicacion` - should work without 403 error

---

## If Still Failing

### Debug the 406 Error

The 406 on profiles suggests an Accept header mismatch. Check:

```javascript
// In browser console
console.log(document.cookie); // Check if auth cookies exist
```

**Then run in SQL:**
```sql
-- Check if you're actually authenticated
SELECT
    auth.uid() as user_id,
    auth.jwt()->>'email' as email;
```

If `auth.uid()` is NULL, you're not authenticated - sign out and sign in again.

---

## Why This Happened

1. **Trigger fix** was run manually in SQL editor but might have been overwritten or not persisted
2. **Browser cache** kept old JavaScript with explicit `user_id` in inserts
3. **sessionStorage** had stale profile data without `asesor_asignado_id`

The fix ensures:
- ✅ Trigger uses `NEW.user_id`
- ✅ Browser has fresh JavaScript
- ✅ Profile cache is cleared
- ✅ Advisor gets assigned
