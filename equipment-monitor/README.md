# Mix-GEM Equipment Monitor

**Production-ready Docker Compose stack for semiconductor equipment monitoring, SECS/GEM ingestion, and AI-powered RAG systems.**

## Overview

Mix-GEM is a comprehensive platform for:
- **SECS/GEM Equipment Monitoring**: Real-time semiconductor equipment data ingestion via HSMS/SECS-II
- **AI/RAG Engine**: Document Q&A and semantic search powered by LangGraph + LightRAG
- **Observability**: Full monitoring stack with Prometheus, Grafana, and custom dashboards
- **Production-Ready**: Nginx reverse proxy, SSL termination, automated backups

## Quick Start

**See [docs/QUICK_START.md](docs/QUICK_START.md) for detailed 5-minute setup guide.**

### Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- 8GB+ RAM (16GB recommended)
- Linux/macOS/WSL2

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd equipment-monitor
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   nano .env  # Edit with your passwords and API keys
   ```

3. **Start the stack**:
   ```bash
   ./start-stack.sh
   ```

   Or manually:
   ```bash
   export COMPOSE_PROFILES=scavenger,monitoring
   docker-compose -f docker-compose.prod.yml up -d
   ```

## Architecture

### Service Profiles

Mix-GEM uses Docker Compose profiles to enable modular deployment:

| Profile | Services | Use Case |
|---------|----------|----------|
| **Core** (always on) | PostgreSQL, Redis | Database and cache |
| `scavenger` | Scavenger API, Recorder | SECS/GEM equipment data ingestion |
| `simulator` | SECS/GEM Simulator | Test equipment scenarios |
| `rag` | RAG Engine | AI document Q&A and search |
| `ollama` | Ollama LLM Server | Local LLM inference |
| `monitoring` | Prometheus, Grafana, Exporters | Metrics and dashboards |
| `gateway` | Nginx, Certbot | Reverse proxy and SSL |
| `backup` | Backup Service | Automated database/volume backups |

### Technology Stack

- **Database**: PostgreSQL 17 + pgvector (vector embeddings)
- **Cache**: Redis 7 (caching + message queue)
- **SECS/GEM**: Custom Python implementation (HSMS/SECS-II)
- **AI/RAG**: LangGraph + LightRAG + Claude Sonnet 4
- **LLM**: Ollama (local) or Anthropic Claude (cloud)
- **Monitoring**: Prometheus + Grafana
- **Gateway**: Nginx + Let's Encrypt
- **Orchestration**: Docker Compose with profiles

## Service Endpoints

### Default Ports

| Service | Port | URL |
|---------|------|-----|
| Scavenger API | 8000 | http://localhost:8000 |
| RAG Engine | 8001 | http://localhost:8001 |
| Grafana | 3001 | http://localhost:3001 |
| Prometheus | 9090 | http://localhost:9090 |
| PostgreSQL | 5432 | localhost:5432 |
| Redis | 6379 | localhost:6379 |
| Ollama | 11434 | http://localhost:11434 |
| Nginx HTTP | 80 | http://localhost |
| Nginx HTTPS | 443 | https://localhost |

### API Documentation

- **Scavenger API**: http://localhost:8000/docs (OpenAPI/Swagger)
- **RAG Engine**: http://localhost:8001/docs (OpenAPI/Swagger)

## Usage Examples

### Start Specific Profiles

```bash
# SECS/GEM monitoring with observability
export COMPOSE_PROFILES=scavenger,monitoring
docker-compose -f docker-compose.prod.yml up -d

# Full AI stack with local LLM
export COMPOSE_PROFILES=rag,ollama,monitoring
docker-compose -f docker-compose.prod.yml up -d

# Complete production deployment
export COMPOSE_PROFILES=scavenger,rag,monitoring,gateway
docker-compose -f docker-compose.prod.yml up -d
```

### View Logs

```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f scavenger-api

# With timestamps
docker-compose -f docker-compose.prod.yml logs -f --timestamps
```

### Stop Services

```bash
# Stop all services
docker-compose -f docker-compose.prod.yml down

# Stop and remove volumes (CAUTION: destroys data)
docker-compose -f docker-compose.prod.yml down -v
```

### Backup and Restore

```bash
# Create backup
docker-compose -f docker-compose.prod.yml --profile backup run --rm backup

# List available backups
./backup/restore.sh

# Restore from backup
./backup/restore.sh 20260128_120000
```

## Configuration

### Environment Variables

See `.env.example` for all available options. Key variables:

```bash
# PostgreSQL
POSTGRES_PASSWORD=<strong-password>
POSTGRES_USER=mixgem
POSTGRES_DB=mixgem

# Grafana
GRAFANA_ADMIN_PASSWORD=<strong-password>

# RAG Engine (required for rag profile)
ANTHROPIC_API_KEY=sk-ant-api03-...

# Gateway (required for gateway profile)
CERTBOT_EMAIL=admin@example.com
CERTBOT_DOMAIN=example.com

# Profiles
COMPOSE_PROFILES=scavenger,monitoring
```

### Performance Tuning

PostgreSQL tuning (for 16GB RAM system):

```bash
POSTGRES_SHARED_BUFFERS=4GB
POSTGRES_WORK_MEM=128MB
POSTGRES_MAINTENANCE_WORK_MEM=512MB
POSTGRES_EFFECTIVE_CACHE_SIZE=12GB
POSTGRES_MAX_CONNECTIONS=200
```

## Documentation

- **[QUICK_START.md](docs/QUICK_START.md)**: 5-minute setup guide with examples
- **[DEPLOYMENT.md](docs/DEPLOYMENT.md)**: Production deployment guide
- **[MONITORING.md](docs/MONITORING.md)**: Monitoring and observability
- **[VALIDATION_REPORT.md](docs/VALIDATION_REPORT.md)**: Configuration validation results
- **[Backup README](backup/README.md)**: Backup and restore procedures
- **[Nginx README](nginx/ssl/README.md)**: SSL certificate management
- **[CHANGELOG.md](CHANGELOG.md)**: Version history and release notes

## Development

### Local Development

```bash
# Install dependencies
npm install

# Run Next.js development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

### Testing SECS/GEM Simulator

```bash
# Start simulator
export COMPOSE_PROFILES=simulator,monitoring
docker-compose -f docker-compose.prod.yml up -d

# Connect with HSMS client
# Passive: localhost:5000
# Active: localhost:5001
```

## Security

### Production Checklist

- [ ] Strong passwords (32+ characters) for `POSTGRES_PASSWORD` and `GRAFANA_ADMIN_PASSWORD`
- [ ] Valid SSL certificates (Let's Encrypt recommended)
- [ ] Firewall rules (only expose necessary ports)
- [ ] Regular backups with offsite storage
- [ ] Log rotation configured
- [ ] API authentication enabled
- [ ] Network segmentation (frontend/backend/monitoring networks)
- [ ] Secrets management (never commit `.env` to git)

### SSL Certificates

**Development** (self-signed):
```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem -out nginx/ssl/cert.pem \
  -subj "/CN=localhost"
```

**Production** (Let's Encrypt):
```bash
# Set CERTBOT_EMAIL and CERTBOT_DOMAIN in .env
docker-compose -f docker-compose.prod.yml --profile gateway up certbot
```

## Monitoring

Access Grafana at http://localhost:3001 (default: admin/admin)

Pre-configured dashboards:
- **System Overview**: CPU, memory, disk, network
- **PostgreSQL**: Database performance and connections
- **Redis**: Cache hit rates and memory usage
- **Docker**: Container metrics via cAdvisor
- **Application**: Custom business metrics

## Troubleshooting

### Common Issues

**Docker daemon not running**:
```bash
sudo systemctl start docker
```

**Port already in use**:
```bash
# Change ports in .env
POSTGRES_PORT=5433
REDIS_PORT=6380
```

**Permission denied**:
```bash
chmod +x start-stack.sh
chmod +x backup/backup.sh
chmod +x backup/restore.sh
```

**Container health check failing**:
```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs <service-name>

# Restart service
docker-compose -f docker-compose.prod.yml restart <service-name>
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see LICENSE file for details

## Support

- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Documentation**: `/docs` directory

## Acknowledgments

- SEMI Standards for SECS/GEM protocols
- Anthropic Claude for AI/RAG capabilities
- Prometheus/Grafana community for monitoring tools
- PostgreSQL and pgvector teams
