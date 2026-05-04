# Development Deployment Setup - Summary

## What Was Created

A complete development environment for Mix-GEM that brings all services together for easy local development.

### Files Created

```
mix-gem/
├── docker-compose.dev.yml        # Main dev docker-compose file
├── .env.dev                      # Development environment variables
├── .gitignore                    # Git ignore rules
├── start-dev.sh                  # Linux/Mac startup script (executable)
├── start-dev.bat                 # Windows startup script
├── Makefile                      # Make commands for easy management
├── DEV_DEPLOYMENT.md             # Complete deployment documentation
├── QUICKSTART_DEV.md             # Quick reference guide
└── DEV_SETUP_SUMMARY.md          # This file
```

## Key Features

### ✅ All Services Enabled by Default

Unlike the production setup which uses profiles, the dev deployment enables all services:

- **Core**: PostgreSQL (pgvector), Redis
- **AI/LLM**: Ollama for local models
- **Applications**: RAG Engine, Scavenger API, SECS/GEM Simulator
- **Monitoring**: Prometheus, Grafana, Node Exporter, Postgres Exporter, Redis Exporter, cAdvisor
- **Dev Tools**: pgAdmin, Redis Commander

### ✅ Developer-Friendly Configuration

- Weak passwords for local development (`admin`, `dev_password`)
- Debug logging enabled by default
- Anonymous Grafana access enabled
- Hot reload support with volume mounts
- Faster health checks
- Simpler restart policies

### ✅ Single Network Architecture

All services run on `mixgem_dev` network for easy inter-service communication.

### ✅ Named Volumes for Persistence

Data persists across restarts:
- `dev_pgdata` - PostgreSQL database
- `dev_redisdata` - Redis snapshots
- `dev_ollama_data` - Ollama models
- `dev_rag_storage` - RAG documents
- `dev_prometheus_data` - Prometheus metrics
- `dev_grafana_data` - Grafana dashboards

## Quick Start

### Option 1: Shell Script (Recommended)

**Windows:**
```bash
start-dev.bat up -d
```

**Linux/Mac:**
```bash
chmod +x start-dev.sh
./start-dev.sh up -d
```

### Option 2: Make Commands

```bash
make dev-up       # Start all services
make dev-urls     # Show access URLs
make health       # Check health
```

### Option 3: Docker Compose Direct

```bash
docker-compose -f docker-compose.dev.yml --env-file .env.dev up -d
```

## Service Access

### Main Services

| Service | Port | URL | Default Credentials |
|---------|------|-----|-------------------|
| PostgreSQL | 5432 | `localhost:5432` | mixgem / dev_password_change_in_prod |
| Redis | 6379 | `localhost:6379` | (no auth) |
| Ollama | 11434 | http://localhost:11434 | (no auth) |
| Scavenger API | 8000 | http://localhost:8000/docs | (no auth) |
| RAG Engine | 8001 | http://localhost:8001/docs | (no auth) |
| SECS/GEM Simulator | 5000, 5001 | `localhost:5000/5001` | (HSMS protocol) |

### Development Tools

| Tool | Port | URL | Default Credentials |
|------|------|-----|-------------------|
| pgAdmin | 5050 | http://localhost:5050 | admin@mixgem.dev / admin |
| Redis Commander | 8081 | http://localhost:8081 | (no auth) |

### Monitoring

| Tool | Port | URL | Default Credentials |
|------|------|-----|-------------------|
| Grafana | 3001 | http://localhost:3001 | admin / admin |
| Prometheus | 9090 | http://localhost:9090 | (no auth) |
| cAdvisor | 8080 | http://localhost:8080 | (no auth) |
| Node Exporter | 9100 | http://localhost:9100/metrics | (no auth) |
| Postgres Exporter | 9187 | http://localhost:9187/metrics | (no auth) |
| Redis Exporter | 9121 | http://localhost:9121/metrics | (no auth) |

## Common Workflows

### Starting Development

```bash
# Start everything
make dev-up

# Check health
make health

# View logs
make dev-logs

# Show all URLs
make dev-urls
```

### Database Work

```bash
# Open pgAdmin
open http://localhost:5050

# Or use CLI
make db-shell

# Backup database
make db-backup
```

### Redis Work

```bash
# Open Redis Commander
open http://localhost:8081

# Or use CLI
make redis-cli
```

### Monitoring

```bash
# Open Grafana
open http://localhost:3001

# View metrics in Prometheus
open http://localhost:9090
```

### Viewing Logs

```bash
# All services
make dev-logs

# Specific services
make dev-logs-api       # Scavenger API
make dev-logs-rag       # RAG Engine
make dev-logs-postgres  # PostgreSQL
make dev-logs-redis     # Redis
```

### Stopping Services

```bash
# Stop all (keeps data)
make dev-down

# Stop and remove data
make dev-clean
```

## Configuration

### Environment Variables (.env.dev)

The `.env.dev` file contains all configuration with sensible defaults:

```bash
# Database
POSTGRES_DB=mixgem_dev
POSTGRES_USER=mixgem
POSTGRES_PASSWORD=dev_password_change_in_prod

# Logging
LOG_LEVEL=DEBUG

# Models (local by default)
EMBEDDING_MODEL=nomic-embed-text
LLM_MODEL=llama3.2:3b

# API Keys (optional for dev)
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
```

### Customizing Ports

Edit `.env.dev` to change ports:

```bash
POSTGRES_PORT=5433
REDIS_PORT=6380
GRAFANA_PORT=3002
```

Restart to apply:

```bash
make dev-restart
```

### Using Claude API

To use Claude instead of local Ollama:

```bash
# Edit .env.dev
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
LLM_MODEL=claude-sonnet-4-20250514

# Restart RAG Engine
docker-compose -f docker-compose.dev.yml restart rag-engine
```

## Differences from Production

### Security
- ❌ Weak passwords (never use in production)
- ❌ No TLS/SSL
- ❌ No authentication on monitoring tools
- ❌ Debug logging enabled

### Performance
- 🔧 Smaller resource limits
- 🔧 Shorter health check intervals
- 🔧 Smaller batch sizes
- 🔧 Less aggressive restart policies

### Features
- ➕ pgAdmin and Redis Commander included
- ➕ Anonymous Grafana access
- ➕ Hot reload with volume mounts
- ➕ All services enabled by default
- ➖ No Nginx gateway
- ➖ No SSL/Certbot
- ➖ No backup service
- ➖ Shorter data retention (7 days vs 30 days)

## Troubleshooting

### Docker not running
```bash
# Check Docker
docker info

# Start Docker Desktop (Windows/Mac)
```

### Port conflicts
```bash
# Windows
netstat -ano | findstr :5432

# Linux/Mac
lsof -i :5432
```

### Services won't start
```bash
# Check logs
make dev-logs

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
# Stop heavy services
docker stop mixgem_dev_ollama
docker stop mixgem_dev_grafana

# Prune Docker
docker system prune
```

### Nuclear option
```bash
# Remove everything and start fresh
make dev-clean
docker system prune -a --volumes
make dev-up --build
```

## Available Commands

### Shell Scripts

**start-dev.bat / start-dev.sh:**
- `up` - Start all services
- `up -d` - Start in background
- `down` - Stop all services
- `restart` - Restart all services
- `logs` - Show logs
- `ps` - Show running services
- `clean` - Remove everything (⚠️ deletes data)
- `help` - Show help

### Make Commands

```bash
make help              # Show all commands
make dev-up            # Start services
make dev-down          # Stop services
make dev-restart       # Restart services
make dev-logs          # Show logs
make dev-ps            # Show status
make dev-build         # Rebuild images
make dev-clean         # Remove everything
make dev-urls          # Show access URLs
make health            # Check health
make db-shell          # PostgreSQL CLI
make redis-cli         # Redis CLI
make ollama-list       # List Ollama models
make ollama-pull-llama # Pull Llama model
make ollama-pull-embed # Pull embedding model
```

### Docker Compose Commands

```bash
# Start
docker-compose -f docker-compose.dev.yml --env-file .env.dev up -d

# Stop
docker-compose -f docker-compose.dev.yml --env-file .env.dev down

# Logs
docker-compose -f docker-compose.dev.yml --env-file .env.dev logs -f

# Status
docker-compose -f docker-compose.dev.yml --env-file .env.dev ps

# Rebuild
docker-compose -f docker-compose.dev.yml --env-file .env.dev build

# Clean
docker-compose -f docker-compose.dev.yml --env-file .env.dev down -v --remove-orphans
```

## Documentation

- **QUICKSTART_DEV.md** - Quick reference (start here!)
- **DEV_DEPLOYMENT.md** - Complete documentation
- **DEV_SETUP_SUMMARY.md** - This file
- **CLAUDE.md** - Project architecture and skills
- **README.md** - Main project README

## Next Steps

1. **Start the stack**
   ```bash
   make dev-up
   ```

2. **Pull Ollama models** (for local LLM inference)
   ```bash
   make ollama-pull-llama
   make ollama-pull-embed
   ```

3. **Access Grafana** and explore dashboards
   ```bash
   open http://localhost:3001  # admin/admin
   ```

4. **Test APIs** via Swagger UI
   - Scavenger: http://localhost:8000/docs
   - RAG Engine: http://localhost:8001/docs

5. **Connect to databases** via GUI
   - pgAdmin: http://localhost:5050
   - Redis Commander: http://localhost:8081

6. **Run migrations** (if needed)
   ```bash
   docker exec -it mixgem_dev_scavenger_api alembic upgrade head
   ```

7. **Load sample data** (if available)
   ```bash
   docker exec -it mixgem_dev_scavenger_api python scripts/seed_data.py
   ```

## Support & Resources

- Shell script help: `start-dev.bat help` or `./start-dev.sh help`
- Make help: `make help`
- Full documentation: [DEV_DEPLOYMENT.md](DEV_DEPLOYMENT.md)
- Quick reference: [QUICKSTART_DEV.md](QUICKSTART_DEV.md)

---

**Happy coding! 🚀**
