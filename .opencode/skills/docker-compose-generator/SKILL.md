---
name: docker-compose-generator
description: |
  Generate production-ready Docker Compose configurations for multi-container applications.
  This skill provides templates, validation tools, environment file generation, and deployment
  scripts for Docker, Docker Swarm, and Kubernetes targets.
  
  **Trigger phrases:**
  - "generate docker-compose", "create compose file", "docker compose for..."
  - "configure multi-container app", "containerize my application"
  - "deploy to swarm/kubernetes", "validate my compose file"
  - "generate .env file", "create container configuration"
  
allowed-tools: Read, Write, Edit, Grep, Glob, Bash(docker:*), Bash(kubectl:*), Bash(python3:*), Bash(chmod:*), Bash(./*)
version: 2.0.0
author: Jeremy Longshore <jeremy@intentsolutions.io>
license: MIT
---

# Docker Compose Generator

Generate, validate, and deploy production-ready Docker Compose configurations for multi-container applications. This skill provides comprehensive tooling for the entire container orchestration lifecycle.

## Quick Reference

| Task | Command/Resource |
|------|-----------------|
| Generate compose file | Use `compose_template.yml` as starting point |
| Validate configuration | `./scripts/validate_compose.sh --file <compose.yml>` |
| Generate .env file | `python3 ./scripts/generate_env_file.py --compose <compose.yml>` |
| Deploy to Docker | `./scripts/deploy.sh --compose <compose.yml> --target docker` |
| Deploy to Swarm | `./scripts/deploy.sh --compose <compose.yml> --target swarm` |
| Deploy to Kubernetes | `./scripts/deploy.sh --compose <compose.yml> --target kubernetes` |

## Directory Structure

```
{baseDir}/
├── SKILL.md                          # This file
├── scripts/
│   ├── validate_compose.sh           # Compose file validation
│   ├── generate_env_file.py          # Environment file generator
│   └── deploy.sh                     # Multi-platform deployment
├── templates/
│   └── compose_template.yml          # Base compose template
├── docs/
│   └── example_app_architectures.md  # Architecture patterns
└── references/
    ├── docker_compose_best_practices.md
    ├── common_service_configurations.md
    └── healthcheck_examples.md
```

## Prerequisites

Before using this skill, ensure the following are available:

**Required:**
- Docker Engine 20.10+ installed and running
- docker-compose v2.0+ or Docker Compose plugin
- Python 3.8+ (for environment file generation)
- PyYAML package (`pip install pyyaml`)

**Optional (for deployment targets):**
- Docker Swarm initialized (`docker swarm init`) for Swarm deployments
- kubectl configured with cluster access for Kubernetes deployments
- kompose installed for Kubernetes manifest conversion

**Verification commands:**
```bash
docker --version          # Verify Docker installation
docker-compose --version  # Verify Compose installation
docker info | grep Swarm  # Check Swarm status
kubectl cluster-info      # Verify Kubernetes connectivity
```

## Instructions

### Step 1: Gather Requirements

Before generating a compose file, collect the following information from the user:

**Application Architecture:**
- What services does the application need? (web server, API, database, cache, queue, etc.)
- What are the dependencies between services?
- Does the application need to be publicly accessible?

**Service Details (for each service):**
- Image name or build context (Dockerfile location)
- Port mappings (host:container)
- Environment variables required
- Volume mounts (persistent data, configuration files)
- Resource constraints (CPU, memory limits)

**Infrastructure Requirements:**
- Target deployment platform (Docker, Swarm, Kubernetes)
- Network isolation requirements
- Persistent storage needs
- Health check requirements
- Logging and monitoring needs

**Example questions to ask:**
```
1. What type of application are you containerizing? (web app, API, microservices, etc.)
2. What database(s) does your application use?
3. Does your application need Redis, message queues, or other supporting services?
4. What ports should be exposed to the host?
5. Where should persistent data be stored?
6. What environment variables does your application need?
7. Where will this be deployed? (local Docker, Swarm cluster, Kubernetes)
```

### Step 2: Select Architecture Pattern

Review `{baseDir}/docs/example_app_architectures.md` to identify the closest matching pattern:

**Common Patterns:**

1. **Simple Web Application** (Frontend + Backend + Database)
   - Best for: Traditional web apps, REST APIs with persistence
   - Services: nginx/web server, application server, PostgreSQL/MySQL
   
2. **Message Queue Application** (Producer + Broker + Consumer)
   - Best for: Async processing, event-driven architectures
   - Services: Producer app, RabbitMQ/Redis, Consumer workers

3. **Microservices Architecture** (API Gateway + Services)
   - Best for: Complex applications with multiple domains
   - Services: API gateway, multiple independent services, shared databases

4. **Full-Stack Development** (Frontend + Backend + Database + Cache)
   - Best for: Development environments, complete application stacks
   - Services: React/Vue frontend, Node/Python API, PostgreSQL, Redis

### Step 3: Generate Docker Compose File

Start with the base template and customize for the specific requirements:

```bash
# Copy the base template
cp {baseDir}/templates/compose_template.yml ./docker-compose.yml
```

**Essential configuration sections:**

#### Version and Services Declaration
```yaml
version: "3.9"  # Use 3.9 for latest features

services:
  # Define each service here
```

#### Service Configuration Template
```yaml
  service_name:
    # Image or Build (choose one)
    image: image_name:tag
    # OR
    build:
      context: ./path/to/dockerfile
      dockerfile: Dockerfile
      args:
        BUILD_ARG: value
    
    # Container identification
    container_name: descriptive_name
    
    # Port mappings
    ports:
      - "host_port:container_port"
    
    # Environment variables
    environment:
      - VAR_NAME=value
    # OR reference env file
    env_file:
      - .env
    
    # Volume mounts
    volumes:
      - named_volume:/container/path      # Named volume
      - ./host/path:/container/path       # Bind mount
      - ./config.yml:/app/config.yml:ro   # Read-only mount
    
    # Service dependencies
    depends_on:
      dependency_service:
        condition: service_healthy  # Wait for health check
    
    # Restart policy
    restart: unless-stopped  # Options: no, always, on-failure, unless-stopped
    
    # Health check
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    
    # Resource limits (deploy section for Swarm/production)
    deploy:
      resources:
        limits:
          cpus: "0.5"
          memory: 512M
        reservations:
          cpus: "0.25"
          memory: 256M
    
    # Network assignment
    networks:
      - app_network
    
    # Logging configuration
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

#### Networks Configuration
```yaml
networks:
  app_network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.28.0.0/16
  
  # For external/pre-existing networks
  external_network:
    external: true
    name: my_external_network
```

#### Volumes Configuration
```yaml
volumes:
  # Named volume (Docker-managed)
  db_data:
    driver: local
  
  # Named volume with options
  app_logs:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /path/on/host
```

### Step 4: Configure Common Services

Reference configurations for frequently used services:

#### PostgreSQL Database
```yaml
  postgres:
    image: postgres:15-alpine
    container_name: postgres_db
    environment:
      POSTGRES_USER: ${DB_USER:-appuser}
      POSTGRES_PASSWORD: ${DB_PASSWORD:?Database password required}
      POSTGRES_DB: ${DB_NAME:-appdb}
      PGDATA: /var/lib/postgresql/data/pgdata
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init-scripts:/docker-entrypoint-initdb.d:ro
    ports:
      - "${DB_PORT:-5432}:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-appuser} -d ${DB_NAME:-appdb}"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    networks:
      - backend_network
```

#### Redis Cache
```yaml
  redis:
    image: redis:7-alpine
    container_name: redis_cache
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD:-changeme}
    volumes:
      - redis_data:/data
    ports:
      - "${REDIS_PORT:-6379}:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD:-changeme}", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    networks:
      - backend_network
```

#### Nginx Reverse Proxy
```yaml
  nginx:
    image: nginx:alpine
    container_name: nginx_proxy
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - ./certbot/conf:/etc/letsencrypt:ro
      - ./certbot/www:/var/www/certbot:ro
    depends_on:
      - app
    healthcheck:
      test: ["CMD", "nginx", "-t"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped
    networks:
      - frontend_network
      - backend_network
```

#### RabbitMQ Message Broker
```yaml
  rabbitmq:
    image: rabbitmq:3.12-management-alpine
    container_name: rabbitmq
    environment:
      RABBITMQ_DEFAULT_USER: ${RABBITMQ_USER:-admin}
      RABBITMQ_DEFAULT_PASS: ${RABBITMQ_PASSWORD:-changeme}
      RABBITMQ_DEFAULT_VHOST: ${RABBITMQ_VHOST:-/}
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
    ports:
      - "${RABBITMQ_PORT:-5672}:5672"
      - "${RABBITMQ_MGMT_PORT:-15672}:15672"
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "-q", "ping"]
      interval: 30s
      timeout: 10s
      retries: 5
    restart: unless-stopped
    networks:
      - backend_network
```

### Step 5: Generate Environment File

After creating the compose file, generate a corresponding .env file:

```bash
# Generate .env with defaults
python3 {baseDir}/scripts/generate_env_file.py \
  --compose docker-compose.yml \
  --output .env

# Preview variables without saving
python3 {baseDir}/scripts/generate_env_file.py \
  --compose docker-compose.yml \
  --print

# Overwrite existing .env
python3 {baseDir}/scripts/generate_env_file.py \
  --compose docker-compose.yml \
  --output .env \
  --force
```

**Important:** Review the generated .env file and update placeholder values, especially:
- Database passwords
- API keys and secrets
- External service URLs
- Production-specific configurations

### Step 6: Validate Configuration

Run validation before deployment:

```bash
# Basic validation
{baseDir}/scripts/validate_compose.sh --file docker-compose.yml

# Strict validation (checks best practices)
{baseDir}/scripts/validate_compose.sh --file docker-compose.yml --strict --verbose
```

**Validation checks performed:**
- YAML syntax correctness
- Service configuration validity
- Image and build context references
- Port mapping conflicts
- Volume configurations
- Environment variable references
- Health check definitions (strict mode)
- Restart policies (strict mode)
- Logging configurations (strict mode)

**Manual validation command:**
```bash
# Docker's native validation
docker-compose -f docker-compose.yml config

# Check for syntax errors and variable substitution
docker-compose -f docker-compose.yml config --quiet && echo "Valid" || echo "Invalid"
```

### Step 7: Deploy Application

Choose the appropriate deployment target:

#### Local Docker Deployment
```bash
# Start services
{baseDir}/scripts/deploy.sh \
  --compose docker-compose.yml \
  --target docker \
  --wait

# Or manually
docker-compose up -d
docker-compose ps
docker-compose logs -f
```

#### Docker Swarm Deployment
```bash
# Initialize Swarm if needed
docker swarm init

# Deploy stack
{baseDir}/scripts/deploy.sh \
  --compose docker-compose.yml \
  --target swarm \
  --stack-name myapp \
  --wait

# Or manually
docker stack deploy -c docker-compose.yml myapp
docker stack services myapp
```

#### Kubernetes Deployment
```bash
# Deploy to Kubernetes (uses kompose for conversion)
{baseDir}/scripts/deploy.sh \
  --compose docker-compose.yml \
  --target kubernetes \
  --namespace production \
  --wait

# Or manually with kompose
kompose convert -f docker-compose.yml -o k8s-manifests/
kubectl apply -f k8s-manifests/ -n production
```

## Best Practices

### Security
- Never hardcode secrets in compose files; use environment variables or Docker secrets
- Use specific image tags instead of `latest` for reproducibility
- Run containers as non-root users when possible
- Limit container capabilities with security_opt
- Use read-only mounts for configuration files

### Networking
- Use custom bridge networks instead of the default bridge
- Isolate frontend and backend networks when appropriate
- Only expose ports that need external access
- Use internal networks for service-to-service communication

### Resource Management
- Always set resource limits (CPU, memory) for production
- Use health checks to enable automatic recovery
- Configure appropriate restart policies
- Set logging limits to prevent disk exhaustion

### Data Persistence
- Use named volumes for database and persistent data
- Document backup procedures for volumes
- Use bind mounts only for development or configuration
- Consider volume drivers for production (e.g., NFS, cloud storage)

### Health Checks
```yaml
# HTTP endpoint check
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 60s

# TCP port check
healthcheck:
  test: ["CMD-SHELL", "nc -z localhost 8080 || exit 1"]
  interval: 10s
  timeout: 5s
  retries: 3

# Command execution check
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U postgres"]
  interval: 10s
  timeout: 5s
  retries: 5
```

## Output Artifacts

This skill produces the following deliverables:

**Primary Artifacts:**
- `docker-compose.yml` - Main compose configuration file
- `.env` - Environment variables file (git-ignored, contains secrets)
- `.env.example` - Template environment file for documentation

**Supporting Files (as needed):**
- `docker-compose.override.yml` - Local development overrides
- `docker-compose.prod.yml` - Production-specific configuration
- Service-specific configuration files (nginx.conf, etc.)

**Documentation:**
- README.md with setup and deployment instructions
- Architecture diagram (Mermaid or ASCII)
- Environment variable documentation

## Error Handling

### Common Issues and Solutions

**"Service 'x' depends on service 'y' which is undefined"**
- Verify all service names in `depends_on` exist in the services section
- Check for typos in service names

**"Cannot create container: port is already allocated"**
- Change the host port mapping (left side of the colon)
- Stop conflicting containers: `docker ps` to identify, `docker stop <id>` to stop

**"Volume mount denied" or permission errors**
- Ensure host directories exist and have correct permissions
- On macOS/Windows, verify Docker has access to the directory in Docker Desktop settings

**"Image not found" or pull errors**
- Verify image name and tag exist on the registry
- Check network connectivity and registry authentication
- For private registries, ensure `docker login` has been performed

**Health check failures**
- Increase `start_period` to allow more startup time
- Verify the health check command works inside the container
- Check container logs for application startup errors

**Environment variable not substituted**
- Ensure `.env` file is in the same directory as compose file
- Verify variable syntax: `${VAR_NAME}` or `${VAR_NAME:-default}`
- Check for quotes around variable references in YAML

### Debug Commands
```bash
# View container logs
docker-compose logs -f service_name

# Execute shell in running container
docker-compose exec service_name sh

# Check container resource usage
docker stats

# Inspect container configuration
docker inspect container_name

# View network configuration
docker network inspect network_name

# List volumes and their mount points
docker volume ls
docker volume inspect volume_name
```

## Resources

**Bundled Resources:**
- Templates: `{baseDir}/templates/compose_template.yml`
- Architecture Examples: `{baseDir}/docs/example_app_architectures.md`
- Validation Script: `{baseDir}/scripts/validate_compose.sh`
- Env Generator: `{baseDir}/scripts/generate_env_file.py`
- Deployment Script: `{baseDir}/scripts/deploy.sh`

**External Documentation:**
- [Docker Compose Specification](https://docs.docker.com/compose/compose-file/)
- [Docker Compose CLI Reference](https://docs.docker.com/compose/reference/)
- [Docker Hub Official Images](https://hub.docker.com/search?q=&type=image&image_filter=official)
- [Kompose (Compose to Kubernetes)](https://kompose.io/)

## Examples

### Example 1: Basic Web Application

**User Request:** "Create a Docker Compose file for a Node.js API with PostgreSQL database"

**Generated Configuration:**
```yaml
version: "3.9"

services:
  api:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: node_api
    environment:
      NODE_ENV: ${NODE_ENV:-development}
      DATABASE_URL: postgres://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}
      PORT: 3000
    ports:
      - "${API_PORT:-3000}:3000"
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped
    networks:
      - app_network

  postgres:
    image: postgres:15-alpine
    container_name: postgres_db
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER} -d ${DB_NAME}"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    networks:
      - app_network

networks:
  app_network:
    driver: bridge

volumes:
  postgres_data:
```

### Example 2: Full Development Stack

**User Request:** "Set up a complete development environment with React frontend, FastAPI backend, PostgreSQL, and Redis"

**Generated Configuration:**
```yaml
version: "3.9"

services:
  frontend:
    build:
      context: ./frontend
      target: development
    container_name: react_frontend
    volumes:
      - ./frontend/src:/app/src
      - ./frontend/public:/app/public
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_API_URL=http://localhost:8000
    depends_on:
      - backend
    restart: unless-stopped
    networks:
      - frontend_network

  backend:
    build:
      context: ./backend
    container_name: fastapi_backend
    volumes:
      - ./backend/app:/app/app
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379/0
      SECRET_KEY: ${SECRET_KEY}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped
    networks:
      - frontend_network
      - backend_network

  postgres:
    image: postgres:15-alpine
    container_name: postgres_db
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER} -d ${DB_NAME}"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    networks:
      - backend_network

  redis:
    image: redis:7-alpine
    container_name: redis_cache
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    networks:
      - backend_network

networks:
  frontend_network:
    driver: bridge
  backend_network:
    driver: bridge

volumes:
  postgres_data:
  redis_data:
```

## Workflow Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                    Docker Compose Generation                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. GATHER REQUIREMENTS                                          │
│     └─► Services, ports, volumes, environment variables          │
│                                                                  │
│  2. SELECT ARCHITECTURE PATTERN                                  │
│     └─► Review example_app_architectures.md                      │
│                                                                  │
│  3. GENERATE COMPOSE FILE                                        │
│     └─► Start from compose_template.yml                          │
│     └─► Add services with proper configuration                   │
│     └─► Configure networks and volumes                           │
│                                                                  │
│  4. GENERATE ENVIRONMENT FILE                                    │
│     └─► Run: generate_env_file.py --compose <file>               │
│     └─► Review and update sensitive values                       │
│                                                                  │
│  5. VALIDATE CONFIGURATION                                       │
│     └─► Run: validate_compose.sh --file <file> --strict          │
│     └─► Fix any reported issues                                  │
│                                                                  │
│  6. DEPLOY APPLICATION                                           │
│     └─► Run: deploy.sh --compose <file> --target <platform>      │
│     └─► Verify services are running                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```