# Airtable Script R2 Migration Guide

## Overview
This guide explains how to migrate your Airtable image upload script from Supabase Storage to Cloudflare R2 for zero egress costs.

## Current Situation
Your existing Airtable script uploads images directly to Supabase Storage, which contributes to the high egress costs you're experiencing.

## New Approach
The updated script tries to upload to Cloudflare R2 first, with automatic fallback to Supabase Storage if R2 fails. This ensures reliability while maximizing cost savings.

## Architecture

```
┌─────────────┐
│   Airtable  │
│   Script    │
└──────┬──────┘
       │
       ├──── Try R2 First ────┐
       │                      │
       │                 ┌────▼────┐
       │                 │ Supabase│
       │                 │  Edge   │
       │                 │Function │
       │                 └────┬────┘
       │                      │
       │                 ┌────▼────┐
       │                 │   R2    │
       │                 │ Storage │
       │                 └─────────┘
       │
       └─ Fallback ──────┐
                         │
                    ┌────▼────┐
                    │Supabase │
                    │ Storage │
                    └─────────┘
```

## Why Use Edge Functions?

Airtable scripts don't have access to crypto libraries needed to sign AWS S3 requests. Instead of exposing R2 credentials in the Airtable script, we use Supabase Edge Functions as a secure proxy:

1. **Airtable script** calls Supabase Edge Function with file URL
2. **Edge function** downloads the file and uploads to R2 using secure credentials
3. **Edge function** returns the R2 public URL
4. **Airtable script** saves the URL to the record

## Setup Steps

### Step 1: Deploy Supabase Edge Functions

The edge functions are already created in `supabase/functions/`:
- `r2-upload/index.ts` - Uploads files to R2
- `r2-list/index.ts` - Lists files in R2

Deploy them using Supabase CLI:

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref jjepfehmuybpctdzipnu

# Deploy the edge functions
supabase functions deploy r2-upload
supabase functions deploy r2-list

# Set environment variables for the functions
supabase secrets set CLOUDFLARE_ACCOUNT_ID=a5de5a4fb11ab70d53e850749ece3cf7
supabase secrets set CLOUDFLARE_R2_ACCESS_KEY_ID=2ed1b8cb268295b971d8dcd1daf5500c
supabase secrets set CLOUDFLARE_R2_SECRET_ACCESS_KEY=d269b7eecc3208c0220d2085862078c348b14ee03bb52291599250492a861d37
```

### Step 2: Update Your Airtable Script

1. Go to your Airtable base
2. Open the Automation that runs the upload script
3. Replace the existing script with the contents of `airtable-upload-to-r2.js`
4. Save and test with a single record

### Step 3: Test the Migration

1. Select a test record in your Inventario table
2. Run the automation manually
3. Check the console output:
   - Look for "📤 Uploading to R2..." messages
   - Verify "✅ Uploaded to R2:" with R2 URL
   - If R2 fails, should see "⚠️ Falling back to Supabase Storage..."

### Step 4: Verify R2 Storage

1. Go to Cloudflare Dashboard: https://dash.cloudflare.com
2. Navigate to R2 → trefa-images bucket
3. Look for folder structure: `airtable/{recordId}/{prefix}/`
4. Verify files are present

## File Structure in R2

Images will be organized as:
```
trefa-images/
└── airtable/
    └── {recordId}/
        ├── feature_image/
        │   └── image1.jpg
        ├── fotos_exterior/
        │   ├── exterior1.jpg
        │   └── exterior2.jpg
        └── fotos_interior/
            ├── interior1.jpg
            └── interior2.jpg
```

## URL Format

- **R2 URLs**: `https://a5de5a4fb11ab70d53e850749ece3cf7.r2.cloudflarestorage.com/trefa-images/airtable/{recordId}/{prefix}/{filename}`
- **Supabase URLs**: `https://jjepfehmuybpctdzipnu.supabase.co/storage/v1/object/public/fotos_airtable/{recordId}/{prefix}/{filename}`

Both URLs will work through the Cloudflare CDN you've already deployed at `images.trefa.mx`.

## Behavior

The script intelligently handles uploads:

1. **Check if files already exist** (in R2 or Supabase)
   - If yes: Skip upload, use existing URLs
   - If no: Proceed to upload

2. **Try R2 upload first**
   - Calls `/functions/v1/r2-upload` edge function
   - If successful: Use R2 URL
   - If fails: Log error and fallback

3. **Fallback to Supabase Storage**
   - Upload directly to Supabase (original method)
   - Use Supabase URL

4. **Update Airtable record**
   - Save URLs to respective URL fields
   - Join multiple URLs with ", "

## Cost Impact

- **Before**: All Airtable uploads → Supabase → High egress when images are served
- **After**: All Airtable uploads → R2 → ZERO egress when images are served

Combined with the Cloudflare CDN already deployed, this should reduce your Supabase egress by **90-95%**.

## Monitoring

Monitor the script execution in Airtable:
- ✅ `✅ Uploaded to R2:` - Success, zero egress costs
- ⚠️ `⚠️ Falling back to Supabase Storage...` - R2 failed, using Supabase
- ❌ Any error messages - Check edge function logs

Check edge function logs:
```bash
supabase functions logs r2-upload
```

## Troubleshooting

### Edge Function Not Found
- Verify deployment: `supabase functions list`
- Redeploy if needed: `supabase functions deploy r2-upload`

### Authentication Error
- Verify service role key is correct
- Check edge function has correct secrets set

### R2 Upload Fails
- Check R2 credentials are correct
- Verify R2 bucket `trefa-images` exists
- Check Cloudflare R2 dashboard for errors

### Files Not Appearing in R2
- Check edge function logs for errors
- Verify Airtable can reach Supabase edge functions
- Test edge function directly with curl

## Files Modified

1. **airtable-upload-to-r2.js** - Updated Airtable script with R2 support
2. **supabase/functions/r2-upload/index.ts** - New edge function for R2 uploads
3. **supabase/functions/r2-list/index.ts** - New edge function for listing R2 files

## Next Steps

After confirming the Airtable script works:
1. Monitor R2 usage in Cloudflare dashboard
2. Gradually migrate existing Supabase images to R2 (optional)
3. Track Supabase egress reduction over time
4. Consider setting up R2 custom domain (r2.trefa.mx) for cleaner URLs
