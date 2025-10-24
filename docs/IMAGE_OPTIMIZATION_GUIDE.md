# Image Optimization & CDN Implementation Guide

## Problem Statement

Your Supabase account was consuming **250GB of egress in a few days**, which is unsustainable for cost and performance. This guide provides a complete solution to reduce egress by **70-90%** while improving image loading performance.

---

## Solution Overview: Hybrid Approach (Option C)

This implementation provides:
- **Immediate relief**: CDN proxy caches existing Supabase images
- **Long-term solution**: New uploads go to Cloudflare R2 (zero egress costs)
- **No breaking changes**: Existing image URLs continue to work
- **Performance boost**: 30-50% faster image loading

---

## Phase 1: Deploy Cloudflare Worker (IMMEDIATE - Do This First)

### Step 1: Set Up Cloudflare Worker

```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Navigate to the worker directory
cd cloudflare-workers

# Edit wrangler.toml and add your account ID
# Find it at: https://dash.cloudflare.com (in URL or Account Home)
```

### Step 2: Deploy the Worker

```bash
# Deploy the image proxy worker
wrangler deploy
```

### Step 3: Configure Custom Domain

**Option A: Using Cloudflare Dashboard (Recommended)**
1. Go to Cloudflare Dashboard > Workers & Pages > `trefa-image-proxy`
2. Click "Triggers" tab
3. Click "Add Custom Domain"
4. Enter: `images.trefa.mx` (or your preferred subdomain)
5. Cloudflare will automatically create DNS records

**Option B: Using wrangler.toml**
```toml
routes = [
  { pattern = "images.trefa.mx/*", zone_name = "trefa.mx" }
]
```

Then redeploy:
```bash
wrangler deploy
```

### Step 4: Test the Worker

```bash
# Health check
curl https://images.trefa.mx/health
# Should return: OK

# Test an actual image
curl -I https://images.trefa.mx/fotos_airtable/app/suv-2Artboard-12-trefa.png
# Check for X-Cache-Status header

# Test again (should be cached)
curl -I https://images.trefa.mx/fotos_airtable/app/suv-2Artboard-12-trefa.png
# X-Cache-Status should be: HIT
```

**Expected Response Headers:**
```
HTTP/2 200
cache-control: public, max-age=604800, s-maxage=2592000
x-cache-status: MISS (first request) or HIT (cached)
access-control-allow-origin: *
```

---

## Phase 2: Configure Application to Use CDN

### Step 1: Update Environment Variables

Create/update `.env.local`:

```bash
# Image CDN Configuration
VITE_IMAGE_CDN_URL=https://images.trefa.mx

# Cloudflare R2 Configuration (for Phase 3)
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_R2_ACCESS_KEY_ID=your-access-key
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your-secret-key
VITE_CLOUDFLARE_R2_PUBLIC_URL=https://r2.trefa.mx
```

### Step 2: Update Deployment Environment Variables

**For Cloud Run (staging & production):**

```bash
# Set environment variable for staging
gcloud run services update app-staging \
  --region=us-central1 \
  --update-env-vars=VITE_IMAGE_CDN_URL=https://images.trefa.mx

# Set environment variable for production
gcloud run services update app \
  --region=us-central1 \
  --update-env-vars=VITE_IMAGE_CDN_URL=https://images.trefa.mx
```

Or add to your deployment script:

**`docs/deployment/deploy.sh`** - Add to Docker build args:
```bash
--build-arg VITE_IMAGE_CDN_URL="${VITE_IMAGE_CDN_URL}" \
```

And to Dockerfile:
```dockerfile
ARG VITE_IMAGE_CDN_URL
ENV VITE_IMAGE_CDN_URL=$VITE_IMAGE_CDN_URL
```

### Step 3: Deploy to Staging

```bash
# Deploy to staging to test
./docs/deployment/deploy.sh staging
```

### Step 4: Test on Staging

```bash
# Check that images are loading from CDN
curl -I https://app-staging-dqfqiqyola-uc.a.run.app
# Look for images loading from images.trefa.mx

# Open browser dev tools and check Network tab
# Images should load from: images.trefa.mx
# Second load should show cache hits
```

### Step 5: Deploy to Production

Once staging is verified:

```bash
./docs/deployment/deploy.sh production
```

---

## Phase 3: Set Up Cloudflare R2 (For New Uploads)

### Step 1: Create R2 Bucket

1. Go to Cloudflare Dashboard > R2
2. Click "Create bucket"
3. Name: `trefa-images`
4. Location: Automatic
5. Click "Create bucket"

### Step 2: Configure Public Access

1. Click on the `trefa-images` bucket
2. Go to "Settings" tab
3. Under "Public access", click "Allow Access"
4. Add custom domain: `r2.trefa.mx`
   - Cloudflare will create DNS records automatically

### Step 3: Generate API Tokens

1. In R2 Dashboard, click "Manage R2 API Tokens"
2. Click "Create API token"
3. Token name: `trefa-app-uploads`
4. Permissions:
   - Object Read & Write
   - Specify bucket: `trefa-images`
5. Click "Create API Token"
6. **IMPORTANT**: Copy the Access Key ID and Secret Access Key
   - You won't be able to see them again!

### Step 4: Update Environment Variables

Add to `.env.local`:

```bash
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_R2_ACCESS_KEY_ID=your-access-key-id
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your-secret-access-key
VITE_CLOUDFLARE_R2_PUBLIC_URL=https://r2.trefa.mx
```

### Step 5: Install AWS SDK

The R2 service uses S3-compatible API:

```bash
npm install @aws-sdk/client-s3
```

### Step 6: Update StorageService (Optional)

To make new uploads use R2 instead of Supabase, update `src/services/StorageService.ts`:

```typescript
import r2Storage from './R2StorageService';

export async function uploadImage(file: File, folder: string): Promise<string> {
  // Try R2 first, fallback to Supabase
  if (r2Storage.isAvailable()) {
    try {
      const path = r2Storage.generatePath(folder, file.name);
      return await r2Storage.uploadFile(file, path);
    } catch (error) {
      console.error('R2 upload failed, falling back to Supabase:', error);
    }
  }

  // Fallback to Supabase
  return await uploadToSupabase(file, folder);
}
```

---

## Monitoring & Verification

### Check Cloudflare Worker Analytics

1. Go to Cloudflare Dashboard > Workers & Pages > trefa-image-proxy
2. Click "Metrics" tab
3. Monitor:
   - **Requests**: Should see all image traffic
   - **Cache Hit Ratio**: Should be 85-95% after 24 hours
   - **Bandwidth Saved**: Amount of traffic served from cache

### Check Supabase Usage

1. Go to Supabase Dashboard > Settings > Usage
2. Monitor "Egress" over next few days
3. **Expected reduction**: 70-90% decrease

### Performance Testing

```bash
# Test image load time from CDN
time curl -o /dev/null https://images.trefa.mx/fotos_airtable/app/suv-2Artboard-12-trefa.png

# Compare with direct Supabase (should be slower)
time curl -o /dev/null https://jjepfehmuybpctdzipnu.supabase.co/storage/v1/object/public/fotos_airtable/app/suv-2Artboard-12-trefa.png
```

---

## Expected Results & Savings

### Before Implementation:
- **Supabase Egress**: 250GB / few days ≈ **75-100GB/day**
- **Estimated Monthly Cost**: $150-300/month (Supabase overages)
- **Image Load Time**: 800-1500ms
- **Cache Hit Ratio**: 0% (no caching)

### After Implementation:
- **Supabase Egress**: 7-30GB/day (70-90% reduction)
- **CDN Bandwidth**: 65-90GB/day (cached at Cloudflare edge)
- **Estimated Monthly Cost**: $20-50/month
- **Image Load Time**: 150-400ms (60-80% faster)
- **Cache Hit Ratio**: 85-95%
- **Monthly Savings**: **$100-250/month**

---

## Troubleshooting

### Images not loading from CDN

**Check environment variable:**
```bash
echo $VITE_IMAGE_CDN_URL
# Should output: https://images.trefa.mx
```

**Verify in browser console:**
```javascript
console.log(import.meta.env.VITE_IMAGE_CDN_URL);
```

**Fix**: Rebuild and redeploy after setting env var.

### Worker returning 404 errors

**Check the URL format:**
```bash
# Correct:
https://images.trefa.mx/fotos_airtable/app/suv.png

# Incorrect (will 404):
https://images.trefa.mx/storage/v1/object/public/fotos_airtable/app/suv.png
```

**Fix**: The worker strips `/storage/v1/object/public/` automatically.

### Cache not working (always X-Cache-Status: MISS)

**Possible causes:**
1. Query parameters changing on each request
2. Cookies being sent with requests
3. Cloudflare cache settings

**Fix:**
1. Check Worker code for cache key generation
2. Verify no dynamic query params on image URLs
3. Check Cloudflare cache settings in Dashboard

### R2 uploads failing

**Check credentials:**
```typescript
console.log('R2 configured:', r2Storage.isAvailable());
```

**Common issues:**
1. Incorrect account ID
2. API token expired or wrong permissions
3. Bucket name mismatch

**Fix**: Double-check all environment variables and bucket configuration.

---

## Gradual Migration Strategy

### Week 1: Deploy CDN Proxy
- [x] Deploy Cloudflare Worker
- [x] Update code to use CDN utility
- [x] Deploy to staging, test thoroughly
- [x] Deploy to production
- [x] Monitor Supabase egress reduction

### Week 2-3: Set Up R2
- [ ] Create R2 bucket and configure public access
- [ ] Generate API tokens
- [ ] Test R2 uploads in development
- [ ] Update StorageService for new uploads
- [ ] Deploy to staging, verify R2 uploads work

### Week 4+: Optional Migration
- [ ] Create script to migrate existing images to R2
- [ ] Migrate high-traffic images first (placeholders, featured)
- [ ] Update database references if needed
- [ ] Gradually migrate remaining images

---

## Advanced: Image Transformations

Once the CDN is working, you can use on-the-fly transformations:

```typescript
import { getCdnUrl } from './utils/imageUrl';

// Generate thumbnail
const thumbnailUrl = getCdnUrl(originalUrl, {
  width: 400,
  quality: 85,
  format: 'webp'
});

// Generate different sizes for responsive images
const smallUrl = getCdnUrl(originalUrl, { width: 400, format: 'webp' });
const mediumUrl = getCdnUrl(originalUrl, { width: 800, format: 'webp' });
const largeUrl = getCdnUrl(originalUrl, { width: 1200, format: 'webp' });
```

**Note**: Image Resizing requires enabling Cloudflare Image Resizing ($5-10/month) in Dashboard > Speed > Optimization.

---

## Support & Next Steps

### If you need help:
1. Check Cloudflare Worker logs: Dashboard > Workers & Pages > trefa-image-proxy > Logs
2. Check Cloud Run logs: `gcloud run logs tail app-staging --region=us-central1`
3. Verify environment variables are set correctly

### Future optimizations:
1. Enable Cloudflare Image Resizing for automatic format conversion
2. Implement lazy loading for below-the-fold images
3. Add service worker for offline caching
4. Migrate high-resolution originals to R2, keep optimized versions on CDN
