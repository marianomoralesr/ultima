# FORCE COMPLETE CACHE CLEAR

The browser is serving OLD cached JavaScript. Here's how to completely clear it:

## Method 1: Incognito/Private Window (FASTEST)

1. **Open Incognito/Private window:**
   - Chrome: Cmd+Shift+N (Mac) or Ctrl+Shift+N (Windows)
   - Firefox: Cmd+Shift+P (Mac) or Ctrl+Shift+P (Windows)
   - Safari: Cmd+Shift+N

2. **Go to staging:**
   https://app-staging-dqfqiqyola-uc.a.run.app

3. **Sign in with your test user**

4. **Try to access application:**
   https://app-staging-dqfqiqyola-uc.a.run.app/escritorio/aplicacion

**This bypasses ALL cache!**

---

## Method 2: Nuclear Cache Clear

If incognito doesn't work:

### Chrome/Edge:
1. Open DevTools (F12)
2. Right-click the **Refresh button** (while DevTools is open)
3. Select **"Empty Cache and Hard Reload"**

### Firefox:
1. Press Cmd+Shift+Delete (Mac) or Ctrl+Shift+Delete (Windows)
2. Select **"Everything"** for Time Range
3. Check ONLY **"Cache"**
4. Click Clear Now
5. Close and reopen browser
6. Go to staging

### Safari:
1. Develop menu → Empty Caches
2. Or Cmd+Option+E
3. Close and reopen browser

---

## Method 3: Check What's Actually Deployed

Open browser console (F12) and run:

```javascript
// Check app version
console.log(window.location.href);
fetch('/').then(r => r.text()).then(html => {
  const match = html.match(/assets\/index-[a-zA-Z0-9]+\.js/);
  console.log('JS bundle:', match ? match[0] : 'not found');
});

// Check if old code is loaded
import('./src/services/ApplicationService').then(m => {
  console.log(m.ApplicationService.createDraftApplication.toString());
});
```

This will show if you're loading old JavaScript.

---

## Method 4: Service Worker Clear

Service workers can cache aggressively:

1. Open DevTools (F12)
2. Go to **Application** tab
3. Click **Service Workers** (left sidebar)
4. Click **Unregister** for all workers
5. Click **Storage** (left sidebar)
6. Click **Clear site data**
7. Hard refresh (Cmd+Shift+R)

---

## Verify Cache is Cleared

After clearing, check:

```javascript
// In console - should show empty or minimal data
console.log('sessionStorage:', sessionStorage);
console.log('localStorage:', localStorage);
navigator.serviceWorker.getRegistrations().then(r => console.log('Service workers:', r));
```

---

## If STILL Getting 403

If incognito mode STILL shows 403, then there's a different issue. Share:

1. Full console error stack trace
2. Network tab showing the failing request
3. Request headers and response

The issue would then be server-side, not browser cache.
