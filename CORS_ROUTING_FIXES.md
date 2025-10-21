# CORS, Routing, and Caching Fixes

## Issues Identified and Fixed

### 1. CORS Configuration Issues
**Problem:**
- Hardcoded origins preventing custom domain access
- Static array of allowed origins didn't support dynamic domains
- Using `credentials: true` with multiple origins could cause browser blocks

**Solution:**
- Implemented dynamic CORS origin validation function
- Added support for multiple domains: `trefa.mx`, `www.trefa.mx`, `autos.trefa.mx`
- Made Cloud Run URL configurable via environment variable
- Added proper CORS warning logging for blocked requests
- Increased preflight cache to 24 hours for better performance

**Files Modified:** `server/server.js:89-109`

---

### 2. Security Headers (CSP) Issues
**Problem:**
- Content Security Policy didn't include all necessary domains
- Missing cross-origin resource policy settings
- CSP could block requests from custom domains

**Solution:**
- Updated CSP `img-src` and `connect-src` to include all TREFA domains
- Set `crossOriginResourcePolicy` to `"cross-origin"`
- Enhanced HSTS with proper configuration (31536000s max-age, includeSubDomains, preload)
- Added Cloud Run URL to allowed sources dynamically

**Files Modified:** `server/server.js:41-92`

---

### 3. Cache Control Issues (CRITICAL)
**Problem:**
- No cache control headers for API endpoints
- `index.html` was being cached, preventing fresh content loads
- Browsers and CDNs storing stale responses
- Vehicles not loading from Supabase due to cached empty responses

**Solution:**
- Added middleware to prevent caching of API endpoints
- Set `index.html` to never cache with multiple cache-busting headers
- Static assets (JS/CSS with hashes) still cached for 1 year for performance
- Added Pragma, Expires, and Surrogate-Control headers

**Files Modified:** `server/server.js:125-138`, `server/server.js:159-185`

---

### 4. Environment Variable Configuration
**Problem:**
- Cloud Run URL was hardcoded
- No dynamic configuration for different deployment environments

**Solution:**
- Added `CLOUD_RUN_URL` environment variable
- Created `ALLOWED_ORIGINS` array that combines all domains
- Made configuration environment-aware

**Files Modified:**
- `server/server.js:22`
- `cloud-build-vars.yaml:10`

---

## Key Changes Summary

### server/server.js
1. **Lines 22-36**: Added `CLOUD_RUN_URL` and `ALLOWED_ORIGINS` array
2. **Lines 41-92**: Updated Helmet security headers with proper CSP
3. **Lines 89-109**: Implemented dynamic CORS validation
4. **Lines 125-138**: Added cache control middleware for API endpoints
5. **Lines 159-185**: Updated static file serving with cache control
6. **Line 188**: Fixed TypeScript warnings (unused variables)

### cloud-build-vars.yaml
1. **Line 10**: Added `CLOUD_RUN_URL` environment variable

---

## Deployment Instructions

### Option 1: Deploy to Cloud Run with gcloud

```bash
# Build and deploy with environment variables from cloud-build-vars.yaml
gcloud run deploy trefa-app \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="$(cat cloud-build-vars.yaml | grep -v '^#' | grep -v '^$' | tr '\n' ',' | sed 's/,$//')"
```

### Option 2: Using Docker Build and Deploy

```bash
# Build the Docker image
docker build \
  --build-arg VITE_SUPABASE_URL="https://jjepfehmuybpctdzipnu.supabase.co" \
  --build-arg VITE_SUPABASE_ANON_KEY="your-anon-key" \
  -t trefa-app .

# Push to Container Registry
docker tag trefa-app gcr.io/YOUR_PROJECT_ID/trefa-app
docker push gcr.io/YOUR_PROJECT_ID/trefa-app

# Deploy to Cloud Run
gcloud run deploy trefa-app \
  --image gcr.io/YOUR_PROJECT_ID/trefa-app \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars FRONTEND_URL="https://trefa.mx",CLOUD_RUN_URL="https://app-1052659336338.us-central1.run.app"
```

### Option 3: Using Cloud Build

```bash
# Submit build to Cloud Build
gcloud builds submit --config cloudbuild.yaml
```

---

## Verifying the Fixes

After deployment, verify that the fixes work:

### 1. Check CORS Headers
```bash
curl -I -X OPTIONS https://trefa.mx \
  -H "Origin: https://trefa.mx" \
  -H "Access-Control-Request-Method: GET"
```

Expected response should include:
```
Access-Control-Allow-Origin: https://trefa.mx
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH
```

### 2. Check Cache Control Headers
```bash
curl -I https://trefa.mx/
```

Expected response should include:
```
Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate
Pragma: no-cache
Expires: 0
```

### 3. Check API Endpoint Cache Control
```bash
curl -I https://trefa.mx/api/health
```

Expected response should include:
```
Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate
Surrogate-Control: no-store
```

### 4. Test Supabase Connection
Open browser console and check:
```javascript
// Should successfully fetch vehicles from Supabase
fetch('https://jjepfehmuybpctdzipnu.supabase.co/rest/v1/inventario_cache?select=*&limit=5', {
  headers: {
    'apikey': 'your-anon-key',
    'Authorization': 'Bearer your-anon-key'
  }
})
.then(r => r.json())
.then(console.log)
```

---

## Troubleshooting

### If domain still shows cached content:
1. Clear browser cache completely (Ctrl+Shift+Delete)
2. Use incognito/private browsing mode
3. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
4. Check browser DevTools Network tab - look for 304 responses (cached)
5. Verify deployment completed successfully in Cloud Run console

### If CORS errors persist:
1. Check Cloud Run logs for CORS warning messages
2. Verify the `FRONTEND_URL` environment variable matches your domain
3. Check browser console for the exact origin being sent
4. Ensure your domain is in the `ALLOWED_ORIGINS` array in server.js:30-36

### If Supabase connection fails:
1. Verify Supabase URL and anon key are correct in environment variables
2. Check Network tab for failed requests
3. Look for CSP violations in browser console
4. Verify `connect-src` in CSP includes Supabase URL

---

## Additional Recommendations

### 1. Add Custom Domain to Cloud Run
If you haven't already, map your custom domain in Cloud Run:
```bash
gcloud run domain-mappings create --service=trefa-app --domain=trefa.mx
```

### 2. Enable Cloud CDN (Optional)
For better performance, enable Cloud CDN with proper cache invalidation rules.

### 3. Security Improvements (Future)
- Remove `'unsafe-inline'` and `'unsafe-eval'` from CSP once code is refactored
- Implement nonce-based CSP for inline scripts
- Use environment variables for all API keys (never commit to git)
- Consider implementing rate limiting

### 4. Monitoring
- Set up Cloud Monitoring alerts for CORS errors
- Track 5xx errors and cache hit/miss rates
- Monitor Supabase connection errors

---

## What Changed vs. Before

| Before | After |
|--------|-------|
| Hardcoded 2 origins | Dynamic origin validation supporting 5+ domains |
| No cache control | Full cache control with no-cache for index.html and APIs |
| Static CSP | Dynamic CSP with environment-based domains |
| Cloud Run URL hardcoded | Cloud Run URL configurable via env var |
| index.html cached indefinitely | index.html never cached |
| API responses cached | API responses always fresh (no-store) |

---

## Files Modified

1. `server/server.js` - Main server configuration
2. `cloud-build-vars.yaml` - Environment variables
3. `CORS_ROUTING_FIXES.md` - This documentation (new file)

## Backup

If you need to rollback, the original server.js had:
- CORS with static array: `origin: [FRONTEND_URL, hardcoded-url]`
- No cache control headers
- Basic CSP without all domains
