# Fix R2 Credentials - 403 SignatureDoesNotMatch Error

## 🚨 Problem Identified

The R2 API is returning a **403 Forbidden** error with message:
```
SignatureDoesNotMatch: The request signature we calculated does not match
the signature you provided. Check your secret access key and signing method.
```

**Root Cause:** The R2 API credentials stored in Supabase are **INVALID or INCORRECT**.

This is blocking the entire Airtable automation from working.

---

## ✅ Solution: Regenerate R2 API Credentials

Follow these steps to create new, valid R2 API credentials:

### Step 1: Access Cloudflare R2 Dashboard

1. Go to: **https://dash.cloudflare.com/**
2. Log in to your Cloudflare account
3. In the left sidebar, click **R2**
4. You should see your `trefa-images` bucket

### Step 2: Navigate to API Tokens

1. Click on **Manage R2 API Tokens** (usually in the right sidebar)
   - OR go to: **R2 → Settings → API Tokens**
2. You'll see a list of existing API tokens (if any)

### Step 3: Create New API Token

1. Click **Create API Token** button
2. **Token Name:** Enter a descriptive name, e.g., `trefa-airtable-automation`
3. **Permissions:** Select **Object Read & Write**
4. **Specific Bucket** (Recommended): Select `trefa-images` only
   - This limits the token to just this bucket for security
5. **TTL (Time to Live):** Leave as default (no expiration) or set to 1 year
6. Click **Create API Token**

### Step 4: COPY THE CREDENTIALS IMMEDIATELY

⚠️ **CRITICAL:** You'll only see these credentials ONCE. Copy them immediately!

You'll see two values:

```
Access Key ID: [20-character string]
Secret Access Key: [40-character string]
```

**Copy both values to a secure location** (password manager, secure note, etc.)

### Step 5: Update Supabase Secrets

Now we need to replace the old invalid credentials with the new ones:

```bash
# Set the new Access Key ID
supabase secrets set CLOUDFLARE_R2_ACCESS_KEY_ID=<paste-new-access-key-id-here>

# Set the new Secret Access Key
supabase secrets set CLOUDFLARE_R2_SECRET_ACCESS_KEY=<paste-new-secret-key-here>

# Account ID should still be the same, but verify it matches:
# Account ID: a5de5a4fb11ab70d53e850749ece3cf7
```

**Example:**
```bash
supabase secrets set CLOUDFLARE_R2_ACCESS_KEY_ID=1234567890abcdefghij
supabase secrets set CLOUDFLARE_R2_SECRET_ACCESS_KEY=abcdef1234567890abcdef1234567890abcdef12
```

### Step 6: Verify Secrets Are Set

```bash
supabase secrets list
```

You should see:
```
CLOUDFLARE_ACCOUNT_ID
CLOUDFLARE_R2_ACCESS_KEY_ID
CLOUDFLARE_R2_SECRET_ACCESS_KEY
```

### Step 7: Redeploy Edge Functions

The Edge Functions need to be redeployed to pick up the new credentials:

```bash
supabase functions deploy r2-list
supabase functions deploy r2-upload
```

Wait for both deployments to complete (should take 10-20 seconds each).

### Step 8: Test the Fix

Test the r2-list function with a simple curl command:

```bash
curl -X POST "https://jjepfehmuybpctdzipnu.supabase.co/functions/v1/r2-list" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqZXBmZWhtdXlicGN0ZHppcG51Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDE5OTYwMywiZXhwIjoyMDU5Nzc1NjAzfQ.KwSFEXOrtgwgIjMVG-czB73VWQIVDahgDvTdyL5qSQo" \
  -H "Content-Type: application/json" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqZXBmZWhtdXlicGN0ZHppcG51Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDE5OTYwMywiZXhwIjoyMDU5Nzc1NjAzfQ.KwSFEXOrtgwgIjMVG-czB73VWQIVDahgDvTdyL5qSQo" \
  -d '{"prefix":"airtable/"}'
```

**Expected Success Response:**
```json
[
  {
    "key": "airtable/rec123/feature_image/image1.jpg",
    "size": 245678,
    "lastModified": "2025-10-26T12:34:56.000Z"
  }
]
```

Or an empty array `[]` if no files exist yet (which is fine).

**If you still get 403 error:**
- Double-check you copied the credentials correctly (no extra spaces)
- Verify the token has "Object Read & Write" permissions
- Verify the token is for the correct bucket (`trefa-images`)
- Wait 1-2 minutes for Cloudflare propagation

---

## 🔒 Optional: Revoke Old API Token

For security, you should revoke the old invalid API token:

1. Go back to Cloudflare Dashboard → R2 → API Tokens
2. Find the old token (if visible)
3. Click the **...** menu → **Revoke**
4. Confirm revocation

This prevents the old invalid credentials from being used.

---

## 📋 Checklist

- [ ] Created new R2 API token in Cloudflare
- [ ] Copied Access Key ID and Secret Access Key
- [ ] Updated Supabase secrets with new credentials
- [ ] Verified secrets are set (`supabase secrets list`)
- [ ] Redeployed r2-list Edge Function
- [ ] Redeployed r2-upload Edge Function
- [ ] Tested r2-list function (got success response or empty array)
- [ ] Tested Airtable automation with a test vehicle record
- [ ] (Optional) Revoked old API token for security

---

## 🎯 After Credentials Are Fixed

Once the credentials are working, the full automation flow will be:

1. ✅ Upload image to Airtable attachment field
2. ✅ Automation triggers
3. ✅ r2-list checks if files already exist
4. ✅ r2-upload uploads new files to R2
5. ✅ Public URLs saved back to Airtable
6. ✅ Images served from R2 with zero egress costs

---

## 🆘 Still Having Issues?

If you continue to get errors after regenerating credentials:

1. **Check Cloudflare R2 Dashboard** to verify the bucket exists and is accessible
2. **Check API Token Permissions** - must be "Object Read & Write"
3. **Check CORS Policy** is still configured correctly (from `R2_CORS_CONFIG.json`)
4. **Check Supabase Function Logs**:
   ```bash
   supabase functions logs r2-list --limit 50
   ```

---

## 💡 Why This Happened

Possible reasons the credentials became invalid:

1. Token was revoked in Cloudflare
2. Token expired (if TTL was set)
3. Credentials were copied incorrectly initially (extra spaces, line breaks)
4. Token permissions were changed
5. Bucket name was changed

The new credentials will fix any of these issues.
