# Force Profile Reload to Fix CRM Access

## Problem
Your admin account has `role='admin'` in the database, but the frontend still denies access to `/escritorio/admin/leads` because of stale cached profile data.

## Quick Fix (Browser Console)

1. Open your browser's Developer Tools (F12 or right-click → Inspect)
2. Go to the **Console** tab
3. Paste this code and hit Enter:

```javascript
// Clear all cached data
sessionStorage.clear();
localStorage.clear();

// Force reload the page
window.location.reload();
```

4. Log out and log back in
5. Try accessing `/escritorio/admin/leads` again

## Alternative: Manual Cache Clear

1. Open Developer Tools (F12)
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Under **Session Storage** → Select your domain → Click "Clear All"
4. Under **Local Storage** → Select your domain → Click "Clear All"
5. Refresh the page and log in again

## Permanent Fix (Code Level)

The issue is that the AuthContext caches your profile in sessionStorage, but when your role changes in the database, the cache isn't automatically invalidated.

### Option 1: Add a cache-busting version

Update the profile cache to include a version number that you can increment when roles change.

### Option 2: Add an admin panel to force profile refresh

Create a button that calls:
```javascript
await reloadProfile();
```

### Option 3: Reduce cache duration

Modify the AuthContext to check for profile updates more frequently.

## Verify the Fix Worked

After clearing cache and reloading:

1. Open Console
2. Run:
```javascript
console.log(JSON.parse(sessionStorage.getItem('userProfile')));
```

3. You should see `role: "admin"` in the output

## If It Still Doesn't Work

Run this in Supabase SQL Editor to verify your role is actually set:

```sql
SELECT id, email, role::text as role_value
FROM profiles
WHERE email = 'your-email@example.com';
```

If it shows `role_value: null` or `role_value: user`, then you need to update it:

```sql
UPDATE profiles
SET role = 'admin'::user_role
WHERE email = 'your-email@example.com';
```

Then clear cache again and log back in.
