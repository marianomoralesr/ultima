# Git Workflow Guide for TREFA

This guide establishes best practices for managing the TREFA project with git to avoid overwriting functional builds and losing work.

## Current State Analysis

**Current Issues:**
- No git history (all files untracked)
- No branching strategy
- Risk of deploying broken code
- No way to rollback to previous versions
- Can't track what's deployed where

## Recommended Git Workflow

### 1. Initial Setup - Do This First!

```bash
# Initialize git repository (if not already done)
git init

# Add all current files
git add .

# Create initial commit with current working state
git commit -m "Initial commit: Working TREFA application with version tracking

- Complete React + TypeScript frontend
- Express.js backend
- Supabase integration
- Airtable sync functionality
- Docker deployment configuration
- Automated version tracking in footer"

# Set up remote repository (replace with your GitHub/GitLab URL)
git remote add origin https://github.com/your-org/trefa-app.git

# Push to remote
git push -u origin master
```

### 2. Branch Strategy - Git Flow (Recommended)

```
master (or main)     →  Production-ready code (what's on trefa.mx)
  ↑
develop              →  Integration branch (latest features)
  ↑
feature/*            →  New features
fix/*                →  Bug fixes
hotfix/*             →  Emergency production fixes
```

#### Branch Naming Convention

```bash
# Features
feature/add-vehicle-comparison
feature/improve-search-performance

# Bug fixes
fix/footer-version-display
fix/valuation-service-proxy

# Hotfixes (emergency production fixes)
hotfix/critical-login-bug
hotfix/payment-gateway-error
```

### 3. Daily Workflow

#### Starting a New Feature

```bash
# Make sure you're on develop branch
git checkout develop

# Pull latest changes
git pull origin develop

# Create feature branch
git checkout -b feature/your-feature-name

# Work on your feature...
# (make changes, test locally)

# Stage and commit your changes
git add .
git commit -m "Add: Brief description of what you did"

# Push to remote
git push -u origin feature/your-feature-name
```

#### Commit Message Format

Use clear, descriptive commit messages:

```bash
# Good commit messages
git commit -m "Add: Automated version tracking in footer"
git commit -m "Fix: Valuation service proxy call structure"
git commit -m "Update: Organize project documentation into docs/ folder"
git commit -m "Refactor: Improve vehicle search performance"

# Bad commit messages (avoid these)
git commit -m "fix"
git commit -m "updates"
git commit -m "wip"
git commit -m "asdf"
```

**Commit Message Prefixes:**
- `Add:` - New feature or file
- `Fix:` - Bug fix
- `Update:` - Modify existing feature
- `Refactor:` - Code restructuring (no functional change)
- `Remove:` - Delete code or file
- `Docs:` - Documentation changes
- `Test:` - Add or modify tests
- `Deploy:` - Deployment-related changes

### 4. Deployment Workflow

#### Deploy to Staging (Test First!)

```bash
# Switch to develop branch
git checkout develop

# Make sure everything is committed
git status

# Tag the version you're deploying
git tag -a staging-$(date +%Y%m%d-%H%M) -m "Staging deployment $(date +%Y-%m-%d)"

# Push the tag
git push origin --tags

# Deploy to staging
./docs/deployment/deploy.sh staging

# Test thoroughly in staging!
# - Check all critical user flows
# - Test new features
# - Verify no regressions
```

#### Deploy to Production (Only After Staging Tests Pass!)

```bash
# Merge develop into master (production branch)
git checkout master
git merge develop --no-ff -m "Release: $(date +%Y-%m-%d) - Brief description"

# Tag the production release
git tag -a v1.0.$(date +%Y%m%d) -m "Production release $(date +%Y-%m-%d)

Features:
- List key features
- In this release

Fixes:
- List bug fixes
- In this release"

# Push to master
git push origin master
git push origin --tags

# Deploy to production
./docs/deployment/deploy.sh production

# Monitor production logs
gcloud run logs tail app --region=us-central1
```

### 5. Protecting Your Work

#### Create .gitignore (Prevent Committing Secrets)

```bash
# Already exists, but verify it includes:
.env
.env.local
.env.production
node_modules/
dist/
build/
*.log
.DS_Store
cloud-build-vars.yaml  # Contains sensitive keys!
```

#### Never Commit These Files!

- `.env` files (contain API keys)
- `cloud-build-vars.yaml` (contains credentials)
- `node_modules/` (dependencies, not source code)
- `dist/` or `build/` (generated files)

### 6. Emergency Rollback Procedures

#### If Production Breaks - Quick Rollback

```bash
# Find the last working deployment
git tag -l "v1.0.*"

# Example output:
# v1.0.20251020
# v1.0.20251021  ← current (broken)

# Checkout the previous working version
git checkout v1.0.20251020

# Deploy the previous version
./docs/deployment/deploy.sh production

# After rollback, fix the issue in a hotfix branch
git checkout master
git checkout -b hotfix/fix-critical-bug

# Fix the bug, test, then merge
git checkout master
git merge hotfix/fix-critical-bug
```

#### Using Cloud Run Revisions for Instant Rollback

```bash
# List all deployed revisions
gcloud run revisions list --service=app --region=us-central1

# Roll back to a previous revision (instant!)
gcloud run services update-traffic app \
  --region=us-central1 \
  --to-revisions=app-00024=100

# This is faster than redeploying!
```

### 7. Checking What's Deployed

#### Know Exactly What's Running

```bash
# Check current git commit
git rev-parse --short HEAD
# Output: 5335a59

# This matches the version in footer: beta-5335a59

# See what changed since last deployment
git log --oneline v1.0.20251020..HEAD

# Check differences between staging and production
git diff master develop
```

### 8. Keeping History Clean

#### Before Pushing - Review Your Changes

```bash
# See what you're about to commit
git status
git diff

# See staged changes
git diff --staged

# Unstage files if needed
git reset HEAD filename.ts

# Undo local changes (CAREFUL!)
git checkout -- filename.ts
```

#### Dealing with Merge Conflicts

```bash
# When you see a merge conflict
git status

# Shows:
# both modified: src/components/Footer.tsx

# Open the file, look for:
# <<<<<<< HEAD
# your changes
# =======
# their changes
# >>>>>>> branch-name

# Resolve manually, then:
git add src/components/Footer.tsx
git commit -m "Merge: Resolve conflict in Footer.tsx"
```

### 9. Collaboration Best Practices

#### Pull Before You Push

```bash
# Always pull latest changes before starting work
git checkout develop
git pull origin develop

# Before merging your feature
git checkout feature/your-feature
git rebase develop  # Apply your changes on top of latest develop
```

#### Code Review Workflow (If Using GitHub/GitLab)

1. Push your feature branch
2. Create Pull Request (PR) / Merge Request (MR)
3. Request review from team member
4. Address feedback
5. Merge only after approval

### 10. Maintenance Tasks

#### Weekly: Clean Up Old Branches

```bash
# List all branches
git branch -a

# Delete merged feature branches
git branch -d feature/completed-feature

# Delete remote branches
git push origin --delete feature/completed-feature
```

#### Monthly: Review and Archive Old Tags

```bash
# List all tags
git tag -l

# Keep production tags, can delete old staging tags
git tag -d staging-20251001-1200
git push origin --delete staging-20251001-1200
```

## Quick Reference Commands

```bash
# Check status
git status

# See commit history
git log --oneline --graph --decorate --all

# See what's different from production
git diff master

# See what's deployed (check version)
git describe --tags

# Create a backup branch before risky operation
git branch backup-$(date +%Y%m%d)

# Stash changes temporarily
git stash
git stash pop  # Restore later

# View file history
git log -p filename.ts

# Find when a bug was introduced
git bisect start
git bisect bad  # Current version is bad
git bisect good v1.0.20251020  # This version was good
# Git will checkout commits to test - mark each as good/bad
```

## Recovery Scenarios

### "I Accidentally Deleted Important Code!"

```bash
# Find the commit where it existed
git log --all --full-history -- path/to/deleted/file.ts

# Restore the file from that commit
git checkout <commit-hash> -- path/to/deleted/file.ts
```

### "I Committed to the Wrong Branch!"

```bash
# If you haven't pushed yet
git reset HEAD~1  # Undo last commit, keep changes
git stash  # Save changes
git checkout correct-branch
git stash pop  # Apply changes
```

### "I Need to Undo My Last Commit!"

```bash
# Undo commit but keep changes
git reset --soft HEAD~1

# Undo commit and discard changes (CAREFUL!)
git reset --hard HEAD~1
```

## Summary Checklist

- [ ] Initialize git repository
- [ ] Create `.gitignore` for sensitive files
- [ ] Set up `master` and `develop` branches
- [ ] Always work in feature branches
- [ ] Test in staging before production
- [ ] Tag every deployment
- [ ] Write clear commit messages
- [ ] Pull before push
- [ ] Never commit secrets or API keys
- [ ] Keep production stable

## Additional Resources

- [Git Branching Model](https://nvie.com/posts/a-successful-git-branching-model/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitHub Flow](https://guides.github.com/introduction/flow/)

---

**Remember**: Git is your time machine. Commit early, commit often, and you'll never lose work!
