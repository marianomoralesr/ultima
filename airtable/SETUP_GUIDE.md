# Airtable → R2 Image Upload Automation Setup Guide

## Overview

This automation uploads vehicle images from Airtable to Cloudflare R2 storage (with Supabase fallback) via Supabase Edge Functions.

**Version:** 2.0.0
**Date:** 2025-10-26
**Author:** Optimized by Claude Code

---

## Prerequisites

- ✅ Supabase project with Edge Functions enabled
- ✅ Cloudflare R2 bucket created (`trefa-images`)
- ✅ Airtable base with `Inventario` table
- ✅ R2 credentials (Account ID, Access Key, Secret Key)

---

## 🔧 Setup Instructions

### Step 1: Configure Supabase Environment Variables

The Edge Functions (`r2-upload` and `r2-list`) require environment variables to be set in Supabase.

#### Option A: Via Supabase Dashboard (Recommended)

1. Go to: https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu/settings/functions
2. Click **"Add secret"**
3. Add each of these environment variables:

```
CLOUDFLARE_ACCOUNT_ID=a5de5a4fb11ab70d53e850749ece3cf7
CLOUDFLARE_R2_ACCESS_KEY_ID=2ed1b8cb268295b971d8dcd1daf5500c
CLOUDFLARE_R2_SECRET_ACCESS_KEY=d269b7eecc3208c0220d2085862078c348b14ee03bb52291599250492a861d37
```

4. **Save** the changes

#### Option B: Via Supabase CLI

```bash
supabase secrets set CLOUDFLARE_ACCOUNT_ID=a5de5a4fb11ab70d53e850749ece3cf7
supabase secrets set CLOUDFLARE_R2_ACCESS_KEY_ID=2ed1b8cb268295b971d8dcd1daf5500c
supabase secrets set CLOUDFLARE_R2_SECRET_ACCESS_KEY=d269b7eecc3208c0220d2085862078c348b14ee03bb52291599250492a861d37
```

### Step 2: Configure R2 Bucket CORS Policy

**IMPORTANT:** The R2 bucket needs CORS configured to allow access from Supabase Edge Functions and Airtable.

1. Go to Cloudflare Dashboard: https://dash.cloudflare.com/
2. Select **R2** → **trefa-images** bucket
3. Click **Settings** tab
4. Scroll to **CORS Policy** section
5. Click **Add CORS rule** or **Edit**
6. Paste the following JSON (or copy from `R2_CORS_CONFIG.json`):

```json
[
  {
    "AllowedOrigins": [
      "https://trefa.mx",
      "https://www.trefa.mx",
      "https://jjepfehmuybpctdzipnu.supabase.co",
      "https://airtable.com",
      "https://*.airtable.com"
    ],
    "AllowedMethods": [
      "GET",
      "HEAD",
      "PUT",
      "POST",
      "DELETE"
    ],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": [
      "ETag",
      "Content-Length",
      "Content-Type",
      "x-amz-request-id",
      "x-amz-meta-*"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

7. **Save** and wait 1-2 minutes for propagation

**Note:** Without CORS configured, you'll get 500 errors when trying to list or upload files.

### Step 3: Verify Edge Functions Are Deployed

Check that both Edge Functions are active:

```bash
supabase functions list
```

You should see:
- ✅ `r2-upload` - STATUS: ACTIVE
- ✅ `r2-list` - STATUS: ACTIVE

If not deployed, deploy them:

```bash
supabase functions deploy r2-upload
supabase functions deploy r2-list
```

### Step 3: Set Up Airtable Automation

1. **Open your Airtable base** (Inventario table)

2. **Create a new Automation:**
   - Trigger: "When record matches conditions"
   - Condition: When any of these fields are updated:
     - `Foto`
     - `fotos_exterior_archivos`
     - `fotos_interior_archivos`

3. **Add Action: "Run script"**
   - Copy the entire contents of `airtable-image-upload-optimized.js`
   - Paste into the script editor

4. **Configure Script Input:**
   - Variable name: `recordId`
   - Value: Record ID from trigger

5. **Test the automation** with a single test record first!

---

## 🎯 How It Works

### Architecture Flow

```
┌─────────────┐
│  Airtable   │
│  Automation │
└──────┬──────┘
       │ Triggers on image field update
       ▼
┌─────────────────────────────────────┐
│  Airtable Script                    │
│  (airtable-image-upload-optimized)  │
└──────┬──────────────────────────┬───┘
       │                          │
       │ 1. Check if files exist  │
       ▼                          │
┌─────────────────┐               │
│  r2-list        │               │
│  Edge Function  │               │
└─────────────────┘               │
       │                          │
       │ 2. Upload new files      │
       ▼                          │
┌─────────────────┐               │
│  r2-upload      │               │
│  Edge Function  │               │
└──────┬──────────┘               │
       │                          │
       │ 3. If R2 fails           │
       ▼                          │
┌─────────────────┐               │
│  Supabase       │◄──────────────┘
│  Storage        │  Fallback
└─────────────────┘
```

### Upload Strategy

1. **Check for existing files** in R2 first
2. **If found**, use existing URLs (skip upload)
3. **If not found**, upload to R2 with retry logic (3 attempts)
4. **If R2 fails**, fallback to Supabase Storage
5. **Update Airtable** with public URLs

### Field Mappings

| Airtable Source Field        | Storage Prefix      | Airtable URL Field      |
|------------------------------|---------------------|-------------------------|
| `Foto`                       | `feature_image`     | `feature_image`         |
| `fotos_exterior_archivos`    | `fotos_exterior`    | `fotos_exterior_url`    |
| `fotos_interior_archivos`    | `fotos_interior`    | `fotos_interior_url`    |

---

## 🧪 Testing Checklist

### Pre-flight Checks

- [ ] Environment variables set in Supabase
- [ ] Edge Functions deployed and active
- [ ] Airtable automation created
- [ ] Script pasted and saved

### Test Procedure

1. **Select a test vehicle record** in Airtable
2. **Upload a single test image** to the `Foto` field
3. **Watch the automation run** in Airtable automation history
4. **Check the logs** for:
   ```
   🚀 Airtable → R2 Image Upload Script v2.0.0
   📋 Processing record: [record-id]
   📤 Uploading [filename]...
   ✅ Uploaded to R2: [filename]
   ✅ Airtable updated successfully
   ```
5. **Verify the URL** is saved in the `feature_image` field
6. **Test the URL** in your browser to confirm the image loads

### Success Criteria

- ✅ Automation completes without errors
- ✅ Image URL is saved to Airtable
- ✅ Image loads from the URL
- ✅ Execution time < 30 seconds

---

## 📊 Monitoring & Troubleshooting

### Common Issues

#### 1. "R2 list returned 500"

**Cause 1:** Environment variables not set in Supabase

**Fix:**
1. Go to Supabase dashboard → Edge Functions → Settings
2. Verify all 3 environment variables are set
3. Redeploy the functions: `supabase functions deploy r2-list`

**Cause 2:** CORS policy not configured on R2 bucket (most common)

**Fix:**
1. Go to Cloudflare Dashboard → R2 → trefa-images → Settings
2. Add CORS policy using `R2_CORS_CONFIG.json`
3. Wait 1-2 minutes for propagation
4. Test again

**Cause 3:** Invalid R2 credentials

**Fix:**
1. Verify credentials in Cloudflare Dashboard
2. Generate new API token if needed
3. Update Supabase secrets
4. Redeploy functions

#### 2. "No recordId provided"

**Cause:** Automation trigger not configured correctly

**Fix:**
1. Edit automation in Airtable
2. Ensure "Run script" action has input variable `recordId`
3. Map it to the Record ID from the trigger

#### 3. "File too large"

**Cause:** Image exceeds 10MB limit

**Fix:**
- Compress images before uploading to Airtable
- Or increase `MAX_FILE_SIZE_MB` in the script

#### 4. "Invalid type"

**Cause:** Unsupported file format

**Fix:**
- Only upload: JPEG, JPG, PNG, WEBP
- Or add more types to `ALLOWED_TYPES` array

### Viewing Logs

**In Airtable:**
1. Go to Automations
2. Click on your automation
3. View "Run history"
4. Click on a run to see detailed logs

**In Supabase (Edge Function logs):**
```bash
# Via Supabase Dashboard
https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu/logs/edge-functions

# Via CLI (requires setup)
supabase functions logs r2-upload
```

---

## 🔒 Security Notes

### Credentials Management

- ✅ **DO NOT** hardcode R2 credentials in Airtable scripts
- ✅ **DO** store credentials as Supabase environment variables
- ✅ **DO** use service role key only in server-side code
- ✅ **DO** rotate keys periodically

### Current Setup

- Supabase Service Role Key: Stored in Airtable script (acceptable - limited scope)
- R2 Credentials: Stored as Supabase secrets (secure)
- Public URLs: Anyone with URL can access images (by design)

---

## 📈 Performance Optimization

### Current Features

- ✅ **Retry logic**: 3 attempts with exponential backoff
- ✅ **File deduplication**: Checks for existing files before upload
- ✅ **File validation**: Size and type checks
- ✅ **Fallback storage**: Supabase as backup
- ✅ **Batch efficiency**: Processes all 3 image fields in one run

### Expected Performance

| Metric                    | Value          |
|---------------------------|----------------|
| Single image upload       | ~2-5 seconds   |
| 3-field update (10 images)| ~15-30 seconds |
| Max file size             | 10 MB          |
| Max retries               | 3 per file     |
| Concurrent uploads        | Sequential     |

### Optimization Tips

1. **Compress images** before uploading to Airtable
2. **Use WebP format** for smaller file sizes
3. **Batch process** multiple records during off-peak hours
4. **Monitor automation runs** to catch issues early

---

## 🚀 Deployment Workflow

### For New Vehicles

1. Add vehicle record to Airtable
2. Upload images to attachment fields
3. Automation triggers automatically
4. Images sync to R2 within 30 seconds
5. URLs populate in Airtable

### For Updating Images

1. Edit existing vehicle record
2. Add/remove images from attachment fields
3. Automation re-runs
4. Checks for existing files (skips duplicates)
5. Uploads only new images
6. Updates URLs

### Bulk Re-sync (if needed)

If you need to re-upload all images:

1. **DO NOT** use automation for bulk operations
2. Instead, create a **separate batch script**
3. Process records in small batches (10-20 at a time)
4. Add delays between batches to avoid rate limits

---

## 📞 Support

### Resources

- Airtable Automation Docs: https://support.airtable.com/docs/getting-started-with-airtable-automations
- Supabase Edge Functions: https://supabase.com/docs/guides/functions
- Cloudflare R2 Docs: https://developers.cloudflare.com/r2/

### Maintenance

- **Weekly**: Check automation success rate in Airtable
- **Monthly**: Review R2 storage usage
- **Quarterly**: Rotate R2 access keys

---

## ✅ Quick Reference

### Supabase URLs

- **Dashboard**: https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu
- **Edge Functions**: https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu/functions
- **Storage**: https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu/storage/buckets

### Edge Function Endpoints

```
POST https://jjepfehmuybpctdzipnu.supabase.co/functions/v1/r2-upload
POST https://jjepfehmuybpctdzipnu.supabase.co/functions/v1/r2-list
```

### R2 Storage

- **Bucket**: `trefa-images`
- **Public URL**: `https://a5de5a4fb11ab70d53e850749ece3cf7.r2.cloudflarestorage.com/trefa-images/`
- **Path Pattern**: `airtable/{recordId}/{prefix}/{filename}`

### Supabase Storage (Fallback)

- **Bucket**: `fotos_airtable`
- **Public URL**: `https://jjepfehmuybpctdzipnu.supabase.co/storage/v1/object/public/fotos_airtable/`
- **Path Pattern**: `{recordId}/{prefix}/{filename}`

---

## 🎉 You're All Set!

Once you've completed the setup steps and tested successfully, your automation will:

1. ✅ Automatically sync images to R2
2. ✅ Handle retries and errors gracefully
3. ✅ Fallback to Supabase if R2 fails
4. ✅ Update Airtable with public URLs
5. ✅ Provide detailed logs for monitoring

**Happy automating! 🚀**
