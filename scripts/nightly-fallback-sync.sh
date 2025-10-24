#!/bin/bash

# Nightly Fallback Sync Script
# Runs a full sync from Airtable to Supabase to catch any missed webhook updates
# This should be run daily via cron (e.g., at 2 AM)

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Log file
LOG_DIR="$PROJECT_ROOT/logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/nightly-sync-$(date +%Y%m%d).log"

# Function to log messages
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} ✅ $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} ❌ $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} ⚠️  $1" | tee -a "$LOG_FILE"
}

# Check required environment variables
check_env_vars() {
    log "Checking environment variables..."

    if [ -z "${AIRTABLE_API_KEY:-}" ]; then
        log_error "AIRTABLE_API_KEY is not set"
        return 1
    fi

    if [ -z "${SUPABASE_SERVICE_KEY:-}" ]; then
        log_error "SUPABASE_SERVICE_KEY is not set"
        return 1
    fi

    if [ -z "${SUPABASE_URL:-}" ]; then
        log_warning "SUPABASE_URL is not set, using default"
        export SUPABASE_URL="https://jjepfehmuybpctdzipnu.supabase.co"
    fi

    log_success "Environment variables validated"
    return 0
}

# Load environment variables from .env file if it exists
load_env_file() {
    if [ -f "$PROJECT_ROOT/.env" ]; then
        log "Loading environment variables from .env file..."
        set -a
        source "$PROJECT_ROOT/.env"
        set +a
        log_success "Environment variables loaded from .env"
    else
        log_warning "No .env file found at $PROJECT_ROOT/.env"
    fi
}

# Run the sync
run_sync() {
    log "Starting nightly fallback sync..."
    log "Project root: $PROJECT_ROOT"

    cd "$PROJECT_ROOT"

    # Run the sync script without image upload (faster)
    export UPLOAD_IMAGES=false

    if node populate-cache-from-airtable.cjs 2>&1 | tee -a "$LOG_FILE"; then
        log_success "Sync completed successfully"
        return 0
    else
        log_error "Sync failed with exit code $?"
        return 1
    fi
}

# Invalidate rapid-processor cache after sync
invalidate_cache() {
    log "Invalidating rapid-processor cache..."

    local response
    response=$(curl -s -w "\n%{http_code}" -X POST \
        "${SUPABASE_URL}/functions/v1/rapid-processor/invalidate-cache" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY:-}")

    local http_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | sed '$d')

    if [ "$http_code" = "200" ]; then
        log_success "Cache invalidated successfully"
        return 0
    else
        log_warning "Cache invalidation failed with HTTP $http_code"
        log_warning "Response: $body"
        return 1
    fi
}

# Send notification (optional - implement based on your needs)
send_notification() {
    local status=$1
    local message=$2

    log "Notification: [$status] $message"

    # TODO: Implement email/Slack/Discord notification here
    # Example:
    # curl -X POST https://hooks.slack.com/... -d "{\"text\":\"$message\"}"
}

# Cleanup old logs (keep last 30 days)
cleanup_old_logs() {
    log "Cleaning up old logs..."
    find "$LOG_DIR" -name "nightly-sync-*.log" -mtime +30 -delete 2>/dev/null || true
    log_success "Old logs cleaned up"
}

# Main execution
main() {
    log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log "🌙 Nightly Fallback Sync Started"
    log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    local start_time=$(date +%s)
    local exit_code=0

    # Load environment
    load_env_file

    # Check environment variables
    if ! check_env_vars; then
        log_error "Environment validation failed"
        send_notification "ERROR" "Nightly sync failed: Missing environment variables"
        exit 1
    fi

    # Run sync
    if run_sync; then
        log_success "Sync operation completed"

        # Invalidate cache
        invalidate_cache || log_warning "Cache invalidation failed (non-critical)"

        send_notification "SUCCESS" "Nightly sync completed successfully"
    else
        exit_code=1
        log_error "Sync operation failed"
        send_notification "ERROR" "Nightly sync failed - check logs at $LOG_FILE"
    fi

    # Cleanup
    cleanup_old_logs

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log "🏁 Nightly Fallback Sync Finished"
    log "Duration: ${duration}s"
    log "Log file: $LOG_FILE"
    log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    exit $exit_code
}

# Run main function
main "$@"
