#!/bin/bash
# ========================================
# Database Configuration Helper
# ========================================
# This script provides database configuration
# for all database-related scripts
# ========================================

# Load from scripts/.env if it exists
if [ -f "$(dirname "$0")/.env" ]; then
    source "$(dirname "$0")/.env"
fi

# Database configuration with environment variable fallbacks
export DB_HOST="${DB_HOST:-db.jjepfehmuybpctdzipnu.supabase.co}"
export DB_PORT="${DB_PORT:-5432}"
export DB_USER="${DB_USER:-postgres}"
export DB_NAME="${DB_NAME:-postgres}"

# Check if password is set
if [ -z "$DB_PASSWORD" ]; then
    echo "ERROR: DB_PASSWORD environment variable is not set!"
    echo ""
    echo "Please set it by either:"
    echo "  1. Creating scripts/.env and adding: DB_PASSWORD=your-password"
    echo "  2. Running: export DB_PASSWORD=your-password"
    echo "  3. Passing inline: DB_PASSWORD=your-password ./scripts/your-script.sh"
    echo ""
    exit 1
fi

export PGPASSWORD="$DB_PASSWORD"
