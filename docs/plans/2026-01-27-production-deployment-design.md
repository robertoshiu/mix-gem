# Production Deployment Design - Mix-GEM Full Stack

**Date:** 2026-01-27
**Status:** Approved
**Target Platform:** Local Docker with production configuration

## Overview

Create a production-ready Docker Compose deployment that consolidates all Mix-GEM services with modular profiles for selective service enabling, comprehensive monitoring, SSL gateway, and automated backups.

## Requirements

- **Modular service selection**: Use Docker Compose profiles to enable/disable service groups
- **Production hardening**: Resource limits, centralized logging, security headers
- **Monitoring**: Prometheus + Grafana with pre-configured dashboards
- **Gateway**: Nginx reverse proxy with Let's Encrypt SSL automation
- **Data protection**: Automated PostgreSQL backups with retention policy
- **Easy deployment**: Interactive helper script for profile selection

## Architecture

### Service Organization

```
┌─────────────────────────────────────────────────────────────────┐
│                         NGINX Gateway                            │
│                  (SSL/TLS, Reverse Proxy)                        │
└────────────┬────────────────────────────────────────────────────┘
             │
    ┌────────┴─────────┬─────────────┬──────────────┐
    │                  │             │              │
┌───▼────┐      ┌─────▼──────┐  ┌──▼────────┐  ┌──▼─────────┐
│  RAG   │      │ Scavenger  │  │ Grafana   │  │ Prometheus │
│ Engine │      │    API     │  │           │  │            │
└───┬────┘      └─────┬──────┘  └──┬────────┘  └──┬─────────┘
    │                 │             │              │
    │      ┌──────────┴────┬────────┴──────┬───────┴──────┐
    │      │               │               │              │
┌───▼──────▼───┐    ┌─────▼─────┐    ┌────▼────┐   ┌─────▼────┐
│  PostgreSQL  │    │   Redis   │    │ Ollama  │   │ Exporters│
│  (pgvector)  │    │           │    │         │   │          │
└──────┬───────┘    └───────────┘    └─────────┘   └──────────┘
       │
   ┌───▼────┐
   │ Backup │
   │Service │
   └────────┘
```

### Service Profiles

| Profile | Services | Purpose |
|---------|----------|---------|
| (core) | PostgreSQL, Redis | Always required, no profile needed |
| `ollama` | Ollama | Local LLM for embeddings |
| `rag` | RAG Engine | LangGraph + LightRAG API |
| `scavenger` | Scavenger API, Recorder | SECS/GEM data ingestion |
| `simulator` | HSMS Simulator | SECS/GEM equipment simulation |
| `monitoring` | Prometheus, Grafana, Exporters | Observability stack |
| `gateway` | Nginx, Certbot | Reverse proxy with SSL |
| `backup` | Backup Service | Automated PostgreSQL backups |

### Network Architecture

- **frontend_network**: Nginx ↔ Application APIs (RAG, Scavenger)
- **backend_network**: Applications ↔ Infrastructure (PostgreSQL, Redis, Ollama)
- **monitoring_network**: Prometheus ↔ All services (metrics scraping)

Network isolation ensures applications cannot directly expose databases externally.

### Volume Strategy

| Volume | Purpose | Backup Priority |
|--------|---------|-----------------|
| `mixgem_pgdata` | PostgreSQL data | Critical (automated) |
| `mixgem_redisdata` | Redis persistence | Medium (cache, can rebuild) |
| `mixgem_ollama_data` | Ollama models | Low (can re-download) |
| `mixgem_rag_storage` | LightRAG storage | Critical (manual/automated) |
| `mixgem_backup_data` | Database backups | Critical (offsite copy recommended) |
| `mixgem_prometheus_data` | Metrics history | Low (15-day retention) |
| `mixgem_grafana_data` | Dashboard configs | Medium (can recreate) |

## Resource Allocation

### CPU & Memory Limits

| Service | CPU Limit | Memory Limit | CPU Reserve | Memory Reserve |
|---------|-----------|--------------|-------------|----------------|
| PostgreSQL | 2.0 | 4G | 1.0 | 2G |
| Redis | 0.5 | 512M | 0.25 | 256M |
| Ollama | 4.0 | 8G | 2.0 | 4G |
| RAG Engine | 1.0 | 2G | 0.5 | 1G |
| Scavenger API | 1.0 | 1G | 0.5 | 512M |
| Simulator | 0.5 | 512M | 0.25 | 256M |
| Recorder | 0.5 | 512M | 0.25 | 256M |
| Nginx | 0.5 | 256M | 0.25 | 128M |
| Prometheus | 1.0 | 2G | 0.5 | 1G |
| Grafana | 0.5 | 512M | 0.25 | 256M |
| Node Exporter | 0.25 | 128M | 0.1 | 64M |
| Postgres Exporter | 0.25 | 128M | 0.1 | 64M |
| Redis Exporter | 0.25 | 128M | 0.1 | 64M |
| cAdvisor | 0.5 | 256M | 0.25 | 128M |
| Backup Service | 0.5 | 256M | 0.25 | 128M |

**Minimum Server Requirements:**
- CPU: 10 cores (with all profiles enabled)
- Memory: 18GB RAM
- Disk: 100GB+ SSD (for database, logs, backups)

### Logging Configuration

All services use centralized JSON file logging:

```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"    # Rotate after 10MB
    max-file: "3"      # Keep 3 rotated files
    compress: "true"   # Compress rotated logs
```

**Log Storage Estimate:** ~500MB per day with all services running

## Monitoring & Observability

### Prometheus Configuration

**Scrape Targets:**
- Node Exporter: Host system metrics (15s interval)
- Postgres Exporter: Database metrics (30s interval)
- Redis Exporter: Cache metrics (15s interval)
- cAdvisor: Container metrics (15s interval)
- RAG Engine `/metrics`: Application metrics (30s interval)
- Scavenger API `/metrics`: Application metrics (30s interval)

**Retention:** 15 days of metrics data

### Grafana Dashboards

Pre-configured dashboards:
1. **System Overview**: CPU, memory, disk, network across all containers
2. **PostgreSQL Performance**: Query times, connections, cache hit ratio, table sizes
3. **Redis Performance**: Hit/miss ratio, memory usage, command latency
4. **Application Metrics**: Request rates, response times, error rates
5. **SECS/GEM Metrics**: Message throughput, connection status, event counts

**Access:** `https://your-domain.com/grafana`

### Exporters

- **node-exporter**: Host machine metrics (CPU, memory, disk, network)
- **postgres-exporter**: Database-specific metrics via SQL queries
- **redis-exporter**: Redis INFO command metrics
- **cadvisor**: Docker container resource usage

## Gateway & SSL

### Nginx Reverse Proxy

**Path-based routing:**
```
https://your-domain.com/api/rag       → RAG Engine (8001)
https://your-domain.com/api/scavenger → Scavenger API (8000)
https://your-domain.com/grafana       → Grafana (3000)
https://your-domain.com/prometheus    → Prometheus (9090)
```

### SSL Configuration

- **Certificate Provider:** Let's Encrypt (via Certbot)
- **Auto-renewal:** Daily checks, renews 30 days before expiry
- **TLS Version:** 1.2 and 1.3 only
- **Cipher Suites:** Modern ciphers with forward secrecy
- **HSTS:** Enabled (max-age=31536000)

### Security Features

- HTTP → HTTPS redirect
- Security headers: X-Frame-Options, X-Content-Type-Options, CSP
- Rate limiting: 100 requests/minute per IP
- Request size limit: 10MB max body size
- CORS configuration per service

### Configuration Files

```
nginx/
├── nginx.conf              # Main config
├── conf.d/
│   ├── default.conf       # HTTP redirect
│   ├── ssl.conf           # SSL/TLS settings
│   ├── rag.conf           # RAG proxy
│   ├── scavenger.conf     # Scavenger proxy
│   └── monitoring.conf    # Grafana/Prometheus proxy
└── snippets/
    ├── security-headers.conf
    └── rate-limiting.conf
```

## Backup Strategy

### Automated Backups

- **Schedule:** Daily at 2:00 AM (configurable)
- **Method:** `pg_dump` with `--clean --if-exists`
- **Compression:** gzip (typical 10:1 ratio)
- **Naming:** `backup_YYYY-MM-DD_HH-MM-SS.sql.gz`
- **Retention:** Last 7 daily backups (auto-cleanup)
- **Storage:** Dedicated volume + optional host mount

### Backup Operations

**Manual backup:**
```bash
docker-compose -f docker-compose.prod.yml exec backup /backup.sh
```

**List backups:**
```bash
docker-compose -f docker-compose.prod.yml exec backup ls -lh /backups
```

**Restore process:**
```bash
# Stop applications
docker-compose -f docker-compose.prod.yml stop rag-engine scavenger-api scavenger-recorder

# Restore
gunzip -c backup.sql.gz | docker-compose -f docker-compose.prod.yml exec -T postgres psql -U mixgem -d mixgem

# Restart applications
docker-compose -f docker-compose.prod.yml start rag-engine scavenger-api scavenger-recorder
```

### Storage Requirements

- ~500MB per backup (depends on data volume)
- 7 backups ≈ 3.5GB retention storage

## Deployment

### Environment Configuration

Create `.env` file from `.env.example`:

**Required variables:**
- `DB_PASSWORD`: PostgreSQL password
- `ANTHROPIC_API_KEY`: For RAG Engine (Claude API)
- `OPENAI_API_KEY`: For Scavenger (optional, for AI features)
- `DOMAIN`: Your production domain name
- `EMAIL`: Email for Let's Encrypt notifications

**Optional variables:**
- `EMBEDDING_MODEL`: Ollama embedding model (default: snowflake-arctic-embed2)
- `LLM_MODEL`: Claude model for RAG (default: claude-sonnet-4-20250514)
- `LOG_LEVEL`: Application log level (default: INFO)

### Profile Selection

**Interactive menu (recommended):**
```bash
./start-stack.sh
```

**Manual profile selection:**
```bash
# Core + Scavenger + Simulator (SECS/GEM testing)
docker-compose -f docker-compose.prod.yml --profile scavenger --profile simulator up -d

# Core + RAG + Ollama + Monitoring (RAG development)
docker-compose -f docker-compose.prod.yml --profile rag --profile ollama --profile monitoring up -d

# Everything
docker-compose -f docker-compose.prod.yml \
  --profile ollama \
  --profile rag \
  --profile scavenger \
  --profile simulator \
  --profile monitoring \
  --profile gateway \
  --profile backup \
  up -d
```

### First-Time Setup

1. **SSL Certificates (if using gateway):**
   ```bash
   # Initial certificate acquisition
   docker-compose -f docker-compose.prod.yml --profile gateway run --rm certbot certonly \
     --webroot -w /var/www/certbot \
     -d your-domain.com \
     --email your-email@example.com \
     --agree-tos
   ```

2. **Ollama Models (if using ollama):**
   ```bash
   # Pull embedding model
   docker-compose -f docker-compose.prod.yml exec ollama ollama pull snowflake-arctic-embed2
   ```

3. **Grafana Setup:**
   - Login at `https://your-domain.com/grafana`
   - Default credentials from `.env`
   - Change password on first login
   - Dashboards auto-provisioned

### Validation

```bash
# Validate compose file
./scripts/validate_compose.sh --file docker-compose.prod.yml --strict --verbose

# Check running services
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Check health
docker-compose -f docker-compose.prod.yml ps --filter "health=unhealthy"
```

## File Deliverables

1. **docker-compose.prod.yml** - Main production compose file
2. **.env.example** - Environment variable template
3. **start-stack.sh** - Interactive service selection script
4. **nginx/** - Nginx configuration directory
5. **prometheus/prometheus.yml** - Prometheus scrape configuration
6. **grafana/provisioning/** - Dashboard and datasource configs
7. **backup/** - Backup service Dockerfile and scripts

## Success Criteria

- [ ] All services start successfully with selected profiles
- [ ] Resource limits enforced (no service exceeds allocation)
- [ ] Logging configured with proper rotation
- [ ] Prometheus collecting metrics from all targets
- [ ] Grafana dashboards displaying data
- [ ] Nginx routing requests correctly with SSL
- [ ] Automated backups running and cleaning up old backups
- [ ] Health checks passing for all services
- [ ] Inter-service communication working (RAG → PostgreSQL, etc.)

## Future Enhancements

- Prometheus AlertManager for proactive alerting
- External log aggregation (ELK/Loki)
- Distributed tracing (Jaeger/Tempo)
- Multi-node deployment guide for Docker Swarm/Kubernetes
- Automated testing pipeline for compose changes
