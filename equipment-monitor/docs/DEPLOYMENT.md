# Production Deployment Guide

This guide covers deploying Mix-GEM to production environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Server Requirements](#server-requirements)
- [Installation](#installation)
- [Configuration](#configuration)
- [SSL Setup](#ssl-setup)
- [Database Initialization](#database-initialization)
- [Service Profiles](#service-profiles)
- [Deployment Strategies](#deployment-strategies)
- [Health Checks](#health-checks)
- [Scaling](#scaling)
- [Security Hardening](#security-hardening)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software

- **Docker**: 20.10 or later
- **Docker Compose**: 2.0 or later (with profiles support)
- **Git**: For repository management
- **OpenSSL**: For SSL certificate generation (development)

### Operating System

Recommended production environments:
- Ubuntu 22.04 LTS or later
- Debian 11 or later
- RHEL 8 or later
- Amazon Linux 2023

## Server Requirements

### Minimum (Development/Testing)

- **CPU**: 4 cores
- **RAM**: 8GB
- **Disk**: 50GB SSD
- **Network**: 100 Mbps

### Recommended (Production)

- **CPU**: 8+ cores
- **RAM**: 16GB (32GB for Ollama profile)
- **Disk**: 200GB SSD (NVMe preferred)
- **Network**: 1 Gbps

### Profile-Specific Requirements

| Profile | CPU | RAM | Disk | Notes |
|---------|-----|-----|------|-------|
| Core | 2 | 4GB | 20GB | PostgreSQL + Redis |
| scavenger | +1 | +2GB | +10GB | API + Recorder |
| simulator | +1 | +1GB | +5GB | SECS/GEM simulator |
| rag | +2 | +4GB | +20GB | RAG engine + embeddings |
| ollama | +4 | +8GB | +50GB | Local LLM (GPU recommended) |
| monitoring | +2 | +3GB | +30GB | Prometheus + Grafana |
| gateway | +1 | +512MB | +5GB | Nginx + Certbot |

## Installation

### 1. System Preparation

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Enable Docker service
sudo systemctl enable docker
sudo systemctl start docker

# Add current user to docker group (optional)
sudo usermod -aG docker $USER
newgrp docker
```

### 2. Clone Repository

```bash
# Clone to /opt or home directory
sudo mkdir -p /opt/mixgem
sudo chown $USER:$USER /opt/mixgem
cd /opt/mixgem

git clone <repository-url> equipment-monitor
cd equipment-monitor
```

### 3. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit with secure passwords and API keys
nano .env
```

**Required changes**:
- `POSTGRES_PASSWORD`: Strong password (32+ characters)
- `GRAFANA_ADMIN_PASSWORD`: Strong password (32+ characters)
- `ANTHROPIC_API_KEY`: Your Anthropic API key (for RAG profile)
- `CERTBOT_EMAIL`: Valid email for Let's Encrypt
- `CERTBOT_DOMAIN`: Your domain name

### 4. Generate Secure Passwords

```bash
# Generate 32-character passwords
openssl rand -base64 32

# Or use pwgen
pwgen -s 32 1
```

## Configuration

### Environment Variables

#### PostgreSQL Tuning (16GB RAM System)

```bash
POSTGRES_SHARED_BUFFERS=4GB
POSTGRES_WORK_MEM=128MB
POSTGRES_MAINTENANCE_WORK_MEM=512MB
POSTGRES_EFFECTIVE_CACHE_SIZE=12GB
POSTGRES_MAX_CONNECTIONS=200
```

#### Service Profiles

```bash
# Enable desired profiles
COMPOSE_PROFILES=scavenger,monitoring,gateway

# Or multiple profiles
COMPOSE_PROFILES=scavenger,rag,monitoring,gateway
```

### Network Configuration

By default, Mix-GEM creates three Docker networks:

- **frontend_network**: Public-facing services (Nginx, API)
- **backend_network**: Internal services (PostgreSQL, Redis)
- **monitoring_network**: Monitoring services (Prometheus, exporters)

### Volume Configuration

Persistent volumes:

- `mixgem_pgdata`: PostgreSQL data
- `mixgem_redisdata`: Redis data
- `mixgem_prometheus_data`: Prometheus metrics (30 days retention)
- `mixgem_grafana_data`: Grafana dashboards
- `mixgem_rag_storage`: RAG engine documents
- `mixgem_backup_data`: Backup storage

## SSL Setup

### Development (Self-Signed)

```bash
# Generate self-signed certificates
mkdir -p nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
```

### Production (Let's Encrypt)

1. **Point domain to server**:
   - Create A record: `example.com` → `<server-ip>`

2. **Configure environment**:
   ```bash
   CERTBOT_EMAIL=admin@example.com
   CERTBOT_DOMAIN=example.com
   ```

3. **Start Nginx first** (without SSL):
   ```bash
   # Temporarily use self-signed certs
   ./start-stack.sh
   ```

4. **Generate Let's Encrypt certificate**:
   ```bash
   docker-compose -f docker-compose.prod.yml --profile gateway run --rm certbot
   ```

5. **Update Nginx to use Let's Encrypt**:
   ```bash
   # Edit nginx/conf.d/default.conf
   ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
   ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;
   ```

6. **Reload Nginx**:
   ```bash
   docker-compose -f docker-compose.prod.yml restart nginx
   ```

### Certificate Renewal

Let's Encrypt certificates expire after 90 days. Set up automatic renewal:

```bash
# Add to crontab
crontab -e

# Renew every Monday at 3 AM
0 3 * * 1 cd /opt/mixgem/equipment-monitor && docker-compose -f docker-compose.prod.yml --profile gateway run --rm certbot renew && docker-compose -f docker-compose.prod.yml restart nginx
```

## Database Initialization

PostgreSQL and Redis start automatically with Docker Compose. For custom initialization:

### PostgreSQL Extensions

```sql
-- Connect to database
docker-compose -f docker-compose.prod.yml exec postgres psql -U mixgem -d mixgem

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS btree_gin;
```

### Initial Schema

If you have migrations:

```bash
# Run migrations (example)
docker-compose -f docker-compose.prod.yml exec scavenger-api alembic upgrade head
```

## Service Profiles

### Scavenger (SECS/GEM Ingestion)

```bash
export COMPOSE_PROFILES=scavenger,monitoring
docker-compose -f docker-compose.prod.yml up -d
```

Includes:
- Scavenger API (port 8000)
- Scavenger Recorder (background worker)
- PostgreSQL, Redis
- Prometheus, Grafana (if monitoring enabled)

### RAG Engine

```bash
export COMPOSE_PROFILES=rag,monitoring
docker-compose -f docker-compose.prod.yml up -d
```

Requires:
- `ANTHROPIC_API_KEY` in `.env`

### Full Production Stack

```bash
export COMPOSE_PROFILES=scavenger,rag,monitoring,gateway
docker-compose -f docker-compose.prod.yml up -d
```

## Deployment Strategies

### Blue-Green Deployment

1. **Set up two environments** (blue and green)
2. **Deploy to inactive environment**
3. **Test thoroughly**
4. **Switch traffic** (update DNS or load balancer)
5. **Keep old environment** for quick rollback

### Rolling Updates

```bash
# Update images
docker-compose -f docker-compose.prod.yml pull

# Recreate services one by one
docker-compose -f docker-compose.prod.yml up -d --no-deps --build <service-name>
```

### Zero-Downtime Postgres Updates

```bash
# Create backup first
docker-compose -f docker-compose.prod.yml --profile backup run --rm backup

# Update with minimal downtime
docker-compose -f docker-compose.prod.yml up -d postgres
```

## Health Checks

All services have health checks configured. Monitor with:

```bash
# Check service health
docker-compose -f docker-compose.prod.yml ps

# View specific service health
docker inspect --format='{{.State.Health.Status}}' mixgem_postgres
```

### Service Health Endpoints

- **Scavenger API**: `GET /health`
- **RAG Engine**: `GET /health/live`
- **Grafana**: `GET /api/health`
- **Prometheus**: `GET /-/healthy`

## Scaling

### Horizontal Scaling

Scale specific services:

```bash
# Scale Scavenger Recorder workers
docker-compose -f docker-compose.prod.yml up -d --scale scavenger-recorder=3

# Scale RAG Engine
docker-compose -f docker-compose.prod.yml up -d --scale rag-engine=2
```

### Vertical Scaling

Adjust resource limits in `docker-compose.prod.yml`:

```yaml
deploy:
  resources:
    limits:
      cpus: '4.0'
      memory: 8G
    reservations:
      cpus: '2.0'
      memory: 4G
```

### Database Connection Pooling

Increase PostgreSQL connections for high load:

```bash
POSTGRES_MAX_CONNECTIONS=500
```

## Security Hardening

### 1. Firewall Configuration

```bash
# Allow only necessary ports
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### 2. Restrict Docker API

```bash
# Ensure Docker socket is not exposed
sudo chmod 660 /var/run/docker.sock
```

### 3. Use Secrets Management

For production, use Docker secrets or external secrets managers:

```bash
# Example with Docker secrets
echo "mysecretpassword" | docker secret create postgres_password -
```

### 4. Enable Nginx Rate Limiting

Already configured in `nginx/nginx.conf`:

```nginx
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
```

### 5. Database Access Control

Restrict PostgreSQL to backend network only (already configured).

### 6. Log Rotation

Configure log rotation to prevent disk space issues:

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

Already configured in all services.

## Troubleshooting

### Services Not Starting

```bash
# Check Docker daemon
sudo systemctl status docker

# Check logs
docker-compose -f docker-compose.prod.yml logs -f

# Check specific service
docker-compose -f docker-compose.prod.yml logs postgres
```

### Database Connection Issues

```bash
# Test PostgreSQL connection
docker-compose -f docker-compose.prod.yml exec postgres psql -U mixgem -d mixgem

# Check PostgreSQL logs
docker-compose -f docker-compose.prod.yml logs postgres
```

### Nginx 502 Bad Gateway

```bash
# Check upstream services are healthy
docker-compose -f docker-compose.prod.yml ps

# Test backend connectivity
docker-compose -f docker-compose.prod.yml exec nginx ping scavenger-api
```

### Disk Space Issues

```bash
# Check disk usage
df -h

# Clean up Docker
docker system prune -a --volumes

# Check volume sizes
docker system df -v
```

### Memory Issues

```bash
# Check container memory usage
docker stats

# Adjust resource limits in docker-compose.prod.yml
```

## Maintenance

### Regular Tasks

- **Daily**: Monitor Grafana dashboards
- **Weekly**: Review logs for errors
- **Monthly**: Test backup restoration
- **Quarterly**: Update Docker images and security patches

### Backup Schedule

```bash
# Add to crontab
crontab -e

# Daily backups at 2 AM
0 2 * * * cd /opt/mixgem/equipment-monitor && docker-compose -f docker-compose.prod.yml --profile backup run --rm backup
```

### Monitoring Alerts

Configure Grafana alerts for:
- High CPU/memory usage
- Disk space low
- Database connection errors
- Service health check failures

## Support

For production deployment assistance:
- **Documentation**: `/docs` directory
- **Issues**: GitHub Issues
- **Community**: GitHub Discussions
