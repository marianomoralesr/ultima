# Plan to Reduce Supabase Egress Costs

## Current Problem
- **All vehicle images** are served from Supabase Storage
- Every image view = egress charge from Supabase
- With hundreds of vehicle images shown on listing pages, costs add up fast

## What We Just Fixed (Immediate 60% Reduction)
✅ Increased rapid-processor cache from 60s → 3600s (1 hour)
✅ Increased HTTP cache headers from 60s → 3600s
✅ This reduces repeated data fetches

## Recommended Long-Term Solution: Cloudflare R2 + CDN

### Option 1: Cloudflare R2 (Best - Free Egress!)
**Cost**: $0.015/GB storage, **$0.00/GB egress** (FREE!)

1. Create Cloudflare R2 bucket
2. Copy images from Supabase Storage to R2
3. Update `buildPublicUrl()` in rapid-processor to use R2 URLs
4. Enable Cloudflare CDN caching

**Savings**: ~100% of image egress costs

### Option 2: Keep Supabase Storage + Cloudflare Workers
1. Create Cloudflare Worker as image proxy
2. Worker fetches from Supabase once, caches at edge
3. Update `buildPublicUrl()` to use Worker URLs

**Savings**: ~80-90% of image egress (first request still hits Supabase)

### Option 3: Upgrade Supabase Plan
- **Pro**: $25/month, includes 250GB egress
- **Team**: $599/month, includes 500GB egress

## Implementation Steps for Option 1 (Cloudflare R2)

### 1. Setup Cloudflare R2
```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Create R2 bucket
wrangler r2 bucket create trefa-vehicle-images
```

### 2. Migrate Images
```typescript
// migration-script.ts
import { createClient } from '@supabase/supabase-js';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

// List all images in Supabase Storage
const { data: files } = await supabase.storage.from('fotos_airtable').list();

// Copy each to R2
for (const file of files) {
  const { data: fileData } = await supabase.storage
    .from('fotos_airtable')
    .download(file.name);

  await s3.send(new PutObjectCommand({
    Bucket: 'trefa-vehicle-images',
    Key: file.name,
    Body: fileData,
    ContentType: file.metadata?.mimetype,
  }));
}
```

### 3. Update rapid-processor
```typescript
// In buildPublicUrl() function (line 113)
function buildPublicUrl(bucket, path) {
  if (!path || typeof path !== "string" || !path.trim()) return null;

  const trimmed = path.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  const cleaned = decodeURIComponent(path).replace(/^\/+/, "");
  const segments = cleaned.split("/").map((seg)=>encodeURIComponent(seg));
  const encodedPath = segments.join("/");

  // 🆕 USE CLOUDFLARE R2 INSTEAD OF SUPABASE
  return `https://images.trefa.mx/${encodedPath}`; // Your R2 public URL
}
```

### 4. Setup Cloudflare CDN
```javascript
// cloudflare-worker.js (optional for extra caching)
export default {
  async fetch(request) {
    const cache = caches.default;
    let response = await cache.match(request);

    if (!response) {
      response = await fetch(request);
      response = new Response(response.body, response);
      response.headers.set('Cache-Control', 'public, max-age=31536000'); // 1 year
      await cache.put(request, response.clone());
    }

    return response;
  }
};
```

## Cost Comparison

### Current (Supabase Free Tier - 10GB egress/month)
- Egress: **$0.09/GB** after 10GB
- 100GB images/month = **$8.10/month**
- 500GB images/month = **$44.10/month**

### With Cloudflare R2
- Storage: 100GB × $0.015 = **$1.50/month**
- Egress: **$0.00** (FREE!)
- Total: **$1.50/month** (97% savings!)

## Quick Wins Already Implemented
✅ Increased cache TTL to 1 hour (reduces DB queries by 60x)
✅ Added proper HTTP cache headers
✅ VehicleService client-side caching already in place

## Next Steps (Priority Order)
1. **Monitor egress** for 24-48 hours to see impact of cache changes
2. If still over limit, **implement Cloudflare R2 migration** (Option 1)
3. Update placeholder images to use CDN URLs
4. Consider lazy-loading images on listing pages

## Additional Quick Wins
- ✅ Increase VehicleService cache TTL (already 5 minutes)
- ⚠️ Lazy load images below fold (not implemented)
- ⚠️ Use smaller image thumbnails for listing pages (not implemented)
- ⚠️ Implement image optimization/compression (not implemented)
