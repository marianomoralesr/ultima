#!/bin/bash
# Generate version string for deployment
# Format: beta-<git-short-hash>
# This ensures staging and production have identical builds

GIT_HASH=$(git rev-parse --short HEAD 2>/dev/null || echo "dev")

echo "beta-${GIT_HASH}"
