# Quick Setup Guide - Airtable R2 Automation

## 🚨 Critical: Fix the 500 Error

The "R2 list returned 500" error is most likely due to **missing CORS policy** on your R2 bucket.

### Step 1: Configure CORS (REQUIRED)

1. **Go to**: https://dash.cloudflare.com/
2. **Navigate to**: R2 → `trefa-images` bucket
3. **Click**: Settings tab
4. **Scroll to**: CORS Policy section
5. **Paste this JSON**:

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
    "AllowedMethods": ["GET", "HEAD", "PUT", "POST", "DELETE"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag", "Content-Length", "Content-Type"],
    "MaxAgeSeconds": 3600
  }
]
```

6. **Save** and **wait 2 minutes**

---

### Step 2: Verify Environment Variables (DONE ✅)

These are already set:
- ✅ `CLOUDFLARE_ACCOUNT_ID`
- ✅ `CLOUDFLARE_R2_ACCESS_KEY_ID`
- ✅ `CLOUDFLARE_R2_SECRET_ACCESS_KEY`

---

### Step 3: Update Airtable Script

1. Open Airtable → Inventario base → Automations
2. Find your image upload automation
3. Replace the script with contents from:
   - **`airtable-image-upload-optimized.js`**
4. Make sure input variable is set to `recordId`

---

### Step 4: Test

1. Select a test vehicle in Airtable
2. Upload a single test image
3. Watch the automation logs
4. Should see: ✅ "Uploaded to R2: [filename]"
5. No more 500 errors!

---

## 📋 Checklist

- [ ] CORS policy set in Cloudflare R2
- [ ] Wait 2 minutes for CORS to propagate
- [ ] Airtable script updated to v2.0.0
- [ ] Test with single vehicle record
- [ ] Verify image URLs saved in Airtable
- [ ] Test image loads from URL

---

## 🆘 Still Getting 500 Error?

### Check #1: CORS Applied?
Wait the full 2 minutes after saving CORS config.

### Check #2: Credentials Valid?
Go to Cloudflare → R2 → Settings → API Tokens
Verify the Access Key ID matches what's in Supabase secrets.

### Check #3: Bucket Name Correct?
Bucket must be named exactly: `trefa-images`

---

## 📞 Need Help?

See the full guide: `SETUP_GUIDE.md`

Or contact support with these details:
- Error message from Airtable logs
- Timestamp of failed run
- Record ID being processed
