# Git Worktrees + Claude Multi-Session Cheatsheet

## Quick Commands

### Create Worktrees

```bash
# Automated: Create worktrees for all open PRs
./create-worktrees.sh

# Interactive: Create new branch + worktree
./scripts/create-branch-worktree.sh

# Manual: Create worktree for existing branch
git worktree add ./tree/<branch-name> <branch-name>

# Manual: Create new branch + worktree
git worktree add -b <new-branch> ./tree/<new-branch>

# Create from specific base
git worktree add -b <new-branch> ./tree/<new-branch> origin/main
```

### Manage Worktrees

```bash
# List all worktrees
git worktree list

# Check status of all worktrees
./scripts/worktree-status.sh

# Remove a worktree
git worktree remove ./tree/<branch-name>

# Force remove (with uncommitted changes)
git worktree remove --force ./tree/<branch-name>

# Clean up merged worktrees
./scripts/cleanup-worktrees.sh

# Prune stale references
git worktree prune
```

### Navigate Worktrees

```bash
# Main worktree (usually main branch)
cd /ultima\ copy/

# Feature worktree
cd ./tree/feature-name/

# List all worktree directories
ls ./tree/
```

## Multi-Session Claude Setup

### Pattern 1: Feature Development

```bash
# Terminal 1: Feature A
cd ./tree/feature-auth/
npm install && npm run dev
claude code
# "I'm in ./tree/feature-auth working on authentication"

# Terminal 2: Feature B (parallel)
cd ./tree/feature-payments/
npm install && npm run dev -- --port 3001
claude code
# "I'm in ./tree/feature-payments working on payments"

# Terminal 3: Main (reviews/planning)
cd /ultima\ copy/
claude code
# "I'm in main worktree for reviews and planning"
```

### Pattern 2: Test While Developing

```bash
# Terminal 1: Run tests
cd ./tree/feature-name/
npm run test:watch

# Terminal 2: Continue development
cd ./tree/feature-name/
claude code
# "Keep developing while tests run in the background"
```

### Pattern 3: Experimentation

```bash
# Terminal 1: Stable development
cd ./tree/feature-stable/
claude code
# "Continue stable development"

# Terminal 2: Experiment
cd ./tree/experiment-new-approach/
claude code
# "Try experimental approach without risk"
```

## Claude Session Best Practices

### Starting a Session ✅

```
"I'm working in ./tree/feature-auth worktree.
Current task: Implement OAuth authentication.
This is separate from other parallel work."
```

### Providing Context ✅

```
"This worktree is 3 commits ahead of main.
Dependencies are installed.
Dev server running on port 3001."
```

### Using Todos ✅

```
"Create a todo list for this worktree:
1. Implement login form
2. Add OAuth integration
3. Write tests
4. Update documentation"
```

### Avoiding Confusion ❌

```
# DON'T: Mix worktrees in one session
"Work on auth here and payments in the other worktree"

# DO: Keep each session focused
"Focus only on authentication in this worktree"
```

## Common Workflows

### New Feature

```bash
# 1. Create worktree
./scripts/create-branch-worktree.sh
# Enter: feature/user-dashboard
# Enter: main (base branch)
# Install deps: y

# 2. Start development
cd ./tree/feature-user-dashboard/
claude code
# "Let's build the user dashboard feature"

# 3. Develop, test, commit
git add .
git commit -m "feat: Add user dashboard"
git push origin feature/user-dashboard

# 4. Create PR
gh pr create --title "Add user dashboard" --body "..."

# 5. After merge, cleanup
cd ../../
git worktree remove ./tree/feature-user-dashboard
```

### Bug Fix

```bash
# 1. Create worktree
git worktree add -b bugfix/login-error ./tree/bugfix-login

# 2. Fix bug
cd ./tree/bugfix-login/
claude code
# "Fix the login error"

# 3. Test, commit, push
npm run test
git commit -am "fix: Resolve login error"
git push origin bugfix/login-error

# 4. Create PR and cleanup after merge
```

### Parallel Development

```bash
# Start multiple features simultaneously
git worktree add -b feature/api ./tree/feature-api
git worktree add -b feature/ui ./tree/feature-ui
git worktree add -b feature/docs ./tree/feature-docs

# Open 3 Claude sessions, one for each
# Develop all three in parallel
# Merge independently when ready
```

## Troubleshooting

### Issue: Worktree already exists

```bash
# Solution
git worktree remove ./tree/<name>
git worktree add ./tree/<name> <branch>
```

### Issue: Branch checked out elsewhere

```bash
# Find where it's checked out
git worktree list

# Remove the existing worktree
git worktree remove ./tree/<name>
```

### Issue: Stale worktree reference

```bash
# Clean up stale references
git worktree prune

# Remove directory if it still exists
rm -rf ./tree/<name>
```

### Issue: Too much disk space

```bash
# Use pnpm instead of npm
cd ./tree/feature-name/
pnpm install

# Or cleanup old worktrees
./scripts/cleanup-worktrees.sh

# Remove node_modules from inactive worktrees
rm -rf ./tree/old-feature/node_modules
```

### Issue: Git operations slow

```bash
# Regular cleanup
git worktree prune
git maintenance run

# Remove old worktrees
./scripts/cleanup-worktrees.sh
```

## File Locations

```
/ultima copy/                        # Main worktree
├── tree/                           # All feature worktrees
│   ├── feature-auth/              # Auth feature
│   ├── feature-payments/          # Payments feature
│   ├── bugfix-login/              # Login bug fix
│   └── experiment-ui/             # UI experiment
├── docs/
│   ├── WORKTREE_WORKFLOW.md       # Full guide
│   └── WORKTREE_CHEATSHEET.md     # This file
├── scripts/
│   ├── cleanup-worktrees.sh       # Cleanup merged worktrees
│   ├── worktree-status.sh         # Show status overview
│   └── create-branch-worktree.sh  # Interactive creation
└── create-worktrees.sh            # Create from open PRs
```

## Pro Tips

### 1. Descriptive Names
```bash
# Good
./tree/feature-oauth-integration
./tree/bugfix-payment-validation
./tree/refactor-api-endpoints

# Bad
./tree/fix
./tree/test
./tree/branch1
```

### 2. Regular Cleanup
```bash
# After merging PRs, cleanup weekly
./scripts/cleanup-worktrees.sh
```

### 3. Status Checks
```bash
# Before starting work, check status
./scripts/worktree-status.sh
```

### 4. Isolated Dependencies
```bash
# Each worktree can have different dependencies
cd ./tree/feature-new/
npm install new-package@latest

# Main worktree unaffected
```

### 5. Parallel Testing
```bash
# Terminal 1: Test feature A
cd ./tree/feature-a/ && npm test

# Terminal 2: Test feature B
cd ./tree/feature-b/ && npm test

# Terminal 3: Keep coding
cd ./tree/feature-c/ && claude code
```

### 6. Safe Experiments
```bash
# Try risky changes without affecting main work
git worktree add -b experiment ./tree/experiment
cd ./tree/experiment/

# If it fails, just remove the worktree
cd ../../ && git worktree remove ./tree/experiment
```

### 7. Code Review Flow
```bash
# Terminal 1: Review PRs in main worktree
cd /ultima\ copy/
gh pr checkout 123
claude code  # "Review this PR"

# Terminal 2: Continue development
cd ./tree/feature-active/
claude code  # "Keep working on feature"
```

## Resources

- Full guide: `docs/WORKTREE_WORKFLOW.md`
- Git worktrees docs: `git help worktree`
- Claude Code docs: `claude code --help`

---

**Remember:**
- One branch per worktree
- One focused task per Claude session
- Regular cleanup prevents clutter
- Clear context = better Claude assistance
