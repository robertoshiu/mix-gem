# Quick Start - Development Environment

Get Mix-GEM running locally in under 5 minutes.

## TL;DR

```bash
# Windows
start-dev.bat up -d

# Linux/Mac
chmod +x start-dev.sh
./start-dev.sh up -d

# Using Make
make dev-up
```

That's it! All services are now running.

## Access Your Services

### 🎯 Main Applications

| Service | URL | Description |
|---------|-----|-------------|
| Scavenger API | http://localhost:8000/docs | SECS/GEM data ingestion API |
| RAG Engine | http://localhost:8001/docs | Agentic RAG orchestration |

### 🔧 Development Tools

| Service | URL | Login |
|---------|-----|-------|
| pgAdmin | http://localhost:5050 | admin@mixgem.dev / admin |
| Redis Commander | http://localhost:8081 | (no auth) |

### 📊 Monitoring

| Service | URL | Login |
|---------|-----|-------|
| Grafana | http://localhost:3001 | admin / admin |
| Prometheus | http://localhost:9090 | (no auth) |

## What's Running?

✅ **PostgreSQL** with pgvector (port 5432)
✅ **Redis** for caching (port 6379)
✅ **Ollama** for local LLMs (port 11434)
✅ **Scavenger API** for SECS/GEM (port 8000)
✅ **RAG Engine** for AI queries (port 8001)
✅ **SECS/GEM Simulator** (ports 5000, 5001)
✅ **Grafana** dashboards (port 3001)
✅ **Prometheus** metrics (port 9090)
✅ **pgAdmin** database GUI (port 5050)
✅ **Redis Commander** (port 8081)
✅ Plus monitoring exporters (node, postgres, redis, cadvisor)

## Common Commands

### Windows (start-dev.bat)

```bash
start-dev.bat up          # Start all services
start-dev.bat up -d       # Start in background
start-dev.bat down        # Stop all services
start-dev.bat logs        # View logs
start-dev.bat ps          # Show running services
start-dev.bat clean       # Remove everything (⚠️ deletes data)
start-dev.bat help        # Show all commands
```

### Linux/Mac (start-dev.sh)

```bash
./start-dev.sh up         # Start all services
./start-dev.sh up -d      # Start in background
./start-dev.sh down       # Stop all services
./start-dev.sh logs       # View logs
./start-dev.sh ps         # Show running services
./start-dev.sh clean      # Remove everything (⚠️ deletes data)
./start-dev.sh help       # Show all commands
```

### Make Commands

```bash
make dev-up              # Start all services
make dev-down            # Stop all services
make dev-logs            # View logs
make dev-ps              # Show status
make dev-clean           # Remove everything
make health              # Check health
make dev-urls            # Show all URLs
make help                # Show all commands
```

## Database Access

### pgAdmin (GUI)

1. Open http://localhost:5050
2. Login: `admin@mixgem.dev` / `admin`
3. Add server:
   - **Name**: `Mix-GEM Dev`
   - **Host**: `postgres`
   - **Port**: `5432`
   - **Database**: `mixgem_dev`
   - **Username**: `mixgem`
   - **Password**: `dev_password_change_in_prod`

### Command Line

```bash
# PostgreSQL CLI
docker exec -it mixgem_dev_postgres psql -U mixgem -d mixgem_dev

# Or with make
make db-shell
```

## Redis Access

### Redis Commander (GUI)

Open http://localhost:8081 - that's it!

### Command Line

```bash
# Redis CLI
docker exec -it mixgem_dev_redis redis-cli

# Or with make
make redis-cli
```

## Ollama Setup

Pull models for local LLM inference:

```bash
# Pull Llama 3.2 3B (fast, good quality)
docker exec mixgem_dev_ollama ollama pull llama3.2:3b

# Pull embedding model
docker exec mixgem_dev_ollama ollama pull nomic-embed-text

# List installed models
docker exec mixgem_dev_ollama ollama list

# Or with make
make ollama-pull-llama
make ollama-pull-embed
make ollama-list
```

## Test Your Setup

### 1. Check Service Health

```bash
# All services
make health

# Or manually
docker exec mixgem_dev_postgres pg_isready -U mixgem
docker exec mixgem_dev_redis redis-cli PING
curl http://localhost:11434/api/tags
```

### 2. Test Scavenger API

```bash
# Open API docs
open http://localhost:8000/docs  # Mac
start http://localhost:8000/docs # Windows

# Or test endpoint
curl http://localhost:8000/health
```

### 3. Test RAG Engine

```bash
# Open API docs
open http://localhost:8001/docs  # Mac
start http://localhost:8001/docs # Windows

# Or test endpoint
curl http://localhost:8001/health/live
```

## Configuration

All configuration is in `.env.dev`:

```bash
# Edit configuration
nano .env.dev     # Linux/Mac
notepad .env.dev  # Windows

# Restart to apply changes
start-dev.bat restart
# or
make dev-restart
```

### Common Customizations

**Change ports:**
```bash
GRAFANA_PORT=3002
POSTGRES_PORT=5433
```

**Use Claude for RAG:**
```bash
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
LLM_MODEL=claude-sonnet-4-20250514
```

**Adjust logging:**
```bash
LOG_LEVEL=INFO  # or DEBUG, WARNING, ERROR
```

## View Logs

```bash
# All services
make dev-logs

# Specific service
docker logs -f mixgem_dev_scavenger_api
docker logs -f mixgem_dev_postgres
docker logs -f mixgem_dev_rag_engine

# Or with make
make dev-logs-api
make dev-logs-postgres
make dev-logs-rag
```

## Troubleshooting

### Services won't start

```bash
# Check Docker is running
docker info

# Check for port conflicts
netstat -ano | findstr :5432  # Windows
lsof -i :5432                 # Mac/Linux

# Clean and restart
make dev-clean
make dev-up
```

### PostgreSQL connection failed

```bash
# Check health
docker exec mixgem_dev_postgres pg_isready -U mixgem

# View logs
docker logs mixgem_dev_postgres

# Restart
docker restart mixgem_dev_postgres
```

### Out of memory

```bash
# Stop unused services
docker stop mixgem_dev_ollama
docker stop mixgem_dev_grafana

# Prune Docker
docker system prune
```

### Nuclear option (clean slate)

```bash
make dev-clean
docker system prune -a --volumes
make dev-up
```

## Next Steps

1. **Run database migrations** (if needed)
   ```bash
   docker exec -it mixgem_dev_scavenger_api alembic upgrade head
   ```

2. **Load sample data** (if needed)
   ```bash
   docker exec -it mixgem_dev_scavenger_api python scripts/seed_data.py
   ```

3. **Connect to SECS/GEM Simulator**
   - Passive mode: `localhost:5000`
   - Active mode: `localhost:5001`
   - Equipment ID: `LITHO_DEV`

4. **Explore Grafana dashboards**
   - http://localhost:3001 (admin/admin)
   - Pre-configured with Prometheus datasource
   - Includes system, PostgreSQL, Redis, and container metrics

## Need More Help?

- **Full documentation**: [DEV_DEPLOYMENT.md](DEV_DEPLOYMENT.md)
- **Project overview**: [README.md](README.md)
- **Architecture notes**: [CLAUDE.md](CLAUDE.md)
- **Production deployment**: `equipment-monitor/docs/`

## Stop Everything

```bash
# Stop services (keeps data)
make dev-down

# Stop and remove data
make dev-clean
```

---

**Happy coding! 🚀**
