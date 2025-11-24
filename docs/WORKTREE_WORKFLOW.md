# Git Worktrees & Multi-Session Claude Workflow Guide

## Table of Contents
1. [Understanding Git Worktrees](#understanding-git-worktrees)
2. [Worktree Setup & Management](#worktree-setup--management)
3. [Working with Multiple Claude Sessions](#working-with-multiple-claude-sessions)
4. [Best Practices](#best-practices)
5. [Common Workflows](#common-workflows)
6. [Troubleshooting](#troubleshooting)

---

## Understanding Git Worktrees

### What are Git Worktrees?

Git worktrees allow you to have **multiple working directories** attached to the same repository. This means you can work on different branches simultaneously without switching contexts.

**Traditional workflow problems:**
- `git checkout` switches your entire working directory
- Need to stash/commit incomplete work to switch branches
- Can't run tests on one branch while developing on another
- Context switching is slow and error-prone

**Worktree solution:**
- Each branch has its own directory
- Work on multiple features/fixes simultaneously
- Run multiple dev servers, tests, or builds in parallel
- Perfect for multi-session Claude workflows

### Directory Structure Example

```
/ultima copy/                    # Main worktree (usually main branch)
├── tree/
│   ├── feature-auth/           # Worktree for authentication feature
│   ├── bugfix-payment/         # Worktree for payment bug
│   ├── refactor-api/           # Worktree for API refactoring
│   └── experiment-ui/          # Worktree for UI experiments
├── src/
├── package.json
└── ...
```

---

## Worktree Setup & Management

### Initial Setup

```bash
# Create the tree directory (one time)
mkdir -p ./tree

# Add worktrees as needed
git worktree add ./tree/feature-name feature-name

# Or create new branch and worktree together
git worktree add -b new-feature ./tree/new-feature
```

### Using the Automated Script

```bash
# Create worktrees for all open PRs
./create-worktrees.sh

# This will:
# 1. Fetch all open PRs from GitHub
# 2. Create a worktree for each PR branch
# 3. Handle nested branch names (feature/foo)
# 4. Skip existing worktrees
```

### Manual Worktree Management

```bash
# List all worktrees
git worktree list

# Add a worktree for an existing branch
git worktree add ./tree/branch-name branch-name

# Create new branch with worktree from specific base
git worktree add -b new-branch ./tree/new-branch origin/main

# Remove a worktree
git worktree remove ./tree/branch-name

# Remove a worktree with uncommitted changes (force)
git worktree remove --force ./tree/branch-name

# Prune stale worktree references
git worktree prune
```

### Organizing Worktrees by Type

```bash
# Organize by category
./tree/
├── features/
│   ├── auth/
│   └── payments/
├── bugs/
│   ├── login-fix/
│   └── data-validation/
└── experiments/
    └── new-ui/

# Create organized worktrees
git worktree add -b feature/auth ./tree/features/auth
git worktree add -b bug/login-fix ./tree/bugs/login-fix
```

---

## Working with Multiple Claude Sessions

### The Multi-Session Advantage

Running multiple Claude sessions in parallel allows you to:
- Work on independent features simultaneously
- Run long-running tasks (builds, tests) while continuing development
- Compare different approaches side-by-side
- Parallelize code reviews and refactoring

### Session Management Strategy

#### 1. **Primary Session** (Main Worktree)
- **Location:** `/ultima copy/` (main branch)
- **Purpose:**
  - Code reviews
  - Planning and architecture discussions
  - Merging PRs
  - Running integration tests
  - Documentation updates

```bash
# Terminal 1 - Main worktree
cd /ultima\ copy/
claude code  # Primary planning/review session
```

#### 2. **Feature Sessions** (Feature Worktrees)
- **Location:** `./tree/feature-*`
- **Purpose:**
  - Focused feature development
  - Isolated testing
  - Independent npm/build processes

```bash
# Terminal 2 - Feature A
cd ./tree/feature-auth/
npm run dev  # Dev server on port 3000
claude code  # Feature development session

# Terminal 3 - Feature B
cd ./tree/feature-payments/
npm run dev -- --port 3001  # Dev server on port 3001
claude code  # Separate feature session
```

#### 3. **Bug Fix Sessions** (Bug Worktrees)
- **Location:** `./tree/bugfix-*`
- **Purpose:**
  - Quick bug reproduction
  - Isolated testing
  - Minimal context switching

```bash
# Terminal 4 - Bug fix
cd ./tree/bugfix-payment/
npm run test:watch  # Watch mode for specific tests
claude code  # Bug fixing session
```

### Context Management Between Sessions

**Each Claude session should:**

1. **Start with clear context:**
   ```
   "I'm working on [feature/bug] in the ./tree/[branch-name] worktree.
   This is separate from other work happening in parallel."
   ```

2. **Reference the worktree location:**
   ```
   "Let's implement authentication in this worktree (./tree/feature-auth).
   The main branch is untouched."
   ```

3. **Communicate dependencies:**
   ```
   "This depends on the API changes in ./tree/refactor-api.
   Once that's merged, I'll rebase this branch."
   ```

### Session Coordination Patterns

#### Pattern 1: Sequential Dependencies
```bash
# Session 1: Database schema changes
cd ./tree/schema-update/
# Work with Claude to update schema
# Create PR

# Session 2: API changes (depends on schema)
cd ./tree/api-update/
# Work with Claude on API
# Reference: "Once PR #123 merges, this will work"

# Session 3: UI changes (depends on API)
cd ./tree/ui-update/
# Work with Claude on UI
# Can develop against mocked API
```

#### Pattern 2: Parallel Independent Work
```bash
# Session 1: Frontend feature
cd ./tree/feature-dashboard/
npm run dev -- --port 3000
# Claude works on dashboard

# Session 2: Backend feature
cd ./tree/feature-analytics/
npm run dev:api -- --port 8080
# Claude works on analytics API

# Session 3: Documentation
cd ./tree/docs-update/
npm run docs:dev -- --port 8081
# Claude updates docs

# All three can be merged independently
```

#### Pattern 3: Experimentation & Comparison
```bash
# Session 1: Approach A
cd ./tree/experiment-react-query/
# Claude implements using React Query

# Session 2: Approach B
cd ./tree/experiment-swr/
# Claude implements using SWR

# Session 3: Review & Compare
cd /ultima\ copy/
# Claude reviews both approaches, recommends best
```

---

## Best Practices

### 1. Worktree Naming Conventions

```bash
# Good naming patterns
./tree/feature-user-auth          # Clear feature name
./tree/bugfix-payment-validation  # Clear bug description
./tree/refactor-api-endpoints     # Clear refactoring scope
./tree/experiment-new-ui          # Clear experiment label
./tree/docs-api-reference         # Clear documentation scope

# Avoid
./tree/test                       # Too vague
./tree/fix                        # Not descriptive
./tree/branch1                    # No context
```

### 2. Keeping Worktrees Updated

```bash
# In each worktree, regularly pull updates
cd ./tree/feature-name/

# Update the worktree's branch
git pull origin feature-name

# Rebase on main to stay current
git fetch origin main
git rebase origin/main

# If conflicts occur, resolve in this isolated worktree
```

### 3. Dependency Management Per Worktree

**Important:** Each worktree has its own `node_modules` and can have different dependencies.

```bash
# Install dependencies in each worktree
cd ./tree/feature-name/
npm install

# This allows:
# - Testing dependency upgrades in isolation
# - Different versions for different features
# - Independent builds and dev servers
```

**Space-saving option:** Use symlinks or pnpm for shared dependencies
```bash
# Use pnpm for better disk usage
cd ./tree/feature-name/
pnpm install  # Uses content-addressable storage

# Or symlink common dependencies (advanced)
ln -s ../../node_modules ./node_modules
```

### 4. Claude Session Best Practices

#### DO ✅

**Provide clear context:**
```
"I'm in the ./tree/feature-auth worktree working on authentication.
This is separate from the payment work in ./tree/feature-payments."
```

**Reference the worktree:**
```
"Let's add the login component in this worktree's src/components/ directory."
```

**Communicate state:**
```
"This worktree is ahead of main by 5 commits. We're ready to create a PR."
```

**Use todos effectively:**
```
"Create a todo list for this worktree's tasks:
1. Implement OAuth flow
2. Add tests
3. Update documentation"
```

#### DON'T ❌

**Don't mix contexts:**
```
"Work on auth in this worktree, but also check the payment code in another worktree"
# Bad: Keep each session focused
```

**Don't assume shared state:**
```
"Use the new API endpoint I just added"
# Bad: If added in a different worktree, it's not available here
```

**Don't forget to specify location:**
```
"Create a new component"
# Bad: Which worktree? Be explicit.
```

### 5. Git Operations in Worktrees

```bash
# Commits are shared across all worktrees
cd ./tree/feature-a/
git commit -m "Add feature A"

# This commit is visible in all worktrees
cd /ultima\ copy/
git log  # Shows the commit from feature-a

# Branches are independent
cd ./tree/feature-a/
git branch  # Shows: * feature-a

cd ./tree/feature-b/
git branch  # Shows: * feature-b

# Pushing works normally
cd ./tree/feature-a/
git push origin feature-a
```

### 6. Cleanup Strategy

```bash
# After merging a PR, remove the worktree
git worktree remove ./tree/feature-name

# If branch is deleted remotely
git fetch --prune
git worktree prune

# Clean up orphaned worktrees
git worktree list
# Manually remove directories that no longer have branches
```

### 7. IDE/Editor Configuration

**VS Code:**
```bash
# Open each worktree in a separate window
code ./tree/feature-auth
code ./tree/feature-payments
code /ultima\ copy/

# Each window has:
# - Independent file watchers
# - Separate terminal sessions
# - Isolated extensions/settings (if needed)
```

**Project-specific settings:**
```json
// .vscode/settings.json in each worktree
{
  "files.exclude": {
    "**/node_modules": true,
    "**/tree": true  // Hide tree folder in feature worktrees
  }
}
```

---

## Common Workflows

### Workflow 1: Feature Development

```bash
# 1. Create feature branch and worktree
git worktree add -b feature/user-profile ./tree/feature-user-profile

# 2. Navigate and start Claude session
cd ./tree/feature-user-profile/
claude code

# 3. In Claude session:
"I'm working on user profile feature in this worktree.
Let's create a todo list:
1. Create UserProfile component
2. Add API endpoints
3. Add tests
4. Update documentation"

# 4. Install dependencies
npm install

# 5. Start dev server
npm run dev

# 6. Work with Claude to implement feature

# 7. Test in isolation
npm run test

# 8. Commit and push
git add .
git commit -m "feat: Add user profile feature"
git push origin feature/user-profile

# 9. Create PR (Claude can help)
gh pr create --title "Add user profile feature" --body "..."

# 10. After merge, cleanup
cd ../../
git worktree remove ./tree/feature-user-profile
git branch -d feature/user-profile
```

### Workflow 2: Parallel Bug Fixes

```bash
# Terminal 1: Bug A
git worktree add -b bugfix/login-error ./tree/bugfix-login
cd ./tree/bugfix-login/
claude code
# "Fix the login error in this worktree"

# Terminal 2: Bug B (simultaneously)
git worktree add -b bugfix/payment-validation ./tree/bugfix-payment
cd ./tree/bugfix-payment/
claude code
# "Fix the payment validation bug in this worktree"

# Both bugs can be fixed, tested, and merged independently
```

### Workflow 3: Code Review in Main, Development in Feature

```bash
# Terminal 1: Main worktree for reviews
cd /ultima\ copy/
claude code
# "Review the open PRs and provide feedback"

# Terminal 2: Continue feature development
cd ./tree/feature-new-api/
claude code
# "Continue implementing the API while I review other code"

# No context switching needed!
```

### Workflow 4: Experimentation Without Risk

```bash
# Try something experimental
git worktree add -b experiment/new-architecture ./tree/experiment-arch
cd ./tree/experiment-arch/
npm install
claude code

# "Let's try a completely different architecture approach.
# This is experimental, so we can be bold."

# If it works: Create PR
# If it doesn't: Simply remove the worktree
cd ../../
git worktree remove ./tree/experiment-arch
git branch -D experiment/new-architecture
```

### Workflow 5: Long-Running Tasks

```bash
# Terminal 1: Start long build
cd ./tree/feature-large-refactor/
npm run build:production
# Takes 10 minutes...

# Terminal 2: Keep working on something else
cd ./tree/feature-small-fix/
claude code
# Continue development without waiting

# Terminal 3: Review documentation
cd /ultima\ copy/
claude code
# Review and update docs
```

---

## Troubleshooting

### Issue: Worktree Already Exists

```bash
# Error: fatal: 'tree/feature-name' already exists

# Solution 1: Remove and recreate
git worktree remove ./tree/feature-name
git worktree add ./tree/feature-name feature-name

# Solution 2: If directory exists but not registered
rm -rf ./tree/feature-name
git worktree prune
git worktree add ./tree/feature-name feature-name
```

### Issue: Branch Checked Out in Another Worktree

```bash
# Error: fatal: 'feature-name' is already checked out at './tree/feature-name'

# You can't have the same branch in multiple worktrees
# Solution: Use a different branch or remove the existing worktree
git worktree list  # Find where it's checked out
git worktree remove ./tree/feature-name
```

### Issue: Disk Space with Multiple node_modules

```bash
# Problem: Each worktree has its own node_modules

# Solution 1: Use pnpm (content-addressable storage)
cd ./tree/feature-name/
pnpm install

# Solution 2: Clean up unused worktrees
git worktree list
git worktree remove ./tree/old-feature

# Solution 3: Selective installation
# Only install in worktrees where you're actively developing
```

### Issue: Git Operations Slow with Many Worktrees

```bash
# Problem: Too many worktrees slow down git

# Solution: Regular cleanup
git worktree prune
git maintenance run

# Remove merged worktrees
for dir in ./tree/*/; do
  cd "$dir"
  branch=$(git branch --show-current)
  if git branch -r --merged origin/main | grep -q "$branch"; then
    echo "Removing merged worktree: $branch"
    cd ../../
    git worktree remove "$dir"
  fi
done
```

### Issue: Claude Session Confusion

```bash
# Problem: Claude operates on wrong worktree

# Solution: Always provide context at start of session
"I'm working in ./tree/feature-auth worktree.
All file operations should be in this directory.
Current directory: $(pwd)"

# Or use absolute paths
"Read /Users/marianomorales/Downloads/ultima copy/tree/feature-auth/src/app.ts"
```

### Issue: Merge Conflicts Across Worktrees

```bash
# Problem: Changes in worktree A conflict with worktree B

# Solution 1: Rebase regularly
cd ./tree/feature-name/
git fetch origin main
git rebase origin/main

# Solution 2: Coordinate changes
# Use Claude to detect potential conflicts before they happen
"Check if my changes in ./tree/feature-a conflict with
the changes in ./tree/feature-b"

# Solution 3: Merge main frequently
git fetch origin
git merge origin/main
```

---

## Advanced Tips

### 1. Automated Worktree Cleanup Script

Create `./scripts/cleanup-worktrees.sh`:

```bash
#!/bin/bash

echo "Cleaning up merged worktrees..."

# Get all merged branches
merged_branches=$(git branch --merged main | grep -v "main" | grep -v "*")

for branch in $merged_branches; do
  # Check if worktree exists for this branch
  worktree_path="./tree/${branch// /}"

  if [ -d "$worktree_path" ]; then
    echo "Removing merged worktree: $worktree_path"
    git worktree remove "$worktree_path"
    git branch -d "$branch"
  fi
done

# Prune stale worktree references
git worktree prune

echo "Cleanup complete!"
git worktree list
```

### 2. Worktree Status Overview

Create `./scripts/worktree-status.sh`:

```bash
#!/bin/bash

echo "=== Worktree Status Overview ==="
echo ""

git worktree list | while read -r line; do
  worktree=$(echo "$line" | awk '{print $1}')
  branch=$(echo "$line" | grep -o '\[.*\]' | tr -d '[]')

  echo "📁 $worktree"
  echo "🌿 Branch: $branch"

  cd "$worktree"

  # Check for uncommitted changes
  if [[ -n $(git status -s) ]]; then
    echo "⚠️  Uncommitted changes:"
    git status -s | head -5
  else
    echo "✅ Clean working directory"
  fi

  # Check commits ahead/behind
  ahead_behind=$(git rev-list --left-right --count origin/main...HEAD 2>/dev/null)
  if [[ -n "$ahead_behind" ]]; then
    echo "📊 Commits: $ahead_behind (behind/ahead of main)"
  fi

  echo ""
done
```

### 3. Per-Worktree Environment Variables

Create `.env.worktree` in each worktree:

```bash
# ./tree/feature-auth/.env.worktree
PORT=3001
API_URL=http://localhost:8001
DEBUG=true

# ./tree/feature-payments/.env.worktree
PORT=3002
API_URL=http://localhost:8002
DEBUG=true
```

Load in npm scripts:
```json
{
  "scripts": {
    "dev": "source .env.worktree && next dev -p $PORT"
  }
}
```

---

## Quick Reference

### Essential Commands

```bash
# Create worktree
git worktree add ./tree/<name> <branch>
git worktree add -b <new-branch> ./tree/<name>

# List worktrees
git worktree list

# Remove worktree
git worktree remove ./tree/<name>

# Clean up
git worktree prune

# Navigate
cd ./tree/<name>
```

### Claude Session Starters

```bash
# Feature development
"I'm in ./tree/feature-auth working on authentication.
Let's start by creating a todo list."

# Bug fix
"I'm in ./tree/bugfix-payment working on the payment validation bug.
Please help me reproduce and fix it."

# Code review
"I'm in the main worktree. Let's review PR #123
and provide detailed feedback."

# Experimentation
"I'm in ./tree/experiment-new-ui trying a new approach.
This is experimental, so let's be creative."
```

---

## Summary

**Git Worktrees Benefits:**
- ✅ Work on multiple branches simultaneously
- ✅ No context switching with `git checkout`
- ✅ Independent build/test processes
- ✅ Safe experimentation without affecting main work
- ✅ Perfect for parallel Claude sessions

**Multi-Session Claude Benefits:**
- ✅ Parallel development on independent features
- ✅ Continuous work during long-running tasks
- ✅ Separate contexts for different work types
- ✅ Efficient resource utilization
- ✅ Faster overall development cycle

**Remember:**
- Each worktree is independent
- Each Claude session should have clear context
- Regular cleanup prevents clutter
- Coordinate changes to avoid conflicts
- Use descriptive names for easy navigation

Happy developing! 🚀
