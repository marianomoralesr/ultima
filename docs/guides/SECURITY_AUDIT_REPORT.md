# Security Audit Report - Credential Exposure Analysis

**Date:** 2025-11-20
**Branch:** feature/banking-profile-scoring-update
**Status:** 🔴 CRITICAL - Multiple credentials exposed in code

---

## Executive Summary

Multiple sensitive credentials have been hardcoded in source files committed to the repository. While `cloud-build-vars.yaml` is properly excluded from git, **hardcoded fallback values** in the codebase expose production credentials.

---

## Exposed Credentials Inventory

### 1. Database Credentials
**Status:** 🔴 EXPOSED
**Password:** `Lifeintechnicolor2!`
**Location:** 11 shell script files

**Affected Files:**
- `deploy-google-sheets-trigger.sh` (lines 6, 15)
- `scripts/apply-migration.sh` (line 13)
- `scripts/apply-recursion-fix.sh` (line 4)
- `scripts/apply-sales-fix.sh` (line 4)
- `scripts/backup-database.sh` (line 13)
- `scripts/restore-database.sh` (line 13)
- `scripts/check-policies.sh` (line 3)
- `scripts/check-get-my-role.sh` (line 3)
- `scripts/apply-roadmap-fix.sh` (line 4)
- `scripts/check-roadmap.sh` (line 3)

**Impact:** Direct database access to production PostgreSQL

---

### 2. Airtable API Keys
**Status:** 🔴 EXPOSED

#### Key #1: `patTNLaky9mzf4QVH.565b7cebe5070e4fa09eadd888d3187f5afc38aa537873abd6175c1e21ff6535`
- **Location:** `supabase/functions/automated-email-notifications/index.ts:778`
- **Usage:** Valuation leads sync
- **Impact:** Can read/write valuation data

#### Key #2: `patgjhCDUrCQ915MV.8595dc00077c25d786992f793e5370e4a45af5b6929668beb47ff49511ddb414`
- **Location:** `src/pages/config.ts` (lines 9, 13)
- **Usage:** Valuation and Lead Capture APIs
- **Impact:** Can read/write customer leads and valuations

---

### 3. Intelimotor API Credentials
**Status:** 🔴 EXPOSED
**API Key:** `920b45727bb711069c950bbda204182f883d5bd1b17a6d0c6ccd0d673dace457`
**Location:** `src/pages/config.ts:20`
**Impact:** Vehicle valuation API access

---

### 4. CarStudio API Key
**Status:** 🔴 EXPOSED
**API Key:** `e3c31fe81d1345b9a91996043d452d91`
**Locations:**
- `src/pages/config.ts:25`
- `test-carstudio-api.html:13`
**Impact:** Car visualization service access

---

### 5. Brevo Email API Key
**Status:** 🟡 PARTIALLY SECURE
**Key:** `xkeysib-[REDACTED]`
**Location:** `cloud-build-vars.yaml:60` (NOT in git ✓)
**Note:** Used correctly via env vars in code, but exposed in local config file

---

### 6. Cloudflare R2 Credentials
**Status:** 🟡 PARTIALLY SECURE
**Locations:** `cloud-build-vars.yaml` (NOT in git ✓)
- Account ID: `[REDACTED]`
- Access Key: `[REDACTED]`
- Secret Key: `[REDACTED]`

---

## Current Security Posture

### ✅ What's Working
1. `.gitignore` properly excludes:
   - `.env`, `.env.local`, `.env.production`, `.env.staging`
   - `cloud-build-vars.yaml` (actual file)
2. Only example files are tracked in git
3. Environment variable infrastructure exists

### 🔴 Critical Issues
1. **Hardcoded fallback values** bypass env vars when variables are missing
2. **Scripts hardcode passwords** instead of reading from environment
3. **Git history contains these credentials** in committed code files
4. No validation that required env vars are set before running

---

## Service Dependencies Analysis

### Services Using Each Credential

#### Database Password (`Lifeintechnicolor2!`)
- Migration scripts (schema updates)
- Backup/restore operations
- Database health checks
- Direct SQL execution scripts

#### Airtable Keys
- **Frontend** (`src/pages/config.ts`): Vehicle data, lead capture
- **Backend** (`automated-email-notifications`): Email automation
- **Edge Functions**: Valuation proxy, lead sync

#### Intelimotor API
- Vehicle valuation service
- VIN decoding
- Market pricing

#### CarStudio API
- 360° vehicle visualization
- Image rendering

#### Brevo API
- Transactional emails
- Email campaign tracking
- Notification system

---

## Deployment Environments

### Local Development
- Uses `.env.local` (present, not tracked)
- Falls back to hardcoded values ❌

### Staging
- **URL:** Not yet determined
- **Deployment:** Via `deploy.sh staging`
- **Config:** `cloud-build-vars.yaml` injected as build args

### Production
- **URL:** `https://trefa.mx`
- **Cloud Run:** `https://app-1052659336338.us-central1.run.app`
- **Deployment:** Via `deploy.sh production`
- **Config:** `cloud-build-vars.yaml` injected as build args

---

## Zero-Downtime Migration Strategy

### Phase 1: Code Hardening (No Key Rotation Yet)
1. Remove all hardcoded fallback values
2. Make environment variables **required**
3. Add startup validation
4. Keep using existing (compromised) keys

### Phase 2: Staging Deployment
1. Deploy hardened code to staging
2. Verify all services work with old keys via env vars
3. Test all critical flows

### Phase 3: Credential Rotation
1. Generate new credentials in all external services
2. Set new env vars in staging
3. Test thoroughly
4. Deploy to production with new env vars
5. Revoke old credentials only after verification

### Phase 4: Git History Cleanup
1. Use `git-filter-repo` to remove secrets from history
2. Force push to remote (coordinate with team)
3. All team members re-clone

---

## Files Requiring Changes

### High Priority (Hardcoded Secrets)
1. ✅ `src/pages/config.ts` - Remove all fallback API keys
2. ✅ `supabase/functions/automated-email-notifications/index.ts:778` - Remove Airtable fallback
3. ✅ All scripts in `scripts/` directory - Use `DB_PASSWORD` env var
4. ✅ `deploy-google-sheets-trigger.sh` - Use `DB_PASSWORD` env var

### Medium Priority (Configuration)
1. Update `.env.example` with all required variables
2. Create `scripts/.env.example` for database scripts
3. Add validation scripts

### Low Priority (Documentation)
1. Document credential rotation process
2. Create onboarding guide for new developers
3. Set up secret scanning in CI/CD

---

## Credential Rotation Checklist

### Airtable
- [ ] Log into Airtable account settings
- [ ] Revoke old personal access token
- [ ] Generate new token with same permissions
- [ ] Update in Cloud Run environment variables
- [ ] Update in Supabase Edge Function secrets

### Intelimotor
- [ ] Contact Intelimotor support for new API credentials
- [ ] Update in Cloud Run environment variables

### CarStudio
- [ ] Generate new API key from CarStudio dashboard
- [ ] Update in Cloud Run environment variables

### Database
- [ ] Generate new PostgreSQL password in Supabase dashboard
- [ ] Update in local `.env` files
- [ ] Update in deployment scripts environment
- [ ] Test connection before revoking old password

### Brevo
- [ ] Generate new API key in Brevo settings
- [ ] Update in Cloud Run environment variables
- [ ] Update in Supabase Edge Function secrets

### Cloudflare R2
- [ ] Generate new R2 access tokens
- [ ] Update in Cloud Run environment variables
- [ ] Test image uploads before revoking

---

## Next Steps

1. ✅ Complete this audit
2. 🔄 Create backup branch
3. ⏳ Remove hardcoded credentials from code
4. ⏳ Deploy to staging with old keys
5. ⏳ Rotate all credentials
6. ⏳ Deploy to production with new keys
7. ⏳ Clean git history

**Estimated Timeline:** 2-3 hours for complete migration
**Risk Level:** Medium (with proper testing)
**Downtime Expected:** Zero (with staged rollout)
