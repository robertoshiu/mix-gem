# Development Stack Architecture

Visual overview of the Mix-GEM development environment.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Mix-GEM Development Stack                            │
│                           (docker-compose.dev.yml)                          │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                              Frontend Layer                                 │
├─────────────┬─────────────┬─────────────┬─────────────┬─────────────────────┤
│   pgAdmin   │   Redis     │   Grafana   │ Prometheus  │   cAdvisor          │
│   :5050     │  Commander  │   :3001     │   :9090     │    :8080            │
│             │   :8081     │             │             │                     │
│ DB GUI      │ Redis GUI   │ Dashboards  │ Metrics     │ Container Metrics   │
└─────────────┴─────────────┴─────────────┴─────────────┴─────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                            Application Layer                                │
├─────────────────────┬─────────────────────┬───────────────────────────────┤
│   Scavenger API     │    RAG Engine       │   SECS/GEM Simulator          │
│      :8000          │      :8001          │   :5000 (Passive)             │
│                     │                     │   :5001 (Active)              │
│ SECS/GEM Ingestion  │ Agentic RAG         │ Equipment Emulator            │
│ FastAPI + Swagger   │ LangGraph+LightRAG  │ HSMS Protocol                 │
└─────────────────────┴─────────────────────┴───────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                               AI/LLM Layer                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                           Ollama  :11434                                    │
│                                                                             │
│  Local LLM Server - Pull models: llama3.2:3b, nomic-embed-text            │
│  Alternative: Claude API via ANTHROPIC_API_KEY                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                          Data/Cache Layer                                   │
├────────────────────────────────┬────────────────────────────────────────────┤
│   PostgreSQL with pgvector     │          Redis                             │
│         :5432                  │          :6379                             │
│                                │                                            │
│ - Vector embeddings (pgvector) │ - Session cache                            │
│ - Full-text search (pg_trgm)   │ - Message queue                            │
│ - SECS/GEM event storage       │ - Real-time data buffer                    │
│ - Time-series metrics          │                                            │
└────────────────────────────────┴────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                          Monitoring Layer                                   │
├──────────────┬──────────────┬──────────────┬──────────────┬────────────────┤
│ Node Exp.    │ Postgres Exp.│  Redis Exp.  │  cAdvisor    │  Prometheus    │
│  :9100       │   :9187      │   :9121      │   :8080      │   :9090        │
│              │              │              │              │                │
│ System       │ DB Metrics   │ Cache Stats  │ Containers   │ Time-Series DB │
└──────────────┴──────────────┴──────────────┴──────────────┴────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                           Storage Volumes                                   │
├──────────────┬──────────────┬──────────────┬──────────────┬────────────────┤
│ pgdata       │ redisdata    │ ollama_data  │ rag_storage  │ monitoring     │
│ (Postgres)   │ (Redis)      │ (Models)     │ (Documents)  │ (Metrics)      │
└──────────────┴──────────────┴──────────────┴──────────────┴────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                         Network: mixgem_dev                                 │
│                     All services on single bridge network                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagrams

### 1. SECS/GEM Event Ingestion

```
┌──────────────┐
│  Equipment   │
│ (HSMS Client)│
└──────┬───────┘
       │ HSMS Messages
       │ (port 5000/5001)
       ▼
┌──────────────────┐      ┌──────────────┐
│ SECS/GEM         │──────│    Redis     │
│ Simulator        │ Push │   (Queue)    │
└──────┬───────────┘      └──────┬───────┘
       │                         │
       │                         │ Poll
       │                         ▼
       │                  ┌──────────────┐
       │                  │  Scavenger   │
       │                  │   Recorder   │
       │                  └──────┬───────┘
       │                         │ Batch Insert
       ▼                         ▼
┌────────────────────────────────────────┐
│         PostgreSQL (pgvector)          │
│  - Raw events table                    │
│  - Processed metrics                   │
│  - Vector embeddings                   │
└────────────────────────────────────────┘
```

### 2. RAG Query Flow

```
┌──────────────┐
│   User API   │
│   Request    │
└──────┬───────┘
       │ POST /query
       ▼
┌──────────────────┐      ┌──────────────┐
│   RAG Engine     │──────│    Redis     │
│  (LangGraph)     │Cache │              │
└──────┬───────────┘      └──────────────┘
       │
       ├─────────────┐
       │             │
       ▼             ▼
┌──────────┐  ┌──────────┐
│PostgreSQL│  │  Ollama  │
│(Vectors) │  │  (LLM)   │
└──────────┘  └──────────┘
       │             │
       └─────┬───────┘
             │
             ▼
     ┌───────────────┐
     │   Response    │
     │ with Evidence │
     └───────────────┘
```

### 3. Monitoring Pipeline

```
┌─────────────────────────────────────────┐
│          Target Services                │
│  (Postgres, Redis, Containers, System)  │
└────┬────────┬────────┬────────┬─────────┘
     │        │        │        │
     │        │        │        │ Scrape metrics
     ▼        ▼        ▼        ▼
┌─────────┬────────┬────────┬──────────┐
│ PG Exp. │ Redis  │cAdvisor│Node Exp. │
│  :9187  │ :9121  │ :8080  │  :9100   │
└────┬────┴────┬───┴────┬───┴────┬─────┘
     │         │        │        │
     └────────────┬─────────────┘
                  │
                  ▼ Aggregate
         ┌────────────────┐
         │  Prometheus    │
         │    :9090       │
         └────────┬───────┘
                  │
                  │ Visualize
                  ▼
         ┌────────────────┐
         │    Grafana     │
         │     :3001      │
         └────────────────┘
```

## Service Dependencies

```
                    ┌─────────────┐
                    │  Prometheus │
                    └──────┬──────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
    ┌──────▼────┐   ┌─────▼─────┐  ┌─────▼─────┐
    │ Node Exp. │   │  PG Exp.  │  │Redis Exp. │
    └───────────┘   └─────┬─────┘  └─────┬─────┘
                          │              │
                    ┌─────▼────┐    ┌────▼──────┐
                    │PostgreSQL│    │   Redis   │
                    └─────┬────┘    └────┬──────┘
                          │              │
      ┌───────────────────┼──────────────┼──────────────┐
      │                   │              │              │
┌─────▼──────┐   ┌────────▼──────┐  ┌───▼──────┐  ┌───▼──────┐
│ RAG Engine │   │ Scavenger API │  │Recorder  │  │Simulator │
└────────────┘   └───────────────┘  └──────────┘  └──────────┘
      │
      │
┌─────▼──────┐
│   Ollama   │
└────────────┘
```

## Port Mapping

### Application Ports

| Service | Internal Port | External Port | Protocol |
|---------|--------------|---------------|----------|
| PostgreSQL | 5432 | 5432 | TCP |
| Redis | 6379 | 6379 | TCP |
| Ollama | 11434 | 11434 | HTTP |
| Scavenger API | 8000 | 8000 | HTTP |
| RAG Engine | 8001 | 8001 | HTTP |
| SECS/GEM Simulator | 5000 | 5000 | HSMS (TCP) |
| SECS/GEM Simulator | 5001 | 5001 | HSMS (TCP) |

### Monitoring Ports

| Service | Internal Port | External Port | Protocol |
|---------|--------------|---------------|----------|
| Prometheus | 9090 | 9090 | HTTP |
| Grafana | 3000 | 3001 | HTTP |
| cAdvisor | 8080 | 8080 | HTTP |
| Node Exporter | 9100 | 9100 | HTTP |
| Postgres Exporter | 9187 | 9187 | HTTP |
| Redis Exporter | 9121 | 9121 | HTTP |

### Development Tool Ports

| Service | Internal Port | External Port | Protocol |
|---------|--------------|---------------|----------|
| pgAdmin | 80 | 5050 | HTTP |
| Redis Commander | 8081 | 8081 | HTTP |

## Volume Usage

| Volume | Size (Typical) | Purpose | Retention |
|--------|---------------|---------|-----------|
| `dev_pgdata` | 1-10GB | PostgreSQL database files | Persistent |
| `dev_redisdata` | 100MB-1GB | Redis snapshots (RDB/AOF) | Persistent |
| `dev_ollama_data` | 5-50GB | Downloaded LLM models | Persistent |
| `dev_rag_storage` | 100MB-5GB | RAG documents & indexes | Persistent |
| `dev_prometheus_data` | 1-5GB | Time-series metrics (7d retention) | Persistent |
| `dev_grafana_data` | 10-100MB | Dashboards & settings | Persistent |

## Resource Allocation

### Default Limits (Development)

| Service | CPU Limit | Memory Limit | Notes |
|---------|-----------|--------------|-------|
| PostgreSQL | 2.0 cores | 4GB | Can handle moderate load |
| Redis | 0.5 cores | 512MB | Fast in-memory operations |
| Ollama | 4.0 cores | 8GB | Heavy during inference |
| RAG Engine | 1.0 cores | 2GB | Python FastAPI app |
| Scavenger API | 1.0 cores | 1GB | Python FastAPI app |
| Scavenger Recorder | 0.5 cores | 512MB | Background worker |
| Simulator | 0.5 cores | 512MB | Lightweight protocol |
| Prometheus | 1.0 cores | 2GB | Time-series storage |
| Grafana | 1.0 cores | 512MB | Dashboard rendering |
| Exporters | 0.2 cores | 128MB each | Lightweight metrics |
| pgAdmin | 0.5 cores | 256MB | Web-based GUI |
| Redis Commander | 0.2 cores | 128MB | Lightweight GUI |

### Minimum System Requirements

- **CPU**: 4 cores (8+ recommended)
- **RAM**: 8GB (16GB+ recommended)
- **Disk**: 20GB free space (50GB+ for models)
- **Docker**: 20.10+ with Compose v2

### Recommended System Specs

- **CPU**: 8 cores or more
- **RAM**: 16GB or more
- **Disk**: 100GB+ SSD
- **Docker**: Latest stable version

## Environment Variables Flow

```
.env.dev
   │
   ├─> PostgreSQL
   │   ├─ POSTGRES_DB
   │   ├─ POSTGRES_USER
   │   └─ POSTGRES_PASSWORD
   │
   ├─> Redis
   │   └─ REDIS_PORT
   │
   ├─> Ollama
   │   └─ OLLAMA_PORT
   │
   ├─> RAG Engine
   │   ├─ ANTHROPIC_API_KEY
   │   ├─ EMBEDDING_MODEL
   │   ├─ LLM_MODEL
   │   └─ LOG_LEVEL
   │
   ├─> Scavenger
   │   ├─ OPENAI_API_KEY
   │   ├─ BATCH_SIZE
   │   └─ FLUSH_INTERVAL_MS
   │
   ├─> Simulator
   │   ├─ HSMS_DEVICE_ID
   │   └─ EQUIPMENT_ID
   │
   └─> Monitoring
       ├─ GRAFANA_ADMIN_USER
       ├─ GRAFANA_ADMIN_PASSWORD
       └─ PROMETHEUS_PORT
```

## Health Check Strategy

| Service | Check Method | Interval | Timeout | Retries | Start Period |
|---------|-------------|----------|---------|---------|--------------|
| PostgreSQL | `pg_isready` | 5s | 3s | 3 | 10s |
| Redis | `redis-cli PING` | 5s | 3s | 3 | 5s |
| Ollama | HTTP GET /api/tags | 30s | 10s | 3 | 30s |
| RAG Engine | HTTP GET /health/live | 30s | 10s | 3 | 30s |
| Scavenger API | HTTP GET /health | 10s | 5s | 3 | 10s |
| Simulator | TCP connect :5000 | 10s | 5s | 3 | 10s |
| Prometheus | HTTP GET /-/healthy | 30s | 10s | 3 | 10s |
| Grafana | HTTP GET /api/health | 30s | 10s | 3 | 10s |

## Startup Sequence

```
1. Networks & Volumes
   └─> Create mixgem_dev network and named volumes

2. Core Infrastructure (parallel)
   ├─> PostgreSQL  [wait for healthy]
   └─> Redis       [wait for healthy]

3. AI Layer (parallel)
   └─> Ollama

4. Application Layer (parallel, depends on core)
   ├─> Scavenger API      [depends on PostgreSQL, Redis]
   ├─> Scavenger Recorder [depends on PostgreSQL, Redis]
   ├─> Simulator          [depends on PostgreSQL, Redis]
   └─> RAG Engine         [depends on PostgreSQL, Redis]

5. Monitoring (parallel, depends on core)
   ├─> Node Exporter
   ├─> Postgres Exporter  [depends on PostgreSQL]
   ├─> Redis Exporter     [depends on Redis]
   ├─> cAdvisor
   └─> Prometheus         [wait for healthy]

6. Visualization (depends on monitoring)
   └─> Grafana            [depends on Prometheus]

7. Development Tools (parallel, depends on core)
   ├─> pgAdmin            [depends on PostgreSQL]
   └─> Redis Commander    [depends on Redis]
```

Total startup time: ~30-60 seconds (first run: 5-10 minutes for image pulls)

## Network Communication

All services communicate over the `mixgem_dev` bridge network using Docker DNS:

- Services reference each other by container name (e.g., `postgres`, `redis`, `ollama`)
- External access via `localhost` on mapped ports
- No TLS/SSL in development (use production setup for encrypted communication)

## Customization Points

1. **Environment Variables**: Edit `.env.dev`
2. **Docker Compose Override**: Create `docker-compose.override.yml`
3. **Service Profiles**: Comment out unused services in `docker-compose.dev.yml`
4. **Volume Mounts**: Add local directories for hot reload
5. **Resource Limits**: Adjust CPU/memory in override file
6. **Port Mappings**: Change external ports in `.env.dev`

## Security Considerations (Development Only)

⚠️ **This setup is NOT production-ready:**

- Default passwords (admin, dev_password)
- No TLS/SSL encryption
- Exposed admin interfaces
- Debug logging enabled
- No network isolation
- Anonymous access to monitoring
- No secrets management
- No authentication on most services

For production, use `docker-compose.prod.yml` with proper security configurations.
