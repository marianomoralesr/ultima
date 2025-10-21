# TREFA Documentation

This folder contains all project documentation, guides, scripts, and SQL files.

## Folder Structure

### 📚 `/guides` - Documentation & Guides
Comprehensive guides for setup, deployment, and troubleshooting.

- **AIRTABLE_SYNC_README.md** - How to sync Airtable to Supabase
- **AUTOMATION_GUIDE.md** - Automate syncs with cron/serverless
- **DEPLOYMENT_GUIDE.md** - Deploy to staging/production
- **MIGRATION_QUICKSTART.md** - Database migration guide
- **TESTING_GUIDE.md** - Testing procedures
- **APPLICATION_PERFORMANCE_ANALYSIS.md** - Performance analysis
- **CORS_ROUTING_FIXES.md** - CORS and routing fixes
- **EXPLORAR_AND_APPLICATION_FIXES.md** - Explorar page fixes
- **FIXES_APPLIED_README.md** - All bug fixes documented
- **LATEST_UPDATES.md** - Recent changes
- **STAGING_DOMAIN_SETUP.md** - Custom staging domain setup
- **VEHICLE_DISPLAY_FIX.md** - Vehicle display troubleshooting

### 🛠️ `/scripts` - Utility Scripts
Helper scripts for maintenance and diagnostics.

- **diagnoseSchema.cjs** - Diagnose database schema issues
- **generate-sitemap.cjs** - Generate XML sitemap
- **syncAirtableData.cjs** - Legacy Airtable sync (deprecated)
- **syncAirtableToSupabase.cjs** - Legacy sync (deprecated)
- **test-supabase-admin.cjs** - Test Supabase admin functions

### 🗄️ `/sql` - Database Scripts
SQL scripts for database fixes and migrations.

- **fix-admin-functions.sql** - Fix admin dashboard functions
- **fix-config-table.sql** - Create app_config table
- **fix-production-database.sql** - Complete production DB fix
- **fix-rls-supabase.sql** - Fix RLS on financing_applications
- **fix-uploaded-documents-rls.sql** - Fix RLS on uploaded_documents

### 🚀 `/deployment` - Deployment Scripts
Scripts for deploying to Cloud Run.

- **deploy.sh** - Main deployment script (staging/production)
- **setup-staging-domain.sh** - Configure staging.trefa.mx domain

### 📦 `/archive` - Historical Files
Old documentation and archived files.

- **old-readme.md** - Previous README file
- **gemini_project_summary.md** - AI-generated project summary
- **supabase-ai-prompt.txt** - AI prompts for Supabase
- **supabase_migration.txt** - Migration notes
- **2025-10-13-caveat...txt** - Historical notes

## Quick Reference

### Deploy to Production
```bash
../docs/deployment/deploy.sh production
```

### Deploy to Staging
```bash
../docs/deployment/deploy.sh staging
```

### Sync Airtable Data
```bash
# From project root
AIRTABLE_API_KEY=xxx SUPABASE_SERVICE_KEY=xxx node populate-cache-from-airtable.cjs
```

### Fix Database Issues
```bash
# Run SQL files in Supabase SQL Editor
# See /sql folder for specific fixes
```

### Generate Sitemap
```bash
node docs/scripts/generate-sitemap.cjs
```

## Important Notes

⚠️ **Deployment Scripts** - Always test on staging before production
⚠️ **SQL Scripts** - Review before running in production
⚠️ **Service Keys** - Never commit API keys to version control
⚠️ **Legacy Scripts** - Scripts in `/archive` are deprecated

## Getting Help

1. Check the relevant guide in `/guides`
2. Review SQL fixes in `/sql` for database issues
3. See deployment scripts in `/deployment` for Cloud Run
4. Check archived docs in `/archive` for historical context
