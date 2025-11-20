# Zero-Downtime Security Migration Plan
**Date:** 2025-11-20
**Branch:** `security/remove-hardcoded-credentials-backup`
**Status:** 🟢 READY FOR EXECUTION

---

## 🎯 Objective

Migrate from hardcoded credentials to secure environment variable management with **ZERO downtime** and **NO service interruption**.

---

## ✅ Phase 1: Code Hardening (COMPLETED)

### Changes Made:
- ✅ Removed all hardcoded passwords from shell scripts
- ✅ Removed all hardcoded API keys from `src/pages/config.ts`
- ✅ Removed hardcoded Airtable key from Edge Function
- ✅ Added environment variable validation with clear error messages
- ✅ Created comprehensive `.env.example` templates
- ✅ Added `scripts/db-config.sh` helper
- ✅ Updated `.gitignore` to protect secrets
- ✅ Committed and pushed to remote backup branch

### Commit:
```
commit b8d91b4
security: Remove all hardcoded credentials and implement env var validation
```

---

## 🔄 Phase 2: Local Testing (NEXT STEP)

### Prerequisites:
1. Ensure `.env.local` exists with all required variables
2. Ensure `scripts/.env` exists with `DB_PASSWORD`

### Testing Checklist:

#### Frontend Testing:
```bash
# 1. Verify environment variables are loaded
npm run dev

# Expected: App starts without errors
# If it fails, check console for missing env var messages
```

#### Database Scripts Testing:
```bash
# 2. Test database connection
export DB_PASSWORD="your-current-password"
./scripts/check-policies.sh

# Expected: Successfully connects and shows RLS policies
```

#### Edge Functions Testing:
```bash
# 3. Verify Supabase secrets are set
supabase secrets list

# Expected: Should show AIRTABLE_VALUATION_API_KEY and others
```

### Success Criteria:
- [ ] Frontend builds and runs without errors
- [ ] Database scripts connect successfully
- [ ] No hardcoded credentials in use
- [ ] All services function normally with env vars

---

## 🚀 Phase 3: Staging Deployment (AFTER LOCAL TESTING)

### Step 1: Deploy Code (Old Keys Still Work)

```bash
# Deploy to staging with current credentials
./docs/deployment/deploy.sh staging
```

**IMPORTANT:** At this point, the app will use:
- Old Airtable keys (from environment)
- Old Intelimotor keys (from environment)
- Old database password (from environment)
- Old CarStudio key (from environment)

### Step 2: Verify Staging Works

Test these critical flows:
- [ ] User can submit vehicle valuation
- [ ] Valuation emails are sent
- [ ] Admin dashboard loads
- [ ] Database queries work
- [ ] Image uploads work (R2)

### Step 3: Monitor Logs

```bash
# Check Cloud Run logs
gcloud run services logs read your-staging-service --limit=50

# Check Edge Function logs
supabase functions logs automated-email-notifications
```

---

## 🔑 Phase 4: Credential Rotation

### 4.1 Generate New Credentials

#### Airtable:
1. Go to https://airtable.com/account
2. **Personal access tokens** section
3. **Create new token** with same permissions as old one
4. **Copy new token** (starts with `pat`)
5. **DO NOT REVOKE OLD TOKEN YET**

#### Intelimotor:
1. Contact Intelimotor support
2. Request new API credentials
3. Keep old credentials active for now

#### CarStudio:
1. Log into CarStudio dashboard
2. Generate new API key
3. Keep old key active

#### Database Password:
1. Go to Supabase Dashboard
2. Project Settings → Database
3. **Reset database password**
4. **Copy new password immediately**
5. **IMPORTANT:** Old password will still work for 24 hours

#### Brevo:
1. Go to https://app.brevo.com/settings/keys/api
2. Create new API key
3. Keep old key active

#### Cloudflare R2:
1. Cloudflare Dashboard → R2
2. Manage R2 API Tokens
3. Create new access key pair
4. Keep old keys active

### 4.2 Update Staging Environment Variables

```bash
# Update staging .env or deployment config
# Method 1: Cloud Build vars (if using cloud-build-vars.yaml)
vim cloud-build-vars-staging.yaml

# Update these:
VITE_AIRTABLE_VALUATION_API_KEY: "pat_NEW_TOKEN_HERE"
VITE_AIRTABLE_LEAD_CAPTURE_API_KEY: "pat_NEW_TOKEN_HERE"
VITE_INTELIMOTOR_API_KEY: "NEW_KEY_HERE"
VITE_INTELIMOTOR_API_SECRET: "NEW_SECRET_HERE"
VITE_CAR_STUDIO_API_KEY: "NEW_KEY_HERE"
VITE_BREVO_API_KEY: "xkeysib_NEW_KEY_HERE"
CLOUDFLARE_R2_ACCESS_KEY_ID: "NEW_KEY_HERE"
CLOUDFLARE_R2_SECRET_ACCESS_KEY: "NEW_SECRET_HERE"

# Method 2: Cloud Run environment variables
gcloud run services update your-staging-service \
  --set-env-vars="VITE_AIRTABLE_VALUATION_API_KEY=pat_NEW_TOKEN"
```

```bash
# Update Supabase Edge Function secrets
supabase secrets set AIRTABLE_VALUATION_API_KEY=pat_NEW_TOKEN
supabase secrets set BREVO_API_KEY=xkeysib_NEW_KEY
```

### 4.3 Test Staging with New Credentials

Repeat all tests from Phase 3, Step 2:
- [ ] User can submit vehicle valuation
- [ ] Valuation emails are sent
- [ ] Admin dashboard loads
- [ ] Database queries work
- [ ] Image uploads work (R2)

**DO NOT PROCEED if any tests fail!**

---

## 🌐 Phase 5: Production Deployment

### Step 1: Deploy Code to Production

```bash
# Deploy with the same code (using old keys via env vars)
./docs/deployment/deploy.sh production
```

### Step 2: Verify Production Works

Test on production domain:
- [ ] Visit https://trefa.mx
- [ ] Submit test valuation
- [ ] Check admin dashboard
- [ ] Verify all critical flows

### Step 3: Update Production Environment Variables

```bash
# Same process as staging
vim cloud-build-vars.yaml

# Update all credentials with NEW values
# OR use gcloud to update env vars
```

```bash
# Update Supabase production secrets
supabase secrets set AIRTABLE_VALUATION_API_KEY=pat_NEW_TOKEN --project-ref jjepfehmuybpctdzipnu
supabase secrets set BREVO_API_KEY=xkeysib_NEW_KEY --project-ref jjepfehmuybpctdzipnu
```

### Step 4: Redeploy Production with New Credentials

```bash
./docs/deployment/deploy.sh production
```

### Step 5: Verify Production with New Credentials

Final verification:
- [ ] All user-facing features work
- [ ] Email notifications sending
- [ ] Database operations working
- [ ] Image uploads working
- [ ] No errors in logs

---

## ⚠️ Phase 6: Revoke Old Credentials

**ONLY proceed after 24-48 hours of stable operation with new credentials**

### Revocation Checklist:

#### Airtable:
- [ ] Verify new key working for 24+ hours
- [ ] Go to https://airtable.com/account
- [ ] **Revoke old personal access token**

#### Intelimotor:
- [ ] Contact support to revoke old credentials
- [ ] Confirm new credentials working

#### CarStudio:
- [ ] Revoke old API key from dashboard

#### Database:
- [ ] Old password automatically expires after 24 hours
- [ ] No action needed

#### Brevo:
- [ ] Delete old API key from dashboard

#### Cloudflare R2:
- [ ] Delete old access key pair

---

## 🧹 Phase 7: Git History Cleanup

### Option A: Using BFG Repo-Cleaner (Recommended)

```bash
# 1. Install BFG
brew install bfg

# 2. Create fresh clone
git clone --mirror https://github.com/marianomoralesr/ultima.git ultima-cleanup.git
cd ultima-cleanup.git

# 3. Remove all exposed credentials
bfg --replace-text ../secrets.txt

# Contents of secrets.txt:
# Lifeintechnicolor2!==>[REDACTED]
# patTNLaky9mzf4QVH.565b7cebe5070e4fa09eadd888d3187f5afc38aa537873abd6175c1e21ff6535==>[REDACTED]
# patgjhCDUrCQ915MV.8595dc00077c25d786992f793e5370e4a45af5b6929668beb47ff49511ddb414==>[REDACTED]
# 920b45727bb711069c950bbda204182f883d5bd1b17a6d0c6ccd0d673dace457==>[REDACTED]
# e3c31fe81d1345b9a91996043d452d91==>[REDACTED]
# ee4b975fb97eb1573624adfe45cb5c78ca53f3a002729e61b499dd182cb23a6a==>[REDACTED]

# 4. Clean up and push
git reflog expire --expire=now --all && git gc --prune=now --aggressive
git push --force
```

### Option B: Using git-filter-repo

```bash
# 1. Install git-filter-repo
brew install git-filter-repo

# 2. Create fresh clone
git clone https://github.com/marianomoralesr/ultima.git ultima-cleanup
cd ultima-cleanup

# 3. Filter history
git filter-repo --replace-text ../secrets.txt --force

# 4. Push
git remote add origin https://github.com/marianomoralesr/ultima.git
git push --force --all
```

### Important Notes:
- [ ] Coordinate with team before force-pushing
- [ ] All team members must re-clone after cleanup
- [ ] Update any CI/CD that references commits

---

## 📋 Phase 8: Documentation & Process

### Create Team Documentation:

**File: `CREDENTIAL_MANAGEMENT.md`**

```markdown
# Credential Management Guide

## For Developers

### Initial Setup
1. Copy `.env.example` to `.env.local`
2. Request credentials from team lead
3. Fill in all `VITE_*` variables
4. Never commit `.env.local`

### For Database Scripts
1. Copy `scripts/.env.example` to `scripts/.env`
2. Add: `DB_PASSWORD=your-password`
3. Never commit `scripts/.env`

### Adding New Credentials
1. Add to `.env.example` with placeholder
2. Add to `cloud-build-vars.yaml.example`
3. Document in this file
4. Notify team to update their local configs

## For DevOps

### Rotating Credentials
1. Generate new credentials in external service
2. Update staging environment first
3. Test thoroughly
4. Update production environment
5. Verify production working
6. Wait 24-48 hours
7. Revoke old credentials

### Emergency Rotation
If credentials are compromised:
1. Immediately generate new credentials
2. Update production environment ASAP
3. Revoke old credentials immediately
4. Notify team
5. Investigate how leak occurred
```

### Update Onboarding Docs:

Add section about environment setup to onboarding documentation.

---

## 🚨 Rollback Plan

If anything goes wrong:

### Rollback Code:
```bash
# Revert to previous deployment
git revert b8d91b4
git push origin main
./docs/deployment/deploy.sh production
```

### Restore Old Credentials:
```bash
# Old credentials should still be active
# Simply update environment variables back to old values
```

### Communication:
- Notify team immediately
- Document what went wrong
- Create post-mortem

---

## 📊 Success Metrics

- [ ] Zero downtime during migration
- [ ] All services operational
- [ ] No credentials in git history
- [ ] All credentials rotated
- [ ] Team documentation updated
- [ ] Monitoring shows no errors

---

## 🔐 Security Best Practices Going Forward

1. **Never** commit credentials to git
2. **Always** use environment variables
3. **Rotate** credentials every 90 days
4. **Monitor** for credential leaks using:
   - GitHub Secret Scanning
   - GitGuardian
   - gitleaks
5. **Document** all credential locations
6. **Limit** credential access on need-to-know basis
7. **Use** different credentials for staging vs production

---

## 📞 Emergency Contacts

- **Database Issues:** Supabase Support
- **Airtable Issues:** Airtable Support
- **Email Issues:** Brevo Support
- **Infrastructure Issues:** Google Cloud Support

---

## 📝 Migration Log

| Date | Phase | Status | Notes |
|------|-------|--------|-------|
| 2025-11-20 | Phase 1 | ✅ Complete | Code hardening committed |
| 2025-11-20 | Phase 2 | ⏳ Pending | Local testing |
| TBD | Phase 3 | ⏳ Pending | Staging deployment |
| TBD | Phase 4 | ⏳ Pending | Credential rotation |
| TBD | Phase 5 | ⏳ Pending | Production deployment |
| TBD | Phase 6 | ⏳ Pending | Revoke old credentials |
| TBD | Phase 7 | ⏳ Pending | Git history cleanup |
| TBD | Phase 8 | ⏳ Pending | Documentation complete |

---

**Next Action:** Proceed to Phase 2 - Local Testing
