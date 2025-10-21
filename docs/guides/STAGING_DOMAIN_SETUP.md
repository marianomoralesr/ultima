# Staging Domain Setup Guide

## Recommended Staging Domain

I recommend using: **`staging.trefa.mx`**

This subdomain will:
- ✅ Allow you to whitelist it in Supabase
- ✅ Test with HTTPS and proper SSL
- ✅ Test CORS with real domain (not Cloud Run URL)
- ✅ Keep staging separate from production

---

## Step 1: Map Custom Domain in Cloud Run

### Option A: Using gcloud CLI (Recommended)

```bash
# Map staging.trefa.mx to app-staging service
gcloud run domain-mappings create \
  --service=app-staging \
  --domain=staging.trefa.mx \
  --region=us-central1 \
  --platform=managed
```

This will output DNS records you need to configure.

### Option B: Using Google Cloud Console

1. Go to: https://console.cloud.google.com/run
2. Click on `app-staging` service
3. Click "MANAGE CUSTOM DOMAINS" at the top
4. Click "ADD MAPPING"
5. Select `app-staging` service
6. Enter domain: `staging.trefa.mx`
7. Click "CONTINUE"

---

## Step 2: Configure DNS Records

After running the mapping command, you'll get DNS records like:

```
Please add the following DNS records:

NAME                  TYPE   DATA
staging.trefa.mx      CNAME  ghs.googlehosted.com
```

### Add DNS Record in Your DNS Provider

**Example for Cloudflare:**
1. Go to Cloudflare DNS dashboard
2. Add a CNAME record:
   - **Name**: `staging`
   - **Target**: `ghs.googlehosted.com`
   - **Proxy status**: DNS only (gray cloud)
   - **TTL**: Auto

**Example for GoDaddy:**
1. Go to DNS Management
2. Add CNAME record:
   - **Host**: `staging`
   - **Points to**: `ghs.googlehosted.com`
   - **TTL**: 1 hour

**Example for Google Domains:**
1. Go to DNS settings
2. Add custom record:
   - **Host name**: `staging`
   - **Type**: CNAME
   - **TTL**: 1h
   - **Data**: `ghs.googlehosted.com`

---

## Step 3: Wait for SSL Certificate

After DNS propagation (5-30 minutes), Cloud Run will automatically provision an SSL certificate.

Check status:
```bash
gcloud run domain-mappings describe --domain=staging.trefa.mx --region=us-central1
```

Look for:
```yaml
status:
  conditions:
  - status: "True"
    type: Ready
  certificateStatus: ACTIVE
```

---

## Step 4: Update Staging Deployment

Update the deployment script to use the staging domain:

```bash
# Edit deploy.sh or set environment variable
STAGING_DOMAIN="https://staging.trefa.mx"
```

Re-deploy staging with updated FRONTEND_URL:

```bash
./deploy.sh staging
```

Or manually update:
```bash
gcloud run services update app-staging \
  --region=us-central1 \
  --update-env-vars="FRONTEND_URL=https://staging.trefa.mx"
```

---

## Step 5: Add Staging Domain to Supabase

### In Supabase Dashboard:

1. Go to: https://supabase.com/dashboard
2. Select your project: `jjepfehmuybpctdzipnu`
3. Go to **Settings** → **API**
4. Scroll to **URL Configuration**
5. Add to **Site URL**: `https://staging.trefa.mx`
6. Add to **Redirect URLs**: `https://staging.trefa.mx/**`

### In Authentication Settings:

1. Go to **Authentication** → **URL Configuration**
2. Add to **Allowed URLs for redirects**:
   ```
   https://staging.trefa.mx
   https://staging.trefa.mx/**
   ```

### For RLS (Row Level Security):

The Supabase anon key works across all domains, so no changes needed for RLS policies.

---

## Step 6: Update CORS in Server

The deployment script already handles this! The server will automatically allow:
- `https://trefa.mx` (production)
- `https://www.trefa.mx`
- `https://autos.trefa.mx`
- `https://staging.trefa.mx` (staging)
- Cloud Run URLs

But let's verify by checking the allowed origins in `server/server.js`:

```javascript
const ALLOWED_ORIGINS = [
  FRONTEND_URL,  // Will be https://staging.trefa.mx for staging
  CLOUD_RUN_URL,
  "https://trefa.mx",
  "https://www.trefa.mx",
  "https://autos.trefa.mx",
].filter(Boolean);
```

---

## Step 7: Verify Everything Works

### Test DNS Resolution
```bash
dig staging.trefa.mx
# Should show CNAME to ghs.googlehosted.com
```

### Test SSL Certificate
```bash
curl -I https://staging.trefa.mx/healthz
# Should return 200 OK with SSL
```

### Test CORS
```bash
curl -I -X OPTIONS https://staging.trefa.mx \
  -H "Origin: https://staging.trefa.mx" \
  -H "Access-Control-Request-Method: GET"

# Should return:
# Access-Control-Allow-Origin: https://staging.trefa.mx
# Access-Control-Allow-Credentials: true
```

### Test Supabase Connection
```bash
# Open browser console on staging.trefa.mx
fetch('https://jjepfehmuybpctdzipnu.supabase.co/rest/v1/inventario_cache?select=*&limit=1', {
  headers: {
    'apikey': 'YOUR_ANON_KEY',
    'Authorization': 'Bearer YOUR_ANON_KEY'
  }
})
.then(r => r.json())
.then(console.log)
```

---

## Troubleshooting

### DNS Not Resolving

**Problem**: `staging.trefa.mx` not resolving

**Solutions**:
1. Wait 5-30 minutes for DNS propagation
2. Check DNS with: `dig staging.trefa.mx`
3. Verify CNAME record in DNS provider
4. Try flushing local DNS cache:
   ```bash
   sudo dscacheutil -flushcache
   sudo killall -HUP mDNSResponder
   ```

### SSL Certificate Not Provisioning

**Problem**: "Certificate not ready" error

**Solutions**:
1. Verify DNS is propagating: `dig staging.trefa.mx`
2. Check domain mapping status:
   ```bash
   gcloud run domain-mappings describe --domain=staging.trefa.mx --region=us-central1
   ```
3. Delete and recreate mapping if stuck:
   ```bash
   gcloud run domain-mappings delete --domain=staging.trefa.mx --region=us-central1
   gcloud run domain-mappings create --service=app-staging --domain=staging.trefa.mx --region=us-central1
   ```

### CORS Errors from Staging Domain

**Problem**: "Access to fetch at '...' from origin 'https://staging.trefa.mx' has been blocked by CORS"

**Solutions**:
1. Verify FRONTEND_URL is set:
   ```bash
   gcloud run services describe app-staging --region=us-central1 --format=yaml | grep FRONTEND_URL
   ```
2. Check server logs for CORS warnings:
   ```bash
   gcloud run logs tail app-staging --region=us-central1
   ```
3. Re-deploy staging to update CORS config

### Supabase Still Blocking Requests

**Problem**: Supabase returns CORS errors

**Solution**: Make sure you added the domain to ALL these places in Supabase:
1. Project Settings → API → Site URL
2. Authentication → URL Configuration → Redirect URLs
3. Wait 1-2 minutes for Supabase to propagate changes

---

## Quick Setup Script

```bash
#!/bin/bash

# Quick staging domain setup
STAGING_DOMAIN="staging.trefa.mx"

echo "Step 1: Creating domain mapping..."
gcloud run domain-mappings create \
  --service=app-staging \
  --domain=$STAGING_DOMAIN \
  --region=us-central1 \
  --platform=managed

echo ""
echo "Step 2: Copy the DNS records above and add them to your DNS provider"
echo ""
echo "Step 3: Wait for DNS propagation (check with: dig $STAGING_DOMAIN)"
echo ""
echo "Step 4: Once DNS is ready, run:"
echo "  ./deploy.sh staging"
echo ""
echo "Step 5: Add $STAGING_DOMAIN to Supabase dashboard"
```

---

## Alternative: Use Subdomain with Different TLD

If you want to keep staging completely separate, you could use:
- `trefa-staging.com` (new domain)
- `staging-trefa.mx` (if available)
- `dev.trefa.mx` (development subdomain)

Same steps apply, just use your chosen domain.

---

## Cleanup (When Done Testing)

When you're ready to remove staging:

```bash
# Delete domain mapping
gcloud run domain-mappings delete --domain=staging.trefa.mx --region=us-central1

# Delete staging service
gcloud run services delete app-staging --region=us-central1

# Remove DNS record from your DNS provider

# Remove from Supabase allowed URLs
```

---

## Summary

1. ✅ Run domain mapping command
2. ✅ Add CNAME record to DNS
3. ✅ Wait for SSL certificate
4. ✅ Deploy staging with FRONTEND_URL=https://staging.trefa.mx
5. ✅ Add staging.trefa.mx to Supabase
6. ✅ Test everything!

Once staging works perfectly, deploy to production with confidence!
