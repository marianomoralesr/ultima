# Debug 406 and 403 Errors

## Error 1: 406 on Profiles (BLOCKING EVERYTHING)

The 406 "Not Acceptable" error means the request headers don't match what Supabase can return.

### Check in Browser Console:

```javascript
// Check if you're authenticated
const session = await supabase.auth.getSession();
console.log('Session:', session.data.session);
console.log('User:', session.data.session?.user);

// If session is NULL, you're not logged in!
```

### If session is NULL:
1. Sign out completely
2. Clear all cookies for the domain
3. Sign in again

### Check Auth Headers:

```javascript
// See what headers are being sent
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', (await supabase.auth.getSession()).data.session.user.id);

console.log('Profile fetch result:', { data, error });
```

---

## Error 2: 403 on Financing Applications

### Check What's Being Sent:

Open DevTools → Network tab:
1. Try to create application
2. Find the `financing_applications` POST request
3. Click on it
4. Check **Payload** tab

**If you see `user_id` in the payload:**
- Browser is using OLD cached JavaScript
- Solution: Incognito mode OR nuclear cache clear

**If payload only has `status`:**
- Trigger isn't working because you're not authenticated
- Check session above

---

## Nuclear Cache Clear (DO THIS)

### Chrome/Edge:
```javascript
// Run in console
sessionStorage.clear();
localStorage.clear();
indexedDB.databases().then(dbs => dbs.forEach(db => indexedDB.deleteDatabase(db.name)));
caches.keys().then(keys => keys.forEach(key => caches.delete(key)));

// Then manually:
// 1. Close DevTools
// 2. Cmd+Shift+Delete
// 3. Select "Cached images and files" + "Cookies"
// 4. Clear
// 5. Close browser completely
// 6. Reopen and go to: https://app-staging-dqfqiqyola-uc.a.run.app
```

---

## FASTEST DEBUG: Incognito + Check Network

1. **Open Incognito Window**
2. **Go to:** https://app-staging-dqfqiqyola-uc.a.run.app
3. **Open DevTools (F12) → Network tab**
4. **Sign in**
5. **Watch the network requests:**
   - Does profile load succeed? (200 status)
   - What's the Authorization header?
6. **Try to access /escritorio/aplicacion**
7. **Watch the financing_applications POST:**
   - What's in the request payload?
   - What's the response?

**Share screenshots of:**
- The failing requests in Network tab
- The request payload
- The response

This will show EXACTLY what's happening!
