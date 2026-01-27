# Production Deployment Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create production-ready Docker Compose deployment with modular service profiles, monitoring, SSL gateway, and automated backups.

**Architecture:** Single `docker-compose.prod.yml` with Docker Compose profiles for selective service enabling. Multi-network isolation (frontend/backend/monitoring). Production hardening with resource limits, centralized logging, and comprehensive monitoring.

**Tech Stack:** Docker Compose v2, Nginx (reverse proxy), Prometheus + Grafana (monitoring), Certbot (SSL), PostgreSQL + pgvector, Redis, Ollama, FastAPI

---

## Task 1: Create Base Production Compose File

**Files:**
- Create: `docker-compose.prod.yml`

**Step 1: Create compose file with version and networks**

```bash
cat > docker-compose.prod.yml << 'EOF'
version: "3.9"

# Production Docker Compose for Mix-GEM Full Stack
# Use profiles to selectively enable service groups

networks:
  frontend_network:
    driver: bridge
    name: mixgem_frontend
  backend_network:
    driver: bridge
    name: mixgem_backend
  monitoring_network:
    driver: bridge
    name: mixgem_monitoring

volumes:
  mixgem_pgdata:
    name: mixgem_pgdata
  mixgem_redisdata:
    name: mixgem_redisdata
  mixgem_ollama_data:
    name: mixgem_ollama_data
  mixgem_rag_storage:
    name: mixgem_rag_storage
  mixgem_prometheus_data:
    name: mixgem_prometheus_data
  mixgem_grafana_data:
    name: mixgem_grafana_data
  mixgem_backup_data:
    name: mixgem_backup_data

services:
EOF
```

**Step 2: Verify file created**

Run: `cat docker-compose.prod.yml`
Expected: File contains version, networks, volumes, services sections

**Step 3: Commit**

```bash
git add docker-compose.prod.yml
git commit -m "feat: add production compose base structure"
```

---

## Task 2: Add Core Infrastructure Services (PostgreSQL, Redis)

**Files:**
- Modify: `docker-compose.prod.yml`

**Step 1: Add PostgreSQL service with production settings**

```bash
cat >> docker-compose.prod.yml << 'EOF'
  # =============================================================================
  # Core Infrastructure (always enabled, no profile needed)
  # =============================================================================

  postgres:
    image: pgvector/pgvector:pg17
    container_name: mixgem_postgres
    environment:
      POSTGRES_DB: ${DB_NAME:-mixgem}
      POSTGRES_USER: ${DB_USER:-mixgem}
      POSTGRES_PASSWORD: ${DB_PASSWORD:?Database password required}
      PGDATA: /var/lib/postgresql/data/pgdata
    ports:
      - "${DB_PORT:-5432}:5432"
    volumes:
      - mixgem_pgdata:/var/lib/postgresql/data
    shm_size: '256mb'
    command: >
      postgres
      -c shared_buffers=256MB
      -c work_mem=64MB
      -c maintenance_work_mem=256MB
      -c effective_cache_size=512MB
      -c max_connections=200
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-mixgem} -d ${DB_NAME:-mixgem}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s
    restart: unless-stopped
    networks:
      - backend_network
      - monitoring_network
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 4G
        reservations:
          cpus: '1.0'
          memory: 2G
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
        compress: "true"

  redis:
    image: redis:7-alpine
    container_name: mixgem_redis
    ports:
      - "${REDIS_PORT:-6379}:6379"
    volumes:
      - mixgem_redisdata:/data
    command: redis-server --appendonly yes --maxmemory 512mb --maxmemory-policy allkeys-lru
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5
      start_period: 10s
    restart: unless-stopped
    networks:
      - backend_network
      - monitoring_network
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
        compress: "true"

EOF
```

**Step 2: Validate compose file syntax**

Run: `docker-compose -f docker-compose.prod.yml config --quiet`
Expected: No output (valid syntax)

**Step 3: Commit**

```bash
git add docker-compose.prod.yml
git commit -m "feat: add PostgreSQL and Redis with production config"
```

---

## Task 3: Add Ollama Service (Profile: ollama)

**Files:**
- Modify: `docker-compose.prod.yml`

**Step 1: Add Ollama service with ollama profile**

```bash
cat >> docker-compose.prod.yml << 'EOF'
  # =============================================================================
  # Ollama - Local LLM (profile: ollama)
  # =============================================================================

  ollama:
    image: ollama/ollama:latest
    container_name: mixgem_ollama
    profiles: ["ollama"]
    volumes:
      - mixgem_ollama_data:/root/.ollama
    ports:
      - "${OLLAMA_PORT:-11434}:11434"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:11434/api/tags"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    restart: unless-stopped
    networks:
      - backend_network
      - monitoring_network
    deploy:
      resources:
        limits:
          cpus: '4.0'
          memory: 8G
        reservations:
          cpus: '2.0'
          memory: 4G
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
        compress: "true"

EOF
```

**Step 2: Validate compose file**

Run: `docker-compose -f docker-compose.prod.yml config --quiet`
Expected: No output (valid)

**Step 3: Test profile selection**

Run: `docker-compose -f docker-compose.prod.yml --profile ollama config --services`
Expected: Output includes "ollama" service

**Step 4: Commit**

```bash
git add docker-compose.prod.yml
git commit -m "feat: add Ollama service with ollama profile"
```

---

## Task 4: Add RAG Engine Service (Profile: rag)

**Files:**
- Modify: `docker-compose.prod.yml`

**Step 1: Add RAG Engine service**

```bash
cat >> docker-compose.prod.yml << 'EOF'
  # =============================================================================
  # RAG Engine - LangGraph + LightRAG (profile: rag)
  # =============================================================================

  rag-engine:
    build:
      context: ./rag-engine
      dockerfile: Dockerfile
    container_name: mixgem_rag_engine
    profiles: ["rag"]
    environment:
      POSTGRES_HOST: postgres
      POSTGRES_PORT: 5432
      POSTGRES_USER: ${DB_USER:-mixgem}
      POSTGRES_PASSWORD: ${DB_PASSWORD:?Database password required}
      POSTGRES_DATABASE: ${DB_NAME:-mixgem}
      REDIS_URL: redis://redis:6379
      OLLAMA_HOST: http://ollama:11434
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY:?Anthropic API key required}
      EMBEDDING_MODEL: ${EMBEDDING_MODEL:-snowflake-arctic-embed2}
      LLM_MODEL: ${LLM_MODEL:-claude-sonnet-4-20250514}
      LOG_LEVEL: ${LOG_LEVEL:-INFO}
    ports:
      - "${RAG_PORT:-8001}:8001"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8001/health/live"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    restart: unless-stopped
    volumes:
      - mixgem_rag_storage:/app/lightrag_storage
    networks:
      - frontend_network
      - backend_network
      - monitoring_network
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 2G
        reservations:
          cpus: '0.5'
          memory: 1G
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
        compress: "true"

EOF
```

**Step 2: Validate compose file**

Run: `docker-compose -f docker-compose.prod.yml config --quiet`
Expected: No output (valid)

**Step 3: Commit**

```bash
git add docker-compose.prod.yml
git commit -m "feat: add RAG Engine service with rag profile"
```

---

## Task 5: Add Scavenger Services (Profile: scavenger)

**Files:**
- Modify: `docker-compose.prod.yml`

**Step 1: Add Scavenger API and Recorder services**

```bash
cat >> docker-compose.prod.yml << 'EOF'
  # =============================================================================
  # Scavenger - SECS/GEM Ingestion (profile: scavenger)
  # =============================================================================

  scavenger-api:
    build:
      context: ./scavenger
      target: api
    container_name: mixgem_scavenger_api
    profiles: ["scavenger"]
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    ports:
      - "${SCAVENGER_PORT:-8000}:8000"
    environment:
      DATABASE_URL: postgresql+asyncpg://${DB_USER:-mixgem}:${DB_PASSWORD:?Database password required}@postgres:5432/${DB_NAME:-mixgem}
      REDIS_URL: redis://redis:6379/0
      OPENAI_API_KEY: ${OPENAI_API_KEY:-}
      LOG_LEVEL: ${LOG_LEVEL:-INFO}
    volumes:
      - ./scavenger/data:/app/data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 10s
      timeout: 5s
      retries: 3
      start_period: 10s
    restart: unless-stopped
    networks:
      - frontend_network
      - backend_network
      - monitoring_network
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
        compress: "true"

  scavenger-recorder:
    build:
      context: ./scavenger
      target: recorder
    container_name: mixgem_scavenger_recorder
    profiles: ["scavenger"]
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql+asyncpg://${DB_USER:-mixgem}:${DB_PASSWORD:?Database password required}@postgres:5432/${DB_NAME:-mixgem}
      REDIS_URL: redis://redis:6379/0
      BATCH_SIZE: ${BATCH_SIZE:-100}
      FLUSH_INTERVAL_MS: ${FLUSH_INTERVAL_MS:-1000}
      LOG_LEVEL: ${LOG_LEVEL:-INFO}
    healthcheck:
      test: ["CMD", "python", "-c", "import redis; r=redis.from_url('redis://redis:6379/0'); r.ping()"]
      interval: 10s
      timeout: 5s
      retries: 3
      start_period: 10s
    restart: unless-stopped
    networks:
      - backend_network
      - monitoring_network
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
        compress: "true"

EOF
```

**Step 2: Validate compose file**

Run: `docker-compose -f docker-compose.prod.yml config --quiet`
Expected: No output (valid)

**Step 3: Commit**

```bash
git add docker-compose.prod.yml
git commit -m "feat: add Scavenger API and Recorder with scavenger profile"
```

---

## Task 6: Add SECS/GEM Simulator (Profile: simulator)

**Files:**
- Modify: `docker-compose.prod.yml`

**Step 1: Add Simulator service**

```bash
cat >> docker-compose.prod.yml << 'EOF'
  # =============================================================================
  # SECS/GEM Simulator (profile: simulator)
  # =============================================================================

  scavenger-simulator:
    build:
      context: ./scavenger
      target: simulator
    container_name: mixgem_simulator
    profiles: ["simulator"]
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    ports:
      - "${HSMS_PASSIVE_PORT:-5000}:5000"
      - "${HSMS_ACTIVE_PORT:-5001}:5001"
    environment:
      DATABASE_URL: postgresql+asyncpg://${DB_USER:-mixgem}:${DB_PASSWORD:?Database password required}@postgres:5432/${DB_NAME:-mixgem}
      REDIS_URL: redis://redis:6379/0
      HSMS_PASSIVE_PORT: 5000
      HSMS_ACTIVE_PORT: 5001
      HSMS_DEVICE_ID: ${HSMS_DEVICE_ID:-1}
      EQUIPMENT_ID: ${EQUIPMENT_ID:-LITHO01}
      LOG_LEVEL: ${LOG_LEVEL:-INFO}
    volumes:
      - ./scavenger/scenarios:/app/scenarios:ro
    healthcheck:
      test: ["CMD", "python", "-c", "import socket; s=socket.socket(); s.settimeout(1); s.connect(('localhost', 5000)); s.close()"]
      interval: 10s
      timeout: 5s
      retries: 3
      start_period: 15s
    restart: unless-stopped
    networks:
      - backend_network
      - monitoring_network
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
        compress: "true"

EOF
```

**Step 2: Validate compose file**

Run: `docker-compose -f docker-compose.prod.yml config --quiet`
Expected: No output (valid)

**Step 3: Commit**

```bash
git add docker-compose.prod.yml
git commit -m "feat: add SECS/GEM Simulator with simulator profile"
```

---

## Task 7: Add Monitoring Services - Prometheus

**Files:**
- Modify: `docker-compose.prod.yml`
- Create: `monitoring/prometheus/prometheus.yml`

**Step 1: Create Prometheus configuration directory**

```bash
mkdir -p monitoring/prometheus
```

**Step 2: Create Prometheus configuration**

```bash
cat > monitoring/prometheus/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    cluster: 'mixgem-production'

scrape_configs:
  # Prometheus self-monitoring
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  # PostgreSQL Exporter
  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']

  # Redis Exporter
  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']

  # Node Exporter (host metrics)
  - job_name: 'node'
    static_configs:
      - targets: ['node-exporter:9100']

  # cAdvisor (container metrics)
  - job_name: 'cadvisor'
    static_configs:
      - targets: ['cadvisor:8080']

  # RAG Engine
  - job_name: 'rag-engine'
    metrics_path: '/metrics'
    static_configs:
      - targets: ['rag-engine:8001']

  # Scavenger API
  - job_name: 'scavenger-api'
    metrics_path: '/metrics'
    static_configs:
      - targets: ['scavenger-api:8000']
EOF
```

**Step 3: Add Prometheus service to compose**

```bash
cat >> docker-compose.prod.yml << 'EOF'
  # =============================================================================
  # Monitoring Stack (profile: monitoring)
  # =============================================================================

  prometheus:
    image: prom/prometheus:latest
    container_name: mixgem_prometheus
    profiles: ["monitoring"]
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--storage.tsdb.retention.time=15d'
      - '--web.console.libraries=/usr/share/prometheus/console_libraries'
      - '--web.console.templates=/usr/share/prometheus/consoles'
    ports:
      - "${PROMETHEUS_PORT:-9090}:9090"
    volumes:
      - ./monitoring/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - mixgem_prometheus_data:/prometheus
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:9090/-/healthy"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped
    networks:
      - monitoring_network
      - frontend_network
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 2G
        reservations:
          cpus: '0.5'
          memory: 1G
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
        compress: "true"

EOF
```

**Step 4: Validate configuration**

Run: `docker-compose -f docker-compose.prod.yml config --quiet`
Expected: No output (valid)

**Step 5: Commit**

```bash
git add docker-compose.prod.yml monitoring/
git commit -m "feat: add Prometheus with monitoring profile"
```

---

## Task 8: Add Monitoring Services - Exporters

**Files:**
- Modify: `docker-compose.prod.yml`

**Step 1: Add Node Exporter, Postgres Exporter, Redis Exporter, cAdvisor**

```bash
cat >> docker-compose.prod.yml << 'EOF'
  node-exporter:
    image: prom/node-exporter:latest
    container_name: mixgem_node_exporter
    profiles: ["monitoring"]
    command:
      - '--path.procfs=/host/proc'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    ports:
      - "9100:9100"
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:9100/metrics"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped
    networks:
      - monitoring_network
    deploy:
      resources:
        limits:
          cpus: '0.25'
          memory: 128M
        reservations:
          cpus: '0.1'
          memory: 64M
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
        compress: "true"

  postgres-exporter:
    image: prometheuscommunity/postgres-exporter:latest
    container_name: mixgem_postgres_exporter
    profiles: ["monitoring"]
    environment:
      DATA_SOURCE_NAME: postgresql://${DB_USER:-mixgem}:${DB_PASSWORD:?Database password required}@postgres:5432/${DB_NAME:-mixgem}?sslmode=disable
    ports:
      - "9187:9187"
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:9187/metrics"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped
    networks:
      - backend_network
      - monitoring_network
    deploy:
      resources:
        limits:
          cpus: '0.25'
          memory: 128M
        reservations:
          cpus: '0.1'
          memory: 64M
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
        compress: "true"

  redis-exporter:
    image: oliver006/redis_exporter:latest
    container_name: mixgem_redis_exporter
    profiles: ["monitoring"]
    environment:
      REDIS_ADDR: redis://redis:6379
    ports:
      - "9121:9121"
    depends_on:
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:9121/metrics"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped
    networks:
      - backend_network
      - monitoring_network
    deploy:
      resources:
        limits:
          cpus: '0.25'
          memory: 128M
        reservations:
          cpus: '0.1'
          memory: 64M
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
        compress: "true"

  cadvisor:
    image: gcr.io/cadvisor/cadvisor:latest
    container_name: mixgem_cadvisor
    profiles: ["monitoring"]
    privileged: true
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:ro
      - /sys:/sys:ro
      - /var/lib/docker/:/var/lib/docker:ro
      - /dev/disk/:/dev/disk:ro
    ports:
      - "8080:8080"
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:8080/healthz"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped
    networks:
      - monitoring_network
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 256M
        reservations:
          cpus: '0.25'
          memory: 128M
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
        compress: "true"

EOF
```

**Step 2: Validate compose file**

Run: `docker-compose -f docker-compose.prod.yml config --quiet`
Expected: No output (valid)

**Step 3: Commit**

```bash
git add docker-compose.prod.yml
git commit -m "feat: add monitoring exporters (node, postgres, redis, cadvisor)"
```

---

## Task 9: Add Monitoring Services - Grafana

**Files:**
- Modify: `docker-compose.prod.yml`
- Create: `monitoring/grafana/provisioning/datasources/prometheus.yml`
- Create: `monitoring/grafana/provisioning/dashboards/dashboard.yml`

**Step 1: Create Grafana provisioning directories**

```bash
mkdir -p monitoring/grafana/provisioning/datasources
mkdir -p monitoring/grafana/provisioning/dashboards
mkdir -p monitoring/grafana/dashboards
```

**Step 2: Create Prometheus datasource configuration**

```bash
cat > monitoring/grafana/provisioning/datasources/prometheus.yml << 'EOF'
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: false
EOF
```

**Step 3: Create dashboard provisioning configuration**

```bash
cat > monitoring/grafana/provisioning/dashboards/dashboard.yml << 'EOF'
apiVersion: 1

providers:
  - name: 'Mix-GEM Dashboards'
    orgId: 1
    folder: ''
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    allowUiUpdates: true
    options:
      path: /etc/grafana/provisioning/dashboards
EOF
```

**Step 4: Add Grafana service to compose**

```bash
cat >> docker-compose.prod.yml << 'EOF'
  grafana:
    image: grafana/grafana:latest
    container_name: mixgem_grafana
    profiles: ["monitoring"]
    environment:
      GF_SECURITY_ADMIN_USER: ${GRAFANA_ADMIN_USER:-admin}
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_ADMIN_PASSWORD:?Grafana admin password required}
      GF_SERVER_ROOT_URL: ${GRAFANA_ROOT_URL:-http://localhost:3000}
      GF_USERS_ALLOW_SIGN_UP: false
      GF_AUTH_ANONYMOUS_ENABLED: false
    ports:
      - "${GRAFANA_PORT:-3000}:3000"
    volumes:
      - mixgem_grafana_data:/var/lib/grafana
      - ./monitoring/grafana/provisioning:/etc/grafana/provisioning:ro
      - ./monitoring/grafana/dashboards:/etc/grafana/provisioning/dashboards:ro
    depends_on:
      prometheus:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s
    restart: unless-stopped
    networks:
      - monitoring_network
      - frontend_network
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
        compress: "true"

EOF
```

**Step 5: Validate compose file**

Run: `docker-compose -f docker-compose.prod.yml config --quiet`
Expected: No output (valid)

**Step 6: Commit**

```bash
git add docker-compose.prod.yml monitoring/grafana/
git commit -m "feat: add Grafana with datasource provisioning"
```

---

## Task 10: Create Nginx Configuration Files

**Files:**
- Create: `nginx/nginx.conf`
- Create: `nginx/conf.d/default.conf`
- Create: `nginx/conf.d/ssl.conf`
- Create: `nginx/snippets/security-headers.conf`
- Create: `nginx/snippets/rate-limiting.conf`

**Step 1: Create nginx directories**

```bash
mkdir -p nginx/conf.d
mkdir -p nginx/snippets
```

**Step 2: Create main nginx.conf**

```bash
cat > nginx/nginx.conf << 'EOF'
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    server_tokens off;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript
               application/json application/javascript application/xml+rss
               application/rss+xml font/truetype font/opentype
               application/vnd.ms-fontobject image/svg+xml;

    # Include rate limiting zones
    include /etc/nginx/snippets/rate-limiting.conf;

    # Include all virtual host configs
    include /etc/nginx/conf.d/*.conf;
}
EOF
```

**Step 3: Create HTTP → HTTPS redirect config**

```bash
cat > nginx/conf.d/default.conf << 'EOF'
# HTTP → HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name _;

    # Allow Certbot ACME challenge
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Redirect all other HTTP traffic to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS server (SSL configuration in ssl.conf)
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${DOMAIN};

    # SSL configuration
    include /etc/nginx/conf.d/ssl.conf;

    # Security headers
    include /etc/nginx/snippets/security-headers.conf;

    # Client body size limit
    client_max_body_size 10M;

    # RAG Engine API
    location /api/rag/ {
        limit_req zone=api_limit burst=20 nodelay;
        proxy_pass http://rag-engine:8001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Scavenger API
    location /api/scavenger/ {
        limit_req zone=api_limit burst=20 nodelay;
        proxy_pass http://scavenger-api:8000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Grafana
    location /grafana/ {
        proxy_pass http://grafana:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Prometheus (optional, consider restricting access)
    location /prometheus/ {
        proxy_pass http://prometheus:9090/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF
```

**Step 4: Create SSL configuration**

```bash
cat > nginx/conf.d/ssl.conf << 'EOF'
# SSL certificates
ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;

# SSL protocols and ciphers
ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers on;
ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384';

# SSL session cache
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
ssl_session_tickets off;

# OCSP stapling
ssl_stapling on;
ssl_stapling_verify on;
ssl_trusted_certificate /etc/letsencrypt/live/${DOMAIN}/chain.pem;

# DNS resolver for OCSP
resolver 8.8.8.8 8.8.4.4 valid=300s;
resolver_timeout 5s;
EOF
```

**Step 5: Create security headers snippet**

```bash
cat > nginx/snippets/security-headers.conf << 'EOF'
# Security headers
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';" always;
EOF
```

**Step 6: Create rate limiting configuration**

```bash
cat > nginx/snippets/rate-limiting.conf << 'EOF'
# Rate limiting zones
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/m;
limit_req_status 429;
EOF
```

**Step 7: Commit**

```bash
git add nginx/
git commit -m "feat: add Nginx configuration files"
```

---

## Task 11: Add Nginx and Certbot Services (Profile: gateway)

**Files:**
- Modify: `docker-compose.prod.yml`

**Step 1: Add Nginx and Certbot services**

```bash
cat >> docker-compose.prod.yml << 'EOF'
  # =============================================================================
  # Gateway - Nginx Reverse Proxy + SSL (profile: gateway)
  # =============================================================================

  nginx:
    image: nginx:alpine
    container_name: mixgem_nginx
    profiles: ["gateway"]
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - ./nginx/snippets:/etc/nginx/snippets:ro
      - ./certbot/conf:/etc/letsencrypt:ro
      - ./certbot/www:/var/www/certbot:ro
    environment:
      DOMAIN: ${DOMAIN:?Domain name required}
    depends_on:
      - prometheus
      - grafana
    healthcheck:
      test: ["CMD", "nginx", "-t"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped
    networks:
      - frontend_network
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 256M
        reservations:
          cpus: '0.25'
          memory: 128M
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
        compress: "true"

  certbot:
    image: certbot/certbot:latest
    container_name: mixgem_certbot
    profiles: ["gateway"]
    volumes:
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait $${!}; done;'"
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '0.25'
          memory: 128M
        reservations:
          cpus: '0.1'
          memory: 64M
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
        compress: "true"

EOF
```

**Step 2: Validate compose file**

Run: `docker-compose -f docker-compose.prod.yml config --quiet`
Expected: No output (valid)

**Step 3: Commit**

```bash
git add docker-compose.prod.yml
git commit -m "feat: add Nginx and Certbot with gateway profile"
```

---

## Task 12: Create Backup Service

**Files:**
- Create: `backup/Dockerfile`
- Create: `backup/backup.sh`
- Modify: `docker-compose.prod.yml`

**Step 1: Create backup directory**

```bash
mkdir -p backup
```

**Step 2: Create backup script**

```bash
cat > backup/backup.sh << 'EOF'
#!/bin/bash
set -e

# Configuration
BACKUP_DIR="/backups"
RETENTION_DAYS=7
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.sql.gz"

# Database connection from environment
DB_HOST=${DB_HOST:-postgres}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-mixgem}
DB_USER=${DB_USER:-mixgem}

echo "[$(date)] Starting backup..."

# Create backup
PGPASSWORD="${DB_PASSWORD}" pg_dump \
    -h "${DB_HOST}" \
    -p "${DB_PORT}" \
    -U "${DB_USER}" \
    -d "${DB_NAME}" \
    --clean \
    --if-exists \
    --no-owner \
    --no-acl \
    | gzip > "${BACKUP_FILE}"

# Check if backup was successful
if [ $? -eq 0 ]; then
    echo "[$(date)] Backup created successfully: ${BACKUP_FILE}"
    ls -lh "${BACKUP_FILE}"
else
    echo "[$(date)] ERROR: Backup failed"
    exit 1
fi

# Clean up old backups
echo "[$(date)] Cleaning up backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "backup_*.sql.gz" -mtime +${RETENTION_DAYS} -delete

# List remaining backups
echo "[$(date)] Current backups:"
ls -lh "${BACKUP_DIR}"

echo "[$(date)] Backup completed successfully"
EOF

chmod +x backup/backup.sh
```

**Step 3: Create backup Dockerfile**

```bash
cat > backup/Dockerfile << 'EOF'
FROM postgres:15-alpine

# Install required tools
RUN apk add --no-cache \
    bash \
    dcron \
    && rm -rf /var/cache/apk/*

# Create backup directory
RUN mkdir -p /backups

# Copy backup script
COPY backup.sh /backup.sh
RUN chmod +x /backup.sh

# Create crontab for daily backups at 2 AM
RUN echo "0 2 * * * /backup.sh >> /var/log/backup.log 2>&1" > /etc/crontabs/root

# Health check: verify script is executable
HEALTHCHECK --interval=60s --timeout=10s --retries=3 \
    CMD test -x /backup.sh

# Run cron in foreground
CMD ["crond", "-f", "-l", "2"]
EOF
```

**Step 4: Add backup service to compose**

```bash
cat >> docker-compose.prod.yml << 'EOF'
  # =============================================================================
  # Backup Service (profile: backup)
  # =============================================================================

  backup:
    build:
      context: ./backup
      dockerfile: Dockerfile
    container_name: mixgem_backup
    profiles: ["backup"]
    environment:
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: ${DB_NAME:-mixgem}
      DB_USER: ${DB_USER:-mixgem}
      DB_PASSWORD: ${DB_PASSWORD:?Database password required}
      RETENTION_DAYS: ${BACKUP_RETENTION_DAYS:-7}
    volumes:
      - mixgem_backup_data:/backups
      - ./backup/backup.sh:/backup.sh:ro
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "test", "-x", "/backup.sh"]
      interval: 60s
      timeout: 10s
      retries: 3
    restart: unless-stopped
    networks:
      - backend_network
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 256M
        reservations:
          cpus: '0.25'
          memory: 128M
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
        compress: "true"
EOF
```

**Step 5: Validate compose file**

Run: `docker-compose -f docker-compose.prod.yml config --quiet`
Expected: No output (valid)

**Step 6: Commit**

```bash
git add docker-compose.prod.yml backup/
git commit -m "feat: add automated backup service with backup profile"
```

---

## Task 13: Create Environment Template

**Files:**
- Create: `.env.example`

**Step 1: Create .env.example template**

```bash
cat > .env.example << 'EOF'
# =============================================================================
# Mix-GEM Production Environment Variables
# =============================================================================
# Copy this file to .env and fill in actual values

# -----------------------------------------------------------------------------
# Core Database Configuration (REQUIRED)
# -----------------------------------------------------------------------------
DB_NAME=mixgem
DB_USER=mixgem
DB_PASSWORD=CHANGEME_STRONG_PASSWORD
DB_PORT=5432

# -----------------------------------------------------------------------------
# Redis Configuration
# -----------------------------------------------------------------------------
REDIS_PORT=6379

# -----------------------------------------------------------------------------
# API Keys (REQUIRED for respective services)
# -----------------------------------------------------------------------------
# Required for RAG Engine
ANTHROPIC_API_KEY=sk-ant-CHANGEME

# Optional for Scavenger AI features
OPENAI_API_KEY=sk-CHANGEME

# -----------------------------------------------------------------------------
# Service Ports
# -----------------------------------------------------------------------------
RAG_PORT=8001
SCAVENGER_PORT=8000
OLLAMA_PORT=11434
PROMETHEUS_PORT=9090
GRAFANA_PORT=3000

# -----------------------------------------------------------------------------
# Ollama Configuration
# -----------------------------------------------------------------------------
EMBEDDING_MODEL=snowflake-arctic-embed2
LLM_MODEL=claude-sonnet-4-20250514

# -----------------------------------------------------------------------------
# SECS/GEM Simulator Configuration
# -----------------------------------------------------------------------------
HSMS_PASSIVE_PORT=5000
HSMS_ACTIVE_PORT=5001
HSMS_DEVICE_ID=1
EQUIPMENT_ID=LITHO01

# -----------------------------------------------------------------------------
# Monitoring Configuration
# -----------------------------------------------------------------------------
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=CHANGEME_STRONG_PASSWORD
GRAFANA_ROOT_URL=http://localhost:3000

# -----------------------------------------------------------------------------
# Gateway Configuration (required if using gateway profile)
# -----------------------------------------------------------------------------
DOMAIN=your-domain.com
EMAIL=your-email@example.com

# -----------------------------------------------------------------------------
# Backup Configuration
# -----------------------------------------------------------------------------
BACKUP_RETENTION_DAYS=7

# -----------------------------------------------------------------------------
# Application Configuration
# -----------------------------------------------------------------------------
LOG_LEVEL=INFO
BATCH_SIZE=100
FLUSH_INTERVAL_MS=1000
EOF
```

**Step 2: Verify file created**

Run: `cat .env.example`
Expected: File contains all environment variables with placeholders

**Step 3: Commit**

```bash
git add .env.example
git commit -m "feat: add environment variable template"
```

---

## Task 14: Create Interactive Start Script

**Files:**
- Create: `start-stack.sh`

**Step 1: Create start script**

```bash
cat > start-stack.sh << 'EOF'
#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Header
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Mix-GEM Production Stack Launcher    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}Warning: .env file not found${NC}"
    echo -e "Copy .env.example to .env and configure your environment variables:"
    echo -e "  ${GREEN}cp .env.example .env${NC}"
    echo -e "  ${GREEN}nano .env${NC}"
    echo ""
    read -p "Do you want to continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Service selection menu
echo -e "${GREEN}Select services to start:${NC}"
echo ""
echo "  [1] Core only (PostgreSQL + Redis)"
echo "  [2] Core + Ollama"
echo "  [3] Core + RAG Engine + Ollama"
echo "  [4] Core + Scavenger + Simulator"
echo "  [5] Core + Scavenger + Simulator + Monitoring"
echo "  [6] Everything (All services)"
echo "  [7] Custom (Select individual profiles)"
echo ""
read -p "Enter choice [1-7]: " choice

# Build profile list based on selection
PROFILES=""
case $choice in
    1)
        echo -e "${BLUE}Starting Core services only...${NC}"
        ;;
    2)
        echo -e "${BLUE}Starting Core + Ollama...${NC}"
        PROFILES="--profile ollama"
        ;;
    3)
        echo -e "${BLUE}Starting Core + RAG Engine + Ollama...${NC}"
        PROFILES="--profile ollama --profile rag"
        ;;
    4)
        echo -e "${BLUE}Starting Core + Scavenger + Simulator...${NC}"
        PROFILES="--profile scavenger --profile simulator"
        ;;
    5)
        echo -e "${BLUE}Starting Core + Scavenger + Simulator + Monitoring...${NC}"
        PROFILES="--profile scavenger --profile simulator --profile monitoring"
        ;;
    6)
        echo -e "${BLUE}Starting ALL services...${NC}"
        PROFILES="--profile ollama --profile rag --profile scavenger --profile simulator --profile monitoring --profile gateway --profile backup"
        ;;
    7)
        echo -e "${BLUE}Custom profile selection:${NC}"
        PROFILES=""

        read -p "Enable Ollama? (y/N) " -n 1 -r; echo
        [[ $REPLY =~ ^[Yy]$ ]] && PROFILES="$PROFILES --profile ollama"

        read -p "Enable RAG Engine? (y/N) " -n 1 -r; echo
        [[ $REPLY =~ ^[Yy]$ ]] && PROFILES="$PROFILES --profile rag"

        read -p "Enable Scavenger? (y/N) " -n 1 -r; echo
        [[ $REPLY =~ ^[Yy]$ ]] && PROFILES="$PROFILES --profile scavenger"

        read -p "Enable Simulator? (y/N) " -n 1 -r; echo
        [[ $REPLY =~ ^[Yy]$ ]] && PROFILES="$PROFILES --profile simulator"

        read -p "Enable Monitoring? (y/N) " -n 1 -r; echo
        [[ $REPLY =~ ^[Yy]$ ]] && PROFILES="$PROFILES --profile monitoring"

        read -p "Enable Gateway (Nginx+SSL)? (y/N) " -n 1 -r; echo
        [[ $REPLY =~ ^[Yy]$ ]] && PROFILES="$PROFILES --profile gateway"

        read -p "Enable Backup? (y/N) " -n 1 -r; echo
        [[ $REPLY =~ ^[Yy]$ ]] && PROFILES="$PROFILES --profile backup"
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}Starting services...${NC}"
echo -e "Command: ${BLUE}docker-compose -f docker-compose.prod.yml $PROFILES up -d${NC}"
echo ""

# Start services
docker-compose -f docker-compose.prod.yml $PROFILES up -d

echo ""
echo -e "${GREEN}✓ Services started successfully!${NC}"
echo ""
echo -e "${BLUE}View status:${NC} docker-compose -f docker-compose.prod.yml ps"
echo -e "${BLUE}View logs:${NC} docker-compose -f docker-compose.prod.yml logs -f"
echo -e "${BLUE}Stop services:${NC} docker-compose -f docker-compose.prod.yml down"
echo ""
EOF

chmod +x start-stack.sh
```

**Step 2: Test script syntax**

Run: `bash -n start-stack.sh`
Expected: No output (valid syntax)

**Step 3: Commit**

```bash
git add start-stack.sh
git commit -m "feat: add interactive start script for service selection"
```

---

## Task 15: Create Documentation

**Files:**
- Create: `PRODUCTION-DEPLOYMENT.md`

**Step 1: Create deployment documentation**

```bash
cat > PRODUCTION-DEPLOYMENT.md << 'EOF'
# Production Deployment Guide

## Prerequisites

- Docker Engine 20.10+
- docker-compose v2.0+
- Minimum server: 10 CPU cores, 18GB RAM, 100GB SSD

## Quick Start

1. **Clone and configure**
   ```bash
   git clone <repository>
   cd mix-gem
   cp .env.example .env
   nano .env  # Configure environment variables
   ```

2. **Start services interactively**
   ```bash
   ./start-stack.sh
   ```

3. **Or start manually with profiles**
   ```bash
   # Example: Core + Scavenger + Monitoring
   docker-compose -f docker-compose.prod.yml \
     --profile scavenger \
     --profile monitoring \
     up -d
   ```

## Service Profiles

| Profile | Services | Use Case |
|---------|----------|----------|
| (none) | PostgreSQL, Redis | Core infrastructure only |
| `ollama` | Ollama | Local LLM for embeddings |
| `rag` | RAG Engine | LangGraph + LightRAG API |
| `scavenger` | API, Recorder | SECS/GEM data ingestion |
| `simulator` | HSMS Simulator | Equipment simulation |
| `monitoring` | Prometheus, Grafana, Exporters | Observability |
| `gateway` | Nginx, Certbot | Reverse proxy with SSL |
| `backup` | Backup Service | Automated backups |

## First-Time Setup

### SSL Certificates (if using gateway profile)

```bash
# Create directories
mkdir -p certbot/conf certbot/www

# Obtain certificate
docker-compose -f docker-compose.prod.yml --profile gateway run --rm certbot certonly \
  --webroot -w /var/www/certbot \
  -d your-domain.com \
  --email your-email@example.com \
  --agree-tos \
  --non-interactive

# Start Nginx
docker-compose -f docker-compose.prod.yml --profile gateway up -d nginx
```

### Ollama Models (if using ollama profile)

```bash
# Pull embedding model
docker-compose -f docker-compose.prod.yml exec ollama \
  ollama pull snowflake-arctic-embed2
```

## Management Commands

### View Status
```bash
docker-compose -f docker-compose.prod.yml ps
```

### View Logs
```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f scavenger-api
```

### Stop Services
```bash
docker-compose -f docker-compose.prod.yml down
```

### Restart Service
```bash
docker-compose -f docker-compose.prod.yml restart rag-engine
```

## Backup Operations

### Manual Backup
```bash
docker-compose -f docker-compose.prod.yml exec backup /backup.sh
```

### List Backups
```bash
docker-compose -f docker-compose.prod.yml exec backup ls -lh /backups
```

### Restore Backup
```bash
# Stop applications
docker-compose -f docker-compose.prod.yml stop rag-engine scavenger-api scavenger-recorder

# Restore
gunzip -c backup_2026-01-27_02-00-00.sql.gz | \
  docker-compose -f docker-compose.prod.yml exec -T postgres \
  psql -U mixgem -d mixgem

# Restart
docker-compose -f docker-compose.prod.yml start rag-engine scavenger-api scavenger-recorder
```

## Access Points

| Service | URL | Notes |
|---------|-----|-------|
| RAG Engine | https://your-domain.com/api/rag | API documentation at /docs |
| Scavenger API | https://your-domain.com/api/scavenger | API documentation at /docs |
| Grafana | https://your-domain.com/grafana | Default: admin / (from .env) |
| Prometheus | https://your-domain.com/prometheus | Metrics and targets |

## Monitoring

- **Grafana Dashboards**: Pre-configured for system, PostgreSQL, Redis, applications
- **Prometheus Metrics**: All services expose /metrics endpoints
- **Health Checks**: All services have Docker health checks

## Troubleshooting

### Check Service Health
```bash
docker-compose -f docker-compose.prod.yml ps --filter "health=unhealthy"
```

### View Container Resources
```bash
docker stats
```

### Database Connection Issues
```bash
# Test PostgreSQL connectivity
docker-compose -f docker-compose.prod.yml exec postgres pg_isready -U mixgem
```

### SSL Certificate Issues
```bash
# Test certificate renewal
docker-compose -f docker-compose.prod.yml exec certbot certbot renew --dry-run
```

## Security Recommendations

1. Change all default passwords in `.env`
2. Restrict Prometheus/Grafana access (IP whitelist or authentication)
3. Regularly update Docker images
4. Monitor logs for suspicious activity
5. Enable firewall rules for exposed ports
6. Backup encryption for sensitive data
7. Regular security audits of compose configuration

## Performance Tuning

### PostgreSQL
- Adjust `shared_buffers` based on available RAM (25% of system RAM)
- Monitor query performance via postgres-exporter metrics
- Use EXPLAIN ANALYZE for slow queries

### Redis
- Monitor memory usage and adjust `maxmemory` accordingly
- Review eviction policy based on use case
- Consider Redis persistence settings (AOF vs RDB)

### Ollama
- GPU support: Uncomment deploy.resources.reservations.devices in compose file
- Model selection: Balance between accuracy and speed
- Monitor GPU memory usage if enabled

## Scaling Considerations

For horizontal scaling, consider:
- Docker Swarm mode (use `docker stack deploy`)
- Kubernetes deployment (use `kompose convert`)
- Load balancer for multiple Nginx instances
- PostgreSQL replication for read scaling
- Redis Sentinel for high availability
EOF
```

**Step 2: Commit**

```bash
git add PRODUCTION-DEPLOYMENT.md
git commit -m "docs: add production deployment guide"
```

---

## Task 16: Validate Complete Configuration

**Files:**
- Test: `docker-compose.prod.yml`

**Step 1: Validate compose file syntax**

Run: `docker-compose -f docker-compose.prod.yml config --quiet`
Expected: No output (valid syntax)

**Step 2: Validate all profiles can be parsed**

Run: `docker-compose -f docker-compose.prod.yml --profile ollama --profile rag --profile scavenger --profile simulator --profile monitoring --profile gateway --profile backup config --services`
Expected: List of all services

**Step 3: Check for common issues**

Run: `./.claude/skills/docker-compose-generator/scripts/validate_compose.sh --file docker-compose.prod.yml --strict --verbose`
Expected: Validation passes or shows warnings only

**Step 4: Test that core services start**

Run: `docker-compose -f docker-compose.prod.yml up -d postgres redis`
Expected: Services start successfully

**Step 5: Check service health**

Run: `docker-compose -f docker-compose.prod.yml ps`
Expected: postgres and redis show "healthy" status after ~30s

**Step 6: Stop test services**

Run: `docker-compose -f docker-compose.prod.yml down -v`
Expected: Services stopped and volumes removed

**Step 7: Commit validation test results**

```bash
git add .
git commit -m "test: validate production compose configuration"
```

---

## Task 17: Final Integration and Documentation Update

**Files:**
- Modify: `README.md` (if exists, otherwise create)
- Modify: `CLAUDE.md`

**Step 1: Update CLAUDE.md with production deployment commands**

Add to existing CLAUDE.md after "Key Commands" section:

```bash
cat >> CLAUDE.md << 'EOF'

### Production Deployment
```bash
# Interactive service selection
./start-stack.sh

# Manual profile selection
docker-compose -f docker-compose.prod.yml --profile <profile> up -d

# View deployment guide
cat PRODUCTION-DEPLOYMENT.md
```
EOF
```

**Step 2: Verify changes**

Run: `git diff CLAUDE.md`
Expected: Shows added production deployment section

**Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md with production deployment commands"
```

---

## Summary

This implementation plan creates a complete production-ready Docker Compose deployment with:

**Deliverables:**
- `docker-compose.prod.yml` - Main production compose file with 8 service profiles
- `nginx/` - Complete Nginx configuration (reverse proxy, SSL, security)
- `monitoring/` - Prometheus and Grafana configurations
- `backup/` - Automated backup service with retention
- `.env.example` - Environment variable template
- `start-stack.sh` - Interactive service launcher
- `PRODUCTION-DEPLOYMENT.md` - Complete deployment guide

**Features:**
- Modular service selection via Docker Compose profiles
- Production hardening (resource limits, logging, security headers)
- Comprehensive monitoring (Prometheus + Grafana + 4 exporters)
- SSL automation via Let's Encrypt
- Automated PostgreSQL backups with 7-day retention
- Multi-network isolation (frontend/backend/monitoring)
- Health checks for all services
- Rate limiting and security headers

**Testing:**
Each task includes validation steps to ensure correctness before proceeding.
