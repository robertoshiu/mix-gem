# Mix-GEM Backup & Restore

Automated backup and restore tools for the Mix-GEM production stack.

## Features

- **PostgreSQL Database Backup**: Full database dumps with compression
- **Redis Data Backup**: RDB snapshots with compression
- **Docker Volumes Backup**: All persistent volumes (Prometheus, Grafana, RAG storage)
- **Automated Cleanup**: Configurable retention period
- **Integrity Verification**: Automatic validation of backup archives
- **Easy Restore**: Interactive restore tool with safety confirmations

## Quick Start

### Manual Backup

Run a one-time backup:

```bash
docker-compose -f docker-compose.prod.yml run --rm backup
```

Or use the script directly:

```bash
./backup/backup.sh
```

### Scheduled Backups (Cron)

Add to crontab for daily backups at 2 AM:

```bash
0 2 * * * cd /path/to/equipment-monitor && docker-compose -f docker-compose.prod.yml run --rm backup
```

### Restore from Backup

List available backups:

```bash
./backup/restore.sh
```

Restore a specific backup:

```bash
./backup/restore.sh 20260128_120000
```

## Configuration

Environment variables (set in `.env` or docker-compose):

| Variable | Default | Description |
|----------|---------|-------------|
| `BACKUP_DIR` | `/backup` | Backup storage directory |
| `RETENTION_DAYS` | `30` | Days to keep backups |
| `POSTGRES_HOST` | `postgres` | PostgreSQL hostname |
| `POSTGRES_PORT` | `5432` | PostgreSQL port |
| `POSTGRES_USER` | `mixgem` | PostgreSQL username |
| `POSTGRES_PASSWORD` | *(required)* | PostgreSQL password |
| `REDIS_HOST` | `redis` | Redis hostname |
| `REDIS_PORT` | `6379` | Redis port |

## Backup Contents

Each backup creates three files:

1. **postgres_TIMESTAMP.sql.gz**: Compressed PostgreSQL dump
2. **redis_TIMESTAMP.rdb.gz**: Compressed Redis snapshot
3. **volumes_TIMESTAMP.tar.gz**: Compressed Docker volumes archive

Example:
```
/backup/
├── postgres_20260128_120000.sql.gz
├── redis_20260128_120000.rdb.gz
├── volumes_20260128_120000.tar.gz
└── backup_20260128_120000.log
```

## Backed-Up Volumes

- `mixgem_pgdata` - PostgreSQL data
- `mixgem_redisdata` - Redis data
- `mixgem_prometheus_data` - Prometheus metrics
- `mixgem_grafana_data` - Grafana dashboards and config
- `mixgem_rag_storage` - RAG engine storage

## Backup Process

1. **PostgreSQL**: Uses `pg_dump` with custom format and compression
2. **Redis**: Triggers `SAVE` command and copies RDB file
3. **Volumes**: Creates tar archives of all volume data
4. **Verification**: Validates all archives for integrity
5. **Cleanup**: Removes backups older than retention period

## Restore Process

1. **List Backups**: Shows all available backup timestamps
2. **Select Backup**: Choose which backup to restore
3. **Confirmation**: Safety prompts before overwriting data
4. **PostgreSQL Restore**: Drops and recreates database, then imports dump
5. **Redis Restore**: Stops container, replaces RDB file, restarts
6. **Volumes Restore**: Recreates volumes with backed-up data

## Best Practices

### Production Backups

1. **Store offsite**: Mount external storage or cloud bucket to `/backup`
2. **Monitor backups**: Check logs for failures
3. **Test restores**: Regularly verify backup integrity
4. **Encrypt sensitive backups**: Use GPG or similar for encryption

### Backup Storage

Mount a persistent volume or external storage:

```yaml
services:
  backup:
    volumes:
      - /mnt/backup:/backup  # External storage
      # or
      - backup_storage:/backup  # Named volume
```

### Encryption (Optional)

Encrypt backups with GPG:

```bash
# Encrypt
gpg --symmetric --cipher-algo AES256 postgres_20260128_120000.sql.gz

# Decrypt
gpg --decrypt postgres_20260128_120000.sql.gz.gpg > postgres_20260128_120000.sql.gz
```

## Monitoring

Check backup logs:

```bash
tail -f /backup/backup_*.log
```

Backup metrics are exposed to Prometheus (if enabled):
- Backup duration
- Backup size
- Success/failure status

## Troubleshooting

### Backup fails with "POSTGRES_PASSWORD is required"

Set the password in `.env`:
```bash
POSTGRES_PASSWORD=your_secure_password
```

### Redis backup shows "container may not be running"

This is expected if Redis is not part of your active profiles. The backup will continue without Redis data.

### Volume backup fails

Ensure Docker has permissions to access volumes:
```bash
docker volume ls
docker volume inspect mixgem_pgdata
```

### Restore fails with permission errors

Run restore script with appropriate permissions or use Docker:
```bash
docker-compose -f docker-compose.prod.yml run --rm backup ./restore.sh TIMESTAMP
```

## Security

- **Never commit `.env` files** with passwords
- **Restrict backup directory access**: `chmod 700 /backup`
- **Encrypt backups** containing sensitive data
- **Use strong PostgreSQL passwords**: 32+ characters, mixed case, numbers, symbols
- **Rotate backup encryption keys** regularly

## Advanced Usage

### Backup to S3

```bash
# Install AWS CLI in backup container
# Then sync to S3 after backup
aws s3 sync /backup s3://your-bucket/mixgem-backups/
```

### Selective Restore

Restore only PostgreSQL:

```bash
# Modify restore.sh to skip Redis/volumes prompts
# Or use pg_restore directly:
gunzip -c postgres_20260128_120000.sql.gz | \
  pg_restore -h localhost -U mixgem -d mixgem
```

### Point-in-Time Recovery

For PostgreSQL PITR, enable WAL archiving in `docker-compose.prod.yml`:

```yaml
postgres:
  command: >
    postgres
    -c wal_level=replica
    -c archive_mode=on
    -c archive_command='cp %p /var/lib/postgresql/wal_archive/%f'
```

## Support

For issues or questions:
- Check logs: `/backup/backup_*.log`
- Verify configuration: `.env` file
- Test connectivity: `docker-compose ps`
- Review Docker logs: `docker-compose logs backup`
