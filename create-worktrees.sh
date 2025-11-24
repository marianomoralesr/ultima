#!/bin/bash

# Create the tree directory if it doesn't exist
mkdir -p ./tree

# List all open PRs and create worktrees for each branch
gh pr list --json headRefName --jq '.[].headRefName' | while read branch; do
  # Handle branch names with slashes (like "feature/foo")
  branch_path="./tree/${branch}"

  # For branches with slashes, create the directory structure
  if [[ "$branch" == */* ]]; then
    dir_path=$(dirname "$branch_path")
    mkdir -p "$dir_path"
  fi

  # Check if worktree already exists
  if [ ! -d "$branch_path" ]; then
    echo "Creating worktree for $branch"
    git worktree add "$branch_path" "$branch"
  else
    echo "Worktree for $branch already exists"
  fi
done

# Display all created worktrees
echo ""
echo "Worktree list:"
git worktree list
