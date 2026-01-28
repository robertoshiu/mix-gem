#!/bin/bash
# Mix-GEM Production Stack - Backup Script
# Backs up PostgreSQL database, Redis data, and Docker volumes

set -euo pipefail

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/backup}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.log"

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
NC='\033[0m' # No Color

# Logging functions
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] SUCCESS: $*${NC}" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $*${NC}" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $*${NC}" | tee -a "$LOG_FILE"
}

# Create backup directory
mkdir -p "$BACKUP_DIR"

log "=== Mix-GEM Backup Started ==="
log "Timestamp: $TIMESTAMP"
log "Backup Directory: $BACKUP_DIR"
log "Retention: $RETENTION_DAYS days"

# Backup PostgreSQL
backup_postgres() {
    log "Starting PostgreSQL backup..."

    local backup_file="${BACKUP_DIR}/postgres_${TIMESTAMP}.sql.gz"

    if pg_dump -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
        --format=custom --compress=9 --verbose 2>&1 | gzip > "$backup_file"; then
        local size=$(du -h "$backup_file" | cut -f1)
        log_success "PostgreSQL backup completed: $backup_file ($size)"
        return 0
    else
        log_error "PostgreSQL backup failed"
        return 1
    fi
}

# Backup Redis
backup_redis() {
    log "Starting Redis backup..."

    local backup_file="${BACKUP_DIR}/redis_${TIMESTAMP}.rdb"

    # Trigger Redis save
    if redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" SAVE > /dev/null 2>&1; then
        # Copy the RDB file
        if docker cp mixgem_redis:/data/dump.rdb "$backup_file" 2>/dev/null; then
            gzip "$backup_file"
            local size=$(du -h "${backup_file}.gz" | cut -f1)
            log_success "Redis backup completed: ${backup_file}.gz ($size)"
            return 0
        else
            log_warning "Redis backup: could not copy RDB file (container may not be running)"
            return 1
        fi
    else
        log_warning "Redis backup: could not trigger SAVE command"
        return 1
    fi
}

# Backup Docker volumes
backup_volumes() {
    log "Starting Docker volumes backup..."

    local volumes=(
        "mixgem_pgdata"
        "mixgem_redisdata"
        "mixgem_prometheus_data"
        "mixgem_grafana_data"
        "mixgem_rag_storage"
    )

    local volume_backup_dir="${BACKUP_DIR}/volumes_${TIMESTAMP}"
    mkdir -p "$volume_backup_dir"

    local success_count=0
    local total_count=${#volumes[@]}

    for volume in "${volumes[@]}"; do
        log "Backing up volume: $volume"
        local tar_file="${volume_backup_dir}/${volume}.tar.gz"

        if docker run --rm \
            -v "$volume:/data:ro" \
            -v "$volume_backup_dir:/backup" \
            alpine tar czf "/backup/${volume}.tar.gz" -C /data . 2>/dev/null; then
            local size=$(du -h "$tar_file" | cut -f1)
            log_success "Volume backup completed: $volume ($size)"
            ((success_count++))
        else
            log_warning "Volume backup failed or skipped: $volume (may not exist)"
        fi
    done

    log "Volume backup summary: $success_count/$total_count volumes backed up"

    # Create volume backup archive
    local volumes_archive="${BACKUP_DIR}/volumes_${TIMESTAMP}.tar.gz"
    tar czf "$volumes_archive" -C "$BACKUP_DIR" "volumes_${TIMESTAMP}"
    rm -rf "$volume_backup_dir"

    local size=$(du -h "$volumes_archive" | cut -f1)
    log_success "Volumes archive created: $volumes_archive ($size)"
}

# Cleanup old backups
cleanup_old_backups() {
    log "Cleaning up backups older than $RETENTION_DAYS days..."

    local deleted_count=0

    # Find and delete old backup files
    while IFS= read -r file; do
        rm -f "$file"
        log "Deleted old backup: $(basename "$file")"
        ((deleted_count++))
    done < <(find "$BACKUP_DIR" -type f \( -name "*.sql.gz" -o -name "*.rdb.gz" -o -name "volumes_*.tar.gz" \) -mtime "+$RETENTION_DAYS")

    # Delete old log files
    find "$BACKUP_DIR" -type f -name "backup_*.log" -mtime "+$RETENTION_DAYS" -delete

    if [ $deleted_count -gt 0 ]; then
        log_success "Cleanup completed: $deleted_count old backups deleted"
    else
        log "No old backups to delete"
    fi
}

# Verify backup integrity
verify_backup() {
    log "Verifying backup integrity..."

    local postgres_backup="${BACKUP_DIR}/postgres_${TIMESTAMP}.sql.gz"
    local volumes_backup="${BACKUP_DIR}/volumes_${TIMESTAMP}.tar.gz"

    local verified=0

    # Verify PostgreSQL backup
    if [ -f "$postgres_backup" ]; then
        if gzip -t "$postgres_backup" 2>/dev/null; then
            log_success "PostgreSQL backup verified: valid gzip archive"
            ((verified++))
        else
            log_error "PostgreSQL backup verification failed: corrupted archive"
        fi
    fi

    # Verify volumes backup
    if [ -f "$volumes_backup" ]; then
        if tar tzf "$volumes_backup" > /dev/null 2>&1; then
            log_success "Volumes backup verified: valid tar archive"
            ((verified++))
        else
            log_error "Volumes backup verification failed: corrupted archive"
        fi
    fi

    log "Verification complete: $verified archives verified"
}

# Main backup process
main() {
    local exit_code=0

    # Run backups
    backup_postgres || exit_code=1
    backup_redis || exit_code=1
    backup_volumes || exit_code=1

    # Verify backups
    verify_backup

    # Cleanup old backups
    cleanup_old_backups

    # Calculate total backup size
    local total_size=$(du -sh "$BACKUP_DIR" | cut -f1)

    log "=== Mix-GEM Backup Completed ==="
    log "Total backup size: $total_size"
    log "Log file: $LOG_FILE"

    if [ $exit_code -eq 0 ]; then
        log_success "All backups completed successfully"
    else
        log_warning "Some backups failed or were skipped (see log for details)"
    fi

    return $exit_code
}

# Run main function
main
exit $?
