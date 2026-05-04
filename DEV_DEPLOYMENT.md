# Mix-GEM Development Deployment

Complete local development environment with all services enabled and ready to use.

## Quick Start

### Prerequisites

- Docker Desktop (running)
- Docker Compose v2.0+
- 8GB RAM minimum (16GB recommended)
- 20GB free disk space

### Start All Services (Windows)

```bash
# Start all services in foreground
start-dev.bat up

# Start all services in background
start-dev.bat up -d

# Start with rebuild
start-dev.bat up --build -d
```

### Start All Services (Linux/Mac)

```bash
# Make script executable
chmod +x start-dev.sh

# Start all services in foreground
./start-dev.sh up

# Start all services in background
./start-dev.sh up -d

# Start with rebuild
./start-dev.sh up --build -d
```

### Manual Start

```bash
docker-compose -f docker-compose.dev.yml --env-file .env.dev up -d
```

## Service Architecture

### Core Infrastructure (Always Running)

| Service | Port | Description | Credentials |
|---------|------|-------------|-------------|
| **PostgreSQL** | 5432 | pgvector/pg17 database | mixgem / dev_password |
| **Redis** | 6379 | In-memory cache | No auth |

### Application Services

| Service | Port | Description | Documentation |
|---------|------|-------------|---------------|
| **Ollama** | 11434 | Local LLM server | http://localhost:11434 |
| **RAG Engine** | 8001 | LangGraph + LightRAG | http://localhost:8001/docs |
| **Scavenger API** | 8000 | SECS/GEM ingestion | http://localhost:8000/docs |
| **SECS/GEM Simulator** | 5000, 5001 | Equipment simulator | Passive/Active HSMS |

### Monitoring Stack

| Service | Port | Description | Login |
|---------|------|-------------|-------|
| **Grafana** | 3001 | Dashboards & visualization | admin / admin |
| **Prometheus** | 9090 | Metrics collection | No auth |
| **cAdvisor** | 8080 | Container metrics | No auth |
| **Node Exporter** | 9100 | System metrics | No auth |
| **Postgres Exporter** | 9187 | Database metrics | No auth |
| **Redis Exporter** | 9121 | Redis metrics | No auth |

### Development Tools

| Service | Port | Description | Login |
|---------|------|-------------|-------|
| **pgAdmin** | 5050 | PostgreSQL GUI | admin@mixgem.dev / admin |
| **Redis Commander** | 8081 | Redis GUI | No auth |

## Quick Access URLs

### 🎯 Main Applications

- **Scavenger API**: http://localhost:8000/docs (FastAPI Swagger)
- **RAG Engine**: http://localhost:8001/docs (FastAPI Swagger)
- **Grafana**: http://localhost:3001 (admin/admin)

### 🔧 Development Tools

- **pgAdmin**: http://localhost:5050 (Database management)
- **Redis Commander**: http://localhost:8081 (Redis browser)

### 📊 Monitoring

- **Prometheus**: http://localhost:9090 (Metrics & queries)
- **cAdvisor**: http://localhost:8080 (Container metrics)

## Configuration

### Environment Variables

The `.env.dev` file contains all configuration:

```bash
# Core
POSTGRES_PASSWORD=dev_password_change_in_prod
POSTGRES_DB=mixgem_dev

# Application
LOG_LEVEL=DEBUG
EMBEDDING_MODEL=nomic-embed-text
LLM_MODEL=llama3.2:3b

# API Keys (optional for dev)
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
```

### Customizing Ports

Edit `.env.dev` to change any port:

```bash
POSTGRES_PORT=5433
REDIS_PORT=6380
GRAFANA_PORT=3002
```

## Common Tasks

### View Logs

```bash
# All services
start-dev.bat logs

# Specific service
docker-compose -f docker-compose.dev.yml logs -f scavenger-api

# Last 100 lines
docker-compose -f docker-compose.dev.yml logs --tail=100 rag-engine
```

### Stop Services

```bash
# Stop all
start-dev.bat down

# Stop specific service
docker-compose -f docker-compose.dev.yml stop simulator
```

### Restart Services

```bash
# Restart all
start-dev.bat restart

# Restart specific
docker-compose -f docker-compose.dev.yml restart scavenger-api
```

### Check Service Status

```bash
start-dev.bat ps
```

### Clean Everything (⚠️ Deletes All Data)

```bash
start-dev.bat clean
```

### Rebuild Services

```bash
# Rebuild all
start-dev.bat up --build

# Rebuild specific service
docker-compose -f docker-compose.dev.yml build scavenger-api
docker-compose -f docker-compose.dev.yml up -d scavenger-api
```

## Database Access

### Using pgAdmin

1. Navigate to http://localhost:5050
2. Login: `admin@mixgem.dev` / `admin`
3. Add server:
   - **Host**: `postgres` (Docker network) or `host.docker.internal` (from pgAdmin)
   - **Port**: `5432`
   - **Database**: `mixgem_dev`
   - **Username**: `mixgem`
   - **Password**: `dev_password_change_in_prod`

### Using psql CLI

```bash
# Connect from host
docker exec -it mixgem_dev_postgres psql -U mixgem -d mixgem_dev

# Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

# List tables
\dt

# Query example
SELECT * FROM events LIMIT 10;
```

### Direct Connection

```bash
psql postgresql://mixgem:dev_password_change_in_prod@localhost:5432/mixgem_dev
```

## Redis Access

### Using Redis Commander

1. Navigate to http://localhost:8081
2. Browse keys, view values, execute commands

### Using redis-cli

```bash
# Connect from host
docker exec -it mixgem_dev_redis redis-cli

# Common commands
PING
KEYS *
GET mykey
SET mykey "value"
```

## Ollama Setup

### Pull Models

```bash
# Connect to Ollama container
docker exec -it mixgem_dev_ollama ollama pull llama3.2:3b

# Pull embedding model
docker exec -it mixgem_dev_ollama ollama pull nomic-embed-text

# List models
docker exec -it mixgem_dev_ollama ollama list
```

### Test Ollama

```bash
curl http://localhost:11434/api/tags
```

## Monitoring with Grafana

### Access Grafana

1. Navigate to http://localhost:3001
2. Login: `admin` / `admin`
3. Prometheus datasource is pre-configured

### Pre-configured Dashboards

The stack includes provisioned dashboards for:
- System metrics (CPU, memory, disk)
- PostgreSQL performance
- Redis metrics
- Container metrics (cAdvisor)

### Custom Queries

Prometheus is available at http://localhost:9090

Example queries:
```promql
# Container CPU usage
container_cpu_usage_seconds_total

# PostgreSQL connections
pg_stat_database_numbackends

# Redis memory
redis_memory_used_bytes
```

## SECS/GEM Simulator

### Test Connection

```bash
# Check simulator is listening
nc -zv localhost 5000  # Passive mode
nc -zv localhost 5001  # Active mode
```

### View Simulator Logs

```bash
docker logs -f mixgem_dev_simulator
```

### Load Custom Scenarios

Place scenario files in `./scavenger/scenarios/` - they are mounted as read-only.

## Development Workflow

### Hot Reload

Services with mounted volumes support hot reload:

```yaml
# In docker-compose.dev.yml
volumes:
  - ./scavenger:/app:cached  # Changes reflected immediately
```

### Running Tests

```bash
# Run tests in container
docker exec -it mixgem_dev_scavenger_api pytest

# Run with coverage
docker exec -it mixgem_dev_scavenger_api pytest --cov=app --cov-report=html
```

### Debugging

Enable debug logging:

```bash
# In .env.dev
LOG_LEVEL=DEBUG
```

View detailed logs:

```bash
docker logs -f mixgem_dev_scavenger_api
```

## Troubleshooting

### Services Won't Start

```bash
# Check Docker is running
docker info

# Check for port conflicts
netstat -ano | findstr :5432  # Windows
lsof -i :5432                  # Linux/Mac

# Remove orphaned containers
docker-compose -f docker-compose.dev.yml down --remove-orphans
```

### PostgreSQL Connection Failed

```bash
# Check health
docker exec mixgem_dev_postgres pg_isready -U mixgem

# Check logs
docker logs mixgem_dev_postgres

# Restart
docker restart mixgem_dev_postgres
```

### Redis Connection Failed

```bash
# Check health
docker exec mixgem_dev_redis redis-cli PING

# Check logs
docker logs mixgem_dev_redis
```

### Out of Memory

Reduce resource usage:

1. Stop unused services:
   ```bash
   docker-compose -f docker-compose.dev.yml stop ollama grafana
   ```

2. Prune Docker:
   ```bash
   docker system prune -a --volumes
   ```

### Clean Slate

```bash
# Nuclear option - removes everything
start-dev.bat clean
docker system prune -a --volumes
start-dev.bat up --build -d
```

## Network Architecture

All services run on a single Docker network (`mixgem_dev`) for easy inter-service communication.

Service discovery:
- Use container names as hostnames (e.g., `postgres`, `redis`, `ollama`)
- External access via localhost ports

## Data Persistence

Named volumes persist data across restarts:

```yaml
volumes:
  dev_pgdata          # PostgreSQL data
  dev_redisdata       # Redis snapshots
  dev_ollama_data     # Ollama models
  dev_rag_storage     # RAG documents
  dev_prometheus_data # Prometheus metrics
  dev_grafana_data    # Grafana dashboards
```

To reset data, use `start-dev.bat clean`.

## Performance Tips

### Development

- Use lightweight models (llama3.2:3b, nomic-embed-text)
- Reduce batch sizes and flush intervals
- Disable unused monitoring exporters
- Use `-d` flag to run in background

### Production-like Testing

- Switch to production models in `.env.dev`
- Enable all monitoring
- Test with production-sized datasets

## Security Notes

⚠️ **This is a development environment. DO NOT use in production!**

- Weak passwords (`admin`, `dev_password`)
- No TLS/SSL encryption
- Anonymous Grafana access enabled
- Debug logging enabled
- No network isolation
- Exposed admin interfaces

For production deployment, use `docker-compose.prod.yml`.

## Next Steps

1. **Initialize Database Schema**
   ```bash
   # Run migrations (if using Alembic)
   docker exec -it mixgem_dev_scavenger_api alembic upgrade head
   ```

2. **Load Sample Data**
   ```bash
   # Run seed scripts
   docker exec -it mixgem_dev_scavenger_api python scripts/seed_data.py
   ```

3. **Configure Grafana Dashboards**
   - Import custom dashboards
   - Configure alerts
   - Create panels

4. **Test SECS/GEM Integration**
   - Connect test equipment
   - Run scenarios
   - Monitor events

## Support

For issues with the dev deployment:

1. Check logs: `start-dev.bat logs`
2. Verify health: `start-dev.bat ps`
3. Review this guide
4. Clean and rebuild: `start-dev.bat clean && start-dev.bat up --build`

For project-specific questions, see the main [README.md](README.md) and [CLAUDE.md](CLAUDE.md).
