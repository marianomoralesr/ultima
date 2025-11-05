# Frontend Debug Instructions

The data exists in the database and RLS is working. The issue is in the frontend. Let's debug it.

## Step 1: Check Browser Console Logs

1. **Go to the CRM page:**
   https://trefa.mx/escritorio/admin/crm

2. **Open Browser Developer Console:**
   - **Chrome/Edge**: Press `F12` or `Cmd+Option+J` (Mac) / `Ctrl+Shift+J` (Windows)
   - **Firefox**: Press `F12` or `Cmd+Option+K` (Mac) / `Ctrl+Shift+K` (Windows)
   - **Safari**: Enable Developer Menu first (Safari > Preferences > Advanced > Show Develop menu), then `Cmd+Option+C`

3. **Look for these console messages:**
   - `[SimpleCRM] Fetched profiles:` - should show a number (e.g., 150)
   - `[SimpleCRM] Combined leads:` - should show same number
   - `[SimpleCRM] Sample lead:` - should show lead object with data

4. **Check for errors:**
   - Look for any RED error messages
   - Look for messages about RLS or permissions

## Step 2: What to Look For

### GOOD Signs (everything working):
```
[SimpleCRM] Fetched profiles: 150
[SimpleCRM] Combined leads: 150
[SimpleCRM] Sample lead: {
  id: "...",
  first_name: "John",
  latest_app_status: "submitted",
  latest_app_car_title: "Toyota Camry 2020",
  ...
}
```

### BAD Signs (issue found):

**If you see:**
```
[SimpleCRM] Fetched profiles: 150
[SimpleCRM] Combined leads: 150
[SimpleCRM] Sample lead: {
  id: "...",
  first_name: "John",
  latest_app_status: null,
  latest_app_car_title: null,
  ...
}
```
**Meaning**: Applications aren't being fetched or matched

**If you see errors like:**
```
Error fetching CRM data: ... permission denied for table financing_applications
```
**Meaning**: RLS is still blocking the frontend query

## Step 3: Force Refresh the Page

Sometimes the frontend is cached. Try:

1. **Hard Refresh:**
   - **Chrome/Edge/Firefox**: `Cmd+Shift+R` (Mac) / `Ctrl+Shift+F5` (Windows)
   - **Safari**: `Cmd+Option+R`

2. **Clear Cache and Reload:**
   - Open DevTools (F12)
   - Right-click the refresh button
   - Click "Empty Cache and Hard Reload"

3. **Try Incognito/Private Mode:**
   - Open a new incognito/private window
   - Log in to https://trefa.mx
   - Go to CRM page
   - Check if data shows

## Step 4: Check Network Tab

1. **Open DevTools (F12)**

2. **Click "Network" tab**

3. **Refresh the page**

4. **Look for the request to "financing_applications":**
   - Click on it
   - Check the "Response" tab
   - Does it show data or an error?

5. **Screenshot what you see**

## Step 5: What to Report Back

Send me:
1. **Console logs** (copy/paste the `[SimpleCRM]` messages)
2. **Any error messages** (red text in console)
3. **Network response** for financing_applications query
4. **Does hard refresh fix it?**

This will tell me exactly what's wrong!
