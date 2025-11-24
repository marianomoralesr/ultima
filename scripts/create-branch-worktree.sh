#!/bin/bash

# Ensure we're in a git repository
if ! git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
  echo "❌ Error: Not in a git repository"
  exit 1
fi

# Get the repository root
repo_root=$(git rev-parse --show-toplevel)

echo "🌿 Create New Branch and Worktree"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Prompt for branch name
read -p "Enter new branch name: " branch_name

# Validate branch name (basic validation)
if [[ -z "$branch_name" ]]; then
  echo "❌ Error: Branch name cannot be empty"
  exit 1
fi

# Check if branch already exists
if git show-ref --verify --quiet "refs/heads/$branch_name"; then
  echo "⚠️  Warning: Branch '$branch_name' already exists"
  read -p "Do you want to use the existing branch? (y/n): " use_existing
  if [[ "$use_existing" != "y" ]]; then
    exit 1
  fi
  create_new=false
else
  create_new=true
fi

# Prompt for base branch if creating new
if [ "$create_new" = true ]; then
  read -p "Enter base branch/commit (default: main): " base_commit
  base_commit=${base_commit:-main}

  # Verify base exists
  if ! git rev-parse --verify "$base_commit" > /dev/null 2>&1; then
    echo "❌ Error: Base branch/commit '$base_commit' does not exist"
    exit 1
  fi
fi

# Create branch directory
branch_path="$repo_root/tree/$branch_name"

# Handle branch names with slashes (like "feature/foo")
if [[ "$branch_name" == */* ]]; then
  dir_path=$(dirname "$branch_path")
  mkdir -p "$dir_path"
fi

# Make sure parent directory exists
mkdir -p "$(dirname "$branch_path")"

# Check if a worktree already exists
if [ -d "$branch_path" ]; then
  echo "❌ Error: Worktree directory already exists: $branch_path"
  echo "   Remove it first with: git worktree remove ./tree/$branch_name"
  exit 1
fi

echo ""
echo "Creating worktree..."

# Create branch and worktree
if [ "$create_new" = true ]; then
  # Create new branch and worktree
  if git worktree add -b "$branch_name" "$branch_path" "$base_commit"; then
    echo ""
    echo "✅ Success! New branch and worktree created"
  else
    echo "❌ Failed to create worktree"
    exit 1
  fi
else
  # Create worktree for existing branch
  if git worktree add "$branch_path" "$branch_name"; then
    echo ""
    echo "✅ Success! Worktree created for existing branch"
  else
    echo "❌ Failed to create worktree"
    exit 1
  fi
fi

echo ""
echo "📁 Worktree location: $branch_path"
echo "🌿 Branch name: $branch_name"
echo ""
echo "💡 Next steps:"
echo "   cd $branch_path"
echo "   npm install  # Install dependencies"
echo "   claude code  # Start Claude session"
echo ""

# Ask if user wants to install dependencies
read -p "Install dependencies now? (y/n): " install_deps
if [[ "$install_deps" == "y" ]]; then
  echo ""
  echo "📦 Installing dependencies..."
  cd "$branch_path"

  if [ -f "package.json" ]; then
    if command -v pnpm &> /dev/null; then
      pnpm install
    else
      npm install
    fi
    echo "✅ Dependencies installed"
  else
    echo "⚠️  No package.json found, skipping dependency installation"
  fi
fi

echo ""
echo "🚀 Ready to start development!"
