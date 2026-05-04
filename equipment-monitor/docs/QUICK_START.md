# Quick Start Guide

Get Mix-GEM production stack running in 5 minutes.

## 1. Prerequisites Check

```bash
# Verify Docker is installed
docker --version
# Expected: Docker version 20.10+

# Verify Docker Compose is installed
docker-compose --version
# Expected: Docker Compose version 2.0+

# Verify Docker daemon is running
docker ps
# Should show running containers or empty list
```

## 2. Clone and Configure

```bash
# Clone repository
git clone <repository-url>
cd equipment-monitor

# Create environment file
cp .env.example .env

# Generate secure passwords
openssl rand -base64 32  # For POSTGRES_PASSWORD
openssl rand -base64 32  # For GRAFANA_ADMIN_PASSWORD

# Edit .env with your values
nano .env
```

**Minimum required changes in `.env`**:
- `POSTGRES_PASSWORD=<generated-password>`
- `GRAFANA_ADMIN_PASSWORD=<generated-password>`

## 3. Choose Your Stack

### Option A: Interactive Setup (Recommended)

```bash
./start-stack.sh
```

Follow the prompts to select profiles.

### Option B: Manual Setup

**SECS/GEM Monitoring** (most common):
```bash
export COMPOSE_PROFILES=scavenger,monitoring
docker-compose -f docker-compose.prod.yml up -d
```

**AI/RAG Stack**:
```bash
# First, set ANTHROPIC_API_KEY in .env
export COMPOSE_PROFILES=rag,monitoring
docker-compose -f docker-compose.prod.yml up -d
```

**Full Production Stack**:
```bash
export COMPOSE_PROFILES=scavenger,rag,monitoring,gateway
docker-compose -f docker-compose.prod.yml up -d
```

## 4. Verify Services

```bash
# Check all services are running
docker-compose -f docker-compose.prod.yml ps

# Check logs
docker-compose -f docker-compose.prod.yml logs -f
```

## 5. Access Services

| Service | URL | Credentials |
|---------|-----|-------------|
| Grafana | http://localhost:3001 | admin / (GRAFANA_ADMIN_PASSWORD) |
| Prometheus | http://localhost:9090 | None |
| Scavenger API | http://localhost:8000/docs | None |
| RAG Engine | http://localhost:8001/docs | None |

## Common Use Cases

### Development/Testing

```bash
# Start with monitoring only
export COMPOSE_PROFILES=monitoring
docker-compose -f docker-compose.prod.yml up -d

# Access Grafana to see system metrics
open http://localhost:3001
```

### SECS/GEM Equipment Integration

```bash
# Start SECS/GEM stack
export COMPOSE_PROFILES=scavenger,simulator,monitoring
docker-compose -f docker-compose.prod.yml up -d

# Simulator listens on:
# - HSMS Passive: localhost:5000
# - HSMS Active: localhost:5001

# Send events to Scavenger API:
curl -X POST http://localhost:8000/events \
  -H "Content-Type: application/json" \
  -d '{"equipment_id": "LITHO01", "event_type": "S6F11", "data": {}}'
```

### AI/RAG Document Q&A

```bash
# Ensure ANTHROPIC_API_KEY is set in .env
export COMPOSE_PROFILES=rag,monitoring
docker-compose -f docker-compose.prod.yml up -d

# Query API
curl -X POST http://localhost:8001/query \
  -H "Content-Type: application/json" \
  -d '{"question": "What is SECS/GEM?", "context": []}'
```

### Production with SSL

```bash
# 1. Set up SSL certificates (self-signed for dev)
mkdir -p nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem -out nginx/ssl/cert.pem \
  -subj "/CN=localhost"

# 2. Start with gateway profile
export COMPOSE_PROFILES=scavenger,monitoring,gateway
docker-compose -f docker-compose.prod.yml up -d

# 3. Access via Nginx
# HTTP: http://localhost
# HTTPS: https://localhost
# Grafana: https://localhost/grafana/
```

## Troubleshooting

### Port Already in Use

```bash
# Change ports in .env
POSTGRES_PORT=5433
REDIS_PORT=6380
GRAFANA_PORT=3002
```

### Service Not Starting

```bash
# Check logs for specific service
docker-compose -f docker-compose.prod.yml logs postgres
docker-compose -f docker-compose.prod.yml logs grafana

# Restart service
docker-compose -f docker-compose.prod.yml restart <service-name>
```

### Out of Memory

```bash
# Check Docker resource limits
docker info | grep -i memory

# Reduce services or increase Docker memory allocation
# Docker Desktop: Settings → Resources → Memory
```

### Permission Denied

```bash
# Make scripts executable
chmod +x start-stack.sh
chmod +x backup/backup.sh
chmod +x backup/restore.sh
```

## Next Steps

1. **Configure Monitoring**: Add Grafana notification channels
2. **Set Up Backups**: Schedule automated backups with cron
3. **Review Security**: Follow production security checklist in DEPLOYMENT.md
4. **Scale Resources**: Adjust resource limits based on load
5. **Customize Dashboards**: Create custom Grafana dashboards

## Stop Services

```bash
# Stop all services
docker-compose -f docker-compose.prod.yml down

# Stop and remove volumes (CAUTION: destroys data)
docker-compose -f docker-compose.prod.yml down -v
```

## Backup and Restore

```bash
# Create backup
docker-compose -f docker-compose.prod.yml --profile backup run --rm backup

# List backups
./backup/restore.sh

# Restore backup
./backup/restore.sh 20260128_120000
```

## Support

- **Full Documentation**: See README.md and docs/
- **Deployment Guide**: docs/DEPLOYMENT.md
- **Monitoring Guide**: docs/MONITORING.md
- **Validation Report**: docs/VALIDATION_REPORT.md
