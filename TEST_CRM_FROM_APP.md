# Test CRM Access From Your Application

The SQL file I provided will work correctly when accessed through your application, but not when testing directly in the SQL Editor (because SQL Editor doesn't have your auth session).

## Steps to Test:

1. **Apply the fix** (if you haven't already):
   - Run `FINAL_CRM_ACCESS_FIX.sql` in Supabase SQL Editor
   - This will update the functions

2. **In your browser**, while logged into your app:
   - Open Developer Console (F12)
   - Go to the Console tab
   - Run this to clear cache:
   ```javascript
   sessionStorage.clear();
   localStorage.clear();
   location.reload();
   ```

3. **Log out and log back in** to your application

4. **Try accessing** `/escritorio/admin/leads`
   - It should work now!

## If It Still Doesn't Work

Open the browser console and run this while logged into your app:

```javascript
// Check what the frontend sees
const { data, error } = await supabase.rpc('get_my_role');
console.log('My role:', data, 'Error:', error);

// Check auth state
const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', session);
console.log('User ID:', session?.user?.id);

// Check profile
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', session?.user?.id)
  .single();
console.log('Profile:', profile);
```

This will show us:
1. What role the function returns
2. If you have an active session
3. What your profile data looks like

Send me the console output and I can help further.

## Alternative: Test in SQL Editor With Service Role

If you want to test in SQL Editor, you need to use the "Service Role" connection which bypasses RLS. But this is only for testing - the application will work differently.
