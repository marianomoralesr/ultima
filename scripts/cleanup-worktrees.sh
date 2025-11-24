#!/bin/bash

echo "🧹 Cleaning up merged worktrees..."
echo ""

# Get all merged branches
merged_branches=$(git branch --merged main | grep -v "main" | grep -v "*" | sed 's/^[* ]*//')

if [ -z "$merged_branches" ]; then
  echo "No merged branches found."
else
  echo "Found merged branches:"
  echo "$merged_branches"
  echo ""

  for branch in $merged_branches; do
    # Check if worktree exists for this branch
    worktree_path="./tree/${branch}"

    if [ -d "$worktree_path" ]; then
      echo "📦 Removing merged worktree: $worktree_path"
      git worktree remove "$worktree_path" 2>/dev/null
      if [ $? -eq 0 ]; then
        echo "🗑️  Deleting branch: $branch"
        git branch -d "$branch" 2>/dev/null
      fi
    fi
  done
fi

echo ""
echo "🔧 Pruning stale worktree references..."
git worktree prune

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "📋 Remaining worktrees:"
git worktree list
