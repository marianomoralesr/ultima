# Cloudflare Workers Setup for Image Optimization

This directory contains Cloudflare Workers to reduce Supabase egress costs and improve image delivery performance.

## Overview

The image proxy worker intercepts all image requests and:
- Caches images at Cloudflare's edge (reduces Supabase egress by 70-90%)
- Automatically serves WebP format to supported browsers
- Supports on-the-fly image resizing
- Sets aggressive caching headers

## Setup Instructions

### 1. Install Wrangler CLI

```bash
npm install -g wrangler
```

### 2. Login to Cloudflare

```bash
wrangler login
```

### 3. Update Configuration

Edit `wrangler.toml` and add your Cloudflare account ID:

```toml
account_id = "your-account-id-here"
```

You can find your account ID at: https://dash.cloudflare.com/ (in the URL or Account Home)

### 4. Deploy the Worker

```bash
cd cloudflare-workers
wrangler deploy
```

### 5. Configure Custom Domain

1. Go to Cloudflare Dashboard > Workers & Pages > trefa-image-proxy
2. Click "Triggers" tab
3. Add Custom Domain: `images.trefa.mx` (or your preferred subdomain)
4. Cloudflare will automatically create DNS records

Alternative: Add a route in `wrangler.toml`:
```toml
routes = [
  { pattern = "images.trefa.mx/*", zone_name = "trefa.mx" }
]
```

### 6. Enable Cloudflare Image Resizing (Optional but Recommended)

For advanced image optimization features:

1. Go to Cloudflare Dashboard > Speed > Optimization
2. Enable "Image Resizing"
3. This adds support for:
   - WebP/AVIF conversion
   - On-the-fly resizing
   - Quality optimization

**Cost**: ~$5-10/month for 10,000-50,000 images/month

## Usage

Once deployed, replace Supabase image URLs:

**Before:**
```
https://jjepfehmuybpctdzipnu.supabase.co/storage/v1/object/public/fotos_airtable/app/suv.png
```

**After:**
```
https://images.trefa.mx/fotos_airtable/app/suv.png
```

### With Transformations

Add query parameters for on-the-fly transformations:

```
https://images.trefa.mx/fotos_airtable/app/suv.png?w=800&q=85&f=webp
```

Parameters:
- `w` - Width in pixels
- `h` - Height in pixels
- `q` - Quality (1-100, default: 85)
- `f` - Format (webp, avif, jpeg, png, auto)

## Testing

Test the worker:

```bash
# Health check
curl https://images.trefa.mx/health

# Fetch an image
curl -I https://images.trefa.mx/fotos_airtable/app/suv-2Artboard-12-trefa.png

# Check cache status (should be MISS first time, HIT second time)
curl -I https://images.trefa.mx/fotos_airtable/app/suv-2Artboard-12-trefa.png | grep X-Cache-Status
```

## Monitoring

View analytics in Cloudflare Dashboard:
1. Workers & Pages > trefa-image-proxy
2. Metrics tab shows:
   - Requests per second
   - Cache hit ratio
   - Bandwidth saved

## Expected Results

After deployment with all traffic migrated:

- **Supabase Egress**: 70-90% reduction (90-270 GB saved)
- **Page Load Speed**: 30-50% faster image loading
- **Cost Savings**: ~$150-300/month
- **Cache Hit Ratio**: 85-95% after 24 hours

## Troubleshooting

### Worker not receiving traffic
- Verify DNS records are correct
- Check route configuration in wrangler.toml
- Ensure SSL/TLS is set to "Full" in Cloudflare

### Images not caching
- Check cache headers with `curl -I`
- Verify worker logs in Cloudflare Dashboard
- Ensure images are served with correct content-type

### Image transformations not working
- Verify Image Resizing is enabled in Cloudflare
- Check account plan supports Image Resizing
- Review worker logs for errors

## Next Steps

After this worker is deployed and working:

1. Update frontend to use `images.trefa.mx` domain
2. Set up Cloudflare R2 for new image uploads
3. Gradually migrate existing images from Supabase to R2
