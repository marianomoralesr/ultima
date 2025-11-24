#!/bin/bash

echo "=== 📊 Worktree Status Overview ==="
echo ""

# Store the original directory
original_dir=$(pwd)

git worktree list | while read -r line; do
  worktree=$(echo "$line" | awk '{print $1}')
  commit=$(echo "$line" | awk '{print $2}')
  branch=$(echo "$line" | grep -o '\[.*\]' | tr -d '[]')

  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "📁 $worktree"
  echo "🌿 Branch: $branch"
  echo "📌 Commit: $commit"

  cd "$worktree"

  # Check for uncommitted changes
  status_output=$(git status -s)
  if [[ -n "$status_output" ]]; then
    echo "⚠️  Uncommitted changes:"
    echo "$status_output" | head -5
    change_count=$(echo "$status_output" | wc -l | tr -d ' ')
    if [ "$change_count" -gt 5 ]; then
      echo "   ... and $((change_count - 5)) more"
    fi
  else
    echo "✅ Clean working directory"
  fi

  # Check commits ahead/behind main
  if [ "$branch" != "main" ] && [ -n "$branch" ]; then
    git fetch origin main 2>/dev/null
    ahead_behind=$(git rev-list --left-right --count origin/main...HEAD 2>/dev/null)
    if [[ -n "$ahead_behind" ]]; then
      behind=$(echo "$ahead_behind" | awk '{print $1}')
      ahead=$(echo "$ahead_behind" | awk '{print $2}')
      echo "📊 $behind commits behind, $ahead commits ahead of main"
    fi
  fi

  # Check if node_modules exists
  if [ -d "node_modules" ]; then
    size=$(du -sh node_modules 2>/dev/null | awk '{print $1}')
    echo "📦 node_modules: $size"
  fi

  echo ""
  cd "$original_dir"
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 Quick actions:"
echo "   • Remove a worktree: git worktree remove ./tree/<name>"
echo "   • Cleanup merged:    ./scripts/cleanup-worktrees.sh"
echo "   • Create worktree:   git worktree add ./tree/<name> <branch>"
