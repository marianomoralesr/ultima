# Critical Fixes Applied - 2025-10-23

This document describes two critical fixes applied to resolve production issues with the Leads Dashboard and CarStudio API integration.

---

## Issue #1: Leads Dashboard Permission Error

### Problem
Users with `admin` or `sales` roles were seeing:
```
Could not fetch leads. Ensure you have the required permissions.
```

### Root Cause
The `get_leads_for_dashboard()` RPC function checks for a `user_role` claim in the JWT token:
```sql
IF (SELECT public.get_my_role()) NOT IN ('admin', 'sales') THEN
    RAISE EXCEPTION 'Permission denied to access leads dashboard.';
END IF;
```

The `get_my_role()` function reads from JWT claims:
```sql
SELECT auth.jwt()->>'user_role';
```

**The JWT tokens were not including the `user_role` claim**, causing the permission check to fail.

### Solution
Created a Supabase Auth Hook that adds the `user_role` claim to all JWT tokens:

**File:** `supabase/functions/custom-access-token/index.ts`
- Deployed to: https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu/functions
- Fetches user's role from the `profiles` table
- Adds `user_role` claim to JWT tokens
- Deployed successfully ✅

### Next Steps - MANUAL ACTION REQUIRED
You must enable the hook in the Supabase Dashboard:

1. Go to: https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu/auth/hooks
2. Click on **"custom-access-token"** hook
3. Toggle it to **"Enabled"**
4. Click **"Save"**

**After enabling the hook:**
- Existing users need to re-login to get new JWT tokens with the `user_role` claim
- New users will automatically get the claim on login

---

## Issue #2: CarStudio API Network Error

### Problem
Users were seeing:
```
Network error. This could be a CORS proxy issue, an API downtime, or a network problem.
```

### Root Cause
The application was using a public CORS proxy service (`https://proxy.cors.sh/`) which is:
- Unreliable (frequent downtime)
- Rate-limited
- Not suitable for production use

**Location:** `src/pages/config.ts:33`

### Solution
Created a dedicated Supabase Edge Function to proxy CarStudio API requests:

**File:** `supabase/functions/carstudio-proxy/index.ts`
- Deployed to: https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu/functions
- Handles CORS properly
- Only allows requests to `tokyo.carstudio.ai`
- Forwards all headers and request methods
- Deployed successfully ✅

**Updated:** `src/pages/config.ts`
```typescript
// OLD (unreliable):
const CORS_PROXY_URL = 'https://proxy.cors.sh/';

// NEW (reliable):
const CORS_PROXY_URL = `${SUPABASE_URL}/functions/v1/carstudio-proxy?url=`;
```

This change is ready to deploy to production once you rebuild and deploy the frontend.

---

## Deployment Status

### ✅ Completed
1. Created `custom-access-token` edge function
2. Created `carstudio-proxy` edge function
3. Deployed both functions to Supabase
4. Updated `config.ts` to use new CarStudio proxy

### ⏳ Pending - ACTION REQUIRED

#### 1. Enable Auth Hook (CRITICAL)
**Go to Supabase Dashboard and enable the `custom-access-token` hook**
- URL: https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu/auth/hooks
- Enable the `custom-access-token` hook
- Users will need to re-login to get new JWT tokens

#### 2. Deploy Frontend Changes
Run your deployment script to deploy the updated `config.ts`:
```bash
./docs/deployment/deploy.sh staging  # Test first
./docs/deployment/deploy.sh production  # Then production
```

---

## Testing

### Test Leads Dashboard (After Enabling Auth Hook)
1. Enable the auth hook in Supabase Dashboard
2. Log out and log back in as an admin/sales user
3. Navigate to the Leads Dashboard
4. You should see the leads list without permission errors

### Test CarStudio API (After Deploying Frontend)
1. Deploy the frontend changes
2. Navigate to any page using CarStudio API
3. The API requests should work without network errors

---

## Files Created/Modified

### Created:
- `supabase/functions/custom-access-token/index.ts` - Auth hook for JWT claims
- `supabase/functions/carstudio-proxy/index.ts` - CarStudio API proxy
- `FIXES_README.md` - This file

### Modified:
- `src/pages/config.ts` - Updated CORS proxy URL

---

## Additional Notes

### Auth Hook Details
The `custom-access-token` hook runs on every authentication event:
- User login
- Token refresh
- Password reset

It adds the `user_role` claim based on the user's role in the `profiles` table.

### CarStudio Proxy Details
The proxy:
- Only accepts requests to `tokyo.carstudio.ai`
- Forwards all HTTP methods (GET, POST, etc.)
- Properly handles CORS headers
- Forwards the `X-ApiKey` header for authentication

---

## Troubleshooting

### Leads Dashboard Still Shows Permission Error
1. Verify the auth hook is enabled in Supabase Dashboard
2. Log out and log back in to get a new JWT token
3. Check browser console for any errors
4. Verify user has `admin` or `sales` role in the `profiles` table

### CarStudio API Still Shows Network Error
1. Verify frontend deployment completed successfully
2. Check browser console network tab for the actual request URL
3. Verify it's using the new proxy URL: `https://jjepfehmuybpctdzipnu.supabase.co/functions/v1/carstudio-proxy?url=`
4. Check Supabase function logs for errors

---

## Summary

Both critical issues have been resolved with production-ready solutions:
- JWT claims now include `user_role` for proper authorization
- CarStudio API uses a reliable, self-hosted proxy

**Next action:** Enable the auth hook in Supabase Dashboard and deploy frontend changes.
