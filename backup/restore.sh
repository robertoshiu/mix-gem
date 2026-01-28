#!/bin/bash
# Mix-GEM Production Stack - Restore Script
# Restores PostgreSQL database, Redis data, and Docker volumes from backup

set -euo pipefail

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/backup}"
RESTORE_TIMESTAMP="${1:-}"

# PostgreSQL configuration
POSTGRES_HOST="${POSTGRES_HOST:-postgres}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_USER="${POSTGRES_USER:-mixgem}"
POSTGRES_DB="${POSTGRES_DB:-mixgem}"
PGPASSWORD="${POSTGRES_PASSWORD:?POSTGRES_PASSWORD is required}"
export PGPASSWORD

# Redis configuration
REDIS_HOST="${REDIS_HOST:-redis}"
REDIS_PORT="${REDIS_PORT:-6379}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] $*${NC}"
}

log_success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] SUCCESS: $*${NC}"
}

log_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $*${NC}"
}

log_warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $*${NC}"
}

# List available backups
list_backups() {
    log "Available backups:"
    echo ""

    local backups=$(find "$BACKUP_DIR" -type f -name "postgres_*.sql.gz" | sort -r)

    if [ -z "$backups" ]; then
        log_error "No backups found in $BACKUP_DIR"
        exit 1
    fi

    local count=1
    while IFS= read -r backup; do
        local timestamp=$(basename "$backup" | sed 's/postgres_\(.*\)\.sql\.gz/\1/')
        local size=$(du -h "$backup" | cut -f1)
        local date=$(echo "$timestamp" | sed 's/\([0-9]\{8\}\)_\([0-9]\{6\}\)/\1 \2/')
        echo "  [$count] $date ($size)"
        ((count++))
    done <<< "$backups"

    echo ""
}

# Restore PostgreSQL
restore_postgres() {
    local backup_file="$1"

    log "Restoring PostgreSQL from: $backup_file"
    log_warning "This will OVERWRITE the current database!"

    read -p "Continue? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        log "Restore cancelled"
        exit 0
    fi

    # Drop existing connections
    log "Terminating active connections..."
    psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d postgres -c \
        "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$POSTGRES_DB' AND pid <> pg_backend_pid();" \
        2>/dev/null || true

    # Drop and recreate database
    log "Recreating database..."
    psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d postgres -c \
        "DROP DATABASE IF EXISTS $POSTGRES_DB;" 2>/dev/null || true
    psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d postgres -c \
        "CREATE DATABASE $POSTGRES_DB;" 2>/dev/null || true

    # Restore from backup
    log "Restoring data..."
    if gunzip -c "$backup_file" | pg_restore -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" \
        -U "$POSTGRES_USER" -d "$POSTGRES_DB" --verbose 2>&1; then
        log_success "PostgreSQL restore completed"
        return 0
    else
        log_error "PostgreSQL restore failed"
        return 1
    fi
}

# Restore Redis
restore_redis() {
    local backup_file="$1"

    log "Restoring Redis from: $backup_file"
    log_warning "This will OVERWRITE the current Redis data!"

    read -p "Continue? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        log "Restore cancelled"
        exit 0
    fi

    # Stop Redis container
    log "Stopping Redis container..."
    docker stop mixgem_redis 2>/dev/null || true

    # Extract and copy RDB file
    local temp_dir=$(mktemp -d)
    gunzip -c "$backup_file" > "$temp_dir/dump.rdb"

    log "Copying RDB file to Redis container..."
    docker cp "$temp_dir/dump.rdb" mixgem_redis:/data/dump.rdb

    # Cleanup
    rm -rf "$temp_dir"

    # Start Redis container
    log "Starting Redis container..."
    docker start mixgem_redis

    log_success "Redis restore completed"
}

# Restore Docker volumes
restore_volumes() {
    local backup_file="$1"

    log "Restoring Docker volumes from: $backup_file"
    log_warning "This will OVERWRITE the current volume data!"

    read -p "Continue? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        log "Restore cancelled"
        exit 0
    fi

    # Extract archive
    local temp_dir=$(mktemp -d)
    tar xzf "$backup_file" -C "$temp_dir"

    # Restore each volume
    local volumes_dir="$temp_dir/$(basename "$backup_file" .tar.gz)"

    for volume_tar in "$volumes_dir"/*.tar.gz; do
        local volume_name=$(basename "$volume_tar" .tar.gz)
        log "Restoring volume: $volume_name"

        # Remove existing volume and create new one
        docker volume rm "$volume_name" 2>/dev/null || true
        docker volume create "$volume_name" > /dev/null

        # Restore data
        docker run --rm \
            -v "$volume_name:/data" \
            -v "$volumes_dir:/backup:ro" \
            alpine sh -c "cd /data && tar xzf /backup/${volume_name}.tar.gz"

        log_success "Volume restored: $volume_name"
    done

    # Cleanup
    rm -rf "$temp_dir"

    log_success "Volumes restore completed"
}

# Main restore process
main() {
    log "=== Mix-GEM Restore Tool ==="

    # Show available backups if no timestamp provided
    if [ -z "$RESTORE_TIMESTAMP" ]; then
        list_backups
        echo "Usage: $0 <timestamp>"
        echo "Example: $0 20260128_120000"
        exit 1
    fi

    # Check if backup exists
    local postgres_backup="${BACKUP_DIR}/postgres_${RESTORE_TIMESTAMP}.sql.gz"
    local redis_backup="${BACKUP_DIR}/redis_${RESTORE_TIMESTAMP}.rdb.gz"
    local volumes_backup="${BACKUP_DIR}/volumes_${RESTORE_TIMESTAMP}.tar.gz"

    if [ ! -f "$postgres_backup" ]; then
        log_error "PostgreSQL backup not found: $postgres_backup"
        list_backups
        exit 1
    fi

    log "Restore timestamp: $RESTORE_TIMESTAMP"
    echo ""
    log "Available backups:"
    [ -f "$postgres_backup" ] && echo "  - PostgreSQL: $(du -h "$postgres_backup" | cut -f1)"
    [ -f "$redis_backup" ] && echo "  - Redis: $(du -h "$redis_backup" | cut -f1)"
    [ -f "$volumes_backup" ] && echo "  - Volumes: $(du -h "$volumes_backup" | cut -f1)"
    echo ""

    # Restore PostgreSQL
    if [ -f "$postgres_backup" ]; then
        restore_postgres "$postgres_backup"
    fi

    # Restore Redis (optional)
    if [ -f "$redis_backup" ]; then
        read -p "Restore Redis data? (yes/no): " confirm
        if [ "$confirm" = "yes" ]; then
            restore_redis "$redis_backup"
        fi
    fi

    # Restore volumes (optional)
    if [ -f "$volumes_backup" ]; then
        read -p "Restore Docker volumes? (yes/no): " confirm
        if [ "$confirm" = "yes" ]; then
            restore_volumes "$volumes_backup"
        fi
    fi

    log_success "=== Restore Completed ==="
    log "Please restart services to apply changes"
}

# Run main function
main
