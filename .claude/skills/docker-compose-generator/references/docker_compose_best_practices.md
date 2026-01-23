# Docker Compose Best Practices

This document outlines best practices for writing production-ready Docker Compose files. Following these guidelines will help you create secure, maintainable, and performant container configurations.

## Table of Contents

1. [Version and Compatibility](#version-and-compatibility)
2. [Security Hardening](#security-hardening)
3. [Networking Patterns](#networking-patterns)
4. [Resource Management](#resource-management)
5. [Data Persistence](#data-persistence)
6. [Environment Variables and Secrets](#environment-variables-and-secrets)
7. [Logging and Monitoring](#logging-and-monitoring)
8. [Service Dependencies](#service-dependencies)
9. [Image Management](#image-management)
10. [Development vs Production](#development-vs-production)

---

## Version and Compatibility

### Use Compose Specification Format

Modern Docker Compose no longer requires a `version` field when using Docker Compose V2. However, if you need compatibility with older tooling or Docker Swarm, specify version `3.8` or `3.9` for the most features.

```yaml
# Modern approach (Compose V2) - version field optional
services:
  web:
    image: nginx:alpine

# Legacy/Swarm compatibility - explicit version
version: "3.9"
services:
  web:
    image: nginx:alpine
```

### Pin Your Compose File Format

When working in teams, document which Compose version features you're using. Some features like `depends_on.condition` require specific versions or the modern Compose specification.

---

## Security Hardening

### Run Containers as Non-Root Users

By default, containers run as root, which poses security risks if a container is compromised. Always specify a non-root user when possible.

```yaml
services:
  app:
    image: myapp:latest
    user: "1000:1000"  # Run as UID 1000, GID 1000
```

For official images that support it, use the built-in non-root user:

```yaml
services:
  postgres:
    image: postgres:15-alpine
    user: postgres  # Use the postgres user built into the image
```

### Drop Unnecessary Linux Capabilities

Containers inherit a set of Linux capabilities by default. Drop all capabilities and add back only what's needed.

```yaml
services:
  app:
    image: myapp:latest
    cap_drop:
      - ALL  # Drop all capabilities first
    cap_add:
      - NET_BIND_SERVICE  # Add back only what's needed (e.g., bind to ports < 1024)
```

### Use Read-Only Root Filesystem

Prevent runtime modifications to the container filesystem by making it read-only. Use tmpfs for directories that need write access.

```yaml
services:
  app:
    image: myapp:latest
    read_only: true  # Make root filesystem read-only
    tmpfs:
      - /tmp        # Allow writes to /tmp
      - /var/run    # Allow writes for PID files
    volumes:
      - app_data:/app/data  # Named volume for persistent data
```

### Disable Privilege Escalation

Prevent processes from gaining additional privileges beyond their parent process.

```yaml
services:
  app:
    image: myapp:latest
    security_opt:
      - no-new-privileges:true  # Prevent privilege escalation
```

### Use Security Profiles

Apply seccomp and AppArmor profiles to restrict system calls and capabilities.

```yaml
services:
  app:
    image: myapp:latest
    security_opt:
      - seccomp:./seccomp-profile.json  # Custom seccomp profile
      - apparmor:docker-default         # AppArmor profile
```

### Limit Container Resources to Prevent DoS

Resource limits prevent a single container from consuming all host resources, which could affect other containers or the host system.

```yaml
services:
  app:
    image: myapp:latest
    deploy:
      resources:
        limits:
          cpus: "1.0"      # Maximum 1 CPU core
          memory: 512M     # Maximum 512MB RAM
          pids: 100        # Maximum 100 processes
        reservations:
          cpus: "0.25"     # Guaranteed 0.25 CPU cores
          memory: 128M     # Guaranteed 128MB RAM
```

### Network Security

Never expose database ports to the host unless absolutely necessary. Use internal networks for service-to-service communication.

```yaml
services:
  app:
    ports:
      - "8080:8080"  # Only expose the application
    networks:
      - frontend
      - backend

  database:
    # No ports exposed to host - only accessible via backend network
    networks:
      - backend

networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge
    internal: true  # No external connectivity
```

---

## Networking Patterns

### Use Custom Bridge Networks

Always define custom networks rather than relying on the default bridge network. Custom networks provide automatic DNS resolution between containers using service names.

```yaml
services:
  web:
    networks:
      - app_network

  api:
    networks:
      - app_network

networks:
  app_network:
    driver: bridge
```

### Implement Network Segmentation

Separate your frontend and backend services into different networks. Only services that need to communicate should share a network.

```yaml
services:
  nginx:
    networks:
      - frontend  # Public-facing network

  api:
    networks:
      - frontend  # Receives requests from nginx
      - backend   # Connects to database

  database:
    networks:
      - backend   # Only accessible from backend network

networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge
    internal: true  # Isolated from external access
```

### Use Aliases for Service Discovery

Network aliases allow a service to be reached by multiple names, useful for migration scenarios or providing logical names.

```yaml
services:
  postgres-primary:
    image: postgres:15
    networks:
      database:
        aliases:
          - db           # Can be reached as "db"
          - postgres     # Can be reached as "postgres"
          - database     # Can be reached as "database"

networks:
  database:
    driver: bridge
```

### Configure DNS Options

For services that need specific DNS behavior, configure DNS settings explicitly.

```yaml
services:
  app:
    dns:
      - 8.8.8.8
      - 8.8.4.4
    dns_search:
      - example.com
    dns_opt:
      - ndots:1
```

---

## Resource Management

### Always Set Resource Limits in Production

Without limits, a single misbehaving container can exhaust host resources and affect all other containers.

```yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: "2.0"
          memory: 1G
        reservations:
          cpus: "0.5"
          memory: 256M
```

### Use Memory Reservations for Critical Services

Reservations guarantee minimum resources for critical services, ensuring they can function even when the host is under load.

```yaml
services:
  database:
    deploy:
      resources:
        limits:
          memory: 2G
        reservations:
          memory: 1G  # Database always gets at least 1GB
```

### Configure OOM Behavior

Control what happens when a container exceeds its memory limit.

```yaml
services:
  app:
    # Disable OOM killer (not recommended for most cases)
    oom_kill_disable: false
    
    # Set OOM score adjustment (-1000 to 1000, lower = less likely to be killed)
    oom_score_adj: -500
```

### Set Process Limits

Limit the number of processes a container can spawn to prevent fork bombs.

```yaml
services:
  app:
    deploy:
      resources:
        limits:
          pids: 200  # Maximum 200 processes
    ulimits:
      nproc: 65535     # Process limit
      nofile:
        soft: 20000    # Soft limit for open files
        hard: 40000    # Hard limit for open files
```

---

## Data Persistence

### Use Named Volumes for Persistent Data

Named volumes are managed by Docker and persist across container restarts and removals. Always use them for database data, uploaded files, and other persistent state.

```yaml
services:
  database:
    volumes:
      - db_data:/var/lib/postgresql/data  # Named volume

volumes:
  db_data:  # Docker manages this volume
    driver: local
```

### Use Bind Mounts Only for Development

Bind mounts couple the container to the host filesystem structure. Use them for development to enable hot-reloading, but prefer named volumes in production.

```yaml
# Development configuration
services:
  app:
    volumes:
      - ./src:/app/src          # Bind mount for hot-reload
      - node_modules:/app/node_modules  # Named volume for dependencies

# Production configuration
services:
  app:
    volumes:
      - app_data:/app/data      # Named volume only
```

### Make Configuration Mounts Read-Only

When mounting configuration files, use the `:ro` flag to prevent accidental modifications.

```yaml
services:
  nginx:
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro     # Read-only config
      - ./certs:/etc/nginx/certs:ro               # Read-only certificates
      - nginx_cache:/var/cache/nginx              # Writable cache volume
```

### Document Volume Backup Procedures

Always document how to back up your volumes. Include this in your project's README or operations documentation.

```yaml
volumes:
  db_data:
    labels:
      - "backup.schedule=daily"
      - "backup.retention=7d"
      - "backup.command=pg_dump -U postgres dbname > /backup/db.sql"
```

Backup command example:
```bash
# Create a backup of a PostgreSQL volume
docker run --rm \
  -v myapp_db_data:/source:ro \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/db_data_$(date +%Y%m%d).tar.gz -C /source .
```

---

## Environment Variables and Secrets

### Never Hardcode Secrets

Never put passwords, API keys, or other secrets directly in your compose file. Use environment variables with external .env files.

```yaml
# BAD - Never do this
services:
  database:
    environment:
      POSTGRES_PASSWORD: mysecretpassword123

# GOOD - Use variable substitution
services:
  database:
    environment:
      POSTGRES_PASSWORD: ${DB_PASSWORD}
```

### Use Required Variable Syntax for Critical Values

Use the `${VAR:?error}` syntax to ensure critical variables are set, failing fast if they're missing.

```yaml
services:
  database:
    environment:
      # Fails with error message if DB_PASSWORD is not set
      POSTGRES_PASSWORD: ${DB_PASSWORD:?Database password is required}
      
      # Uses default if DB_USER is not set
      POSTGRES_USER: ${DB_USER:-postgres}
      
      # Uses default only if DB_NAME is unset (not if empty)
      POSTGRES_DB: ${DB_NAME-myapp}
```

### Separate Environment Files by Purpose

Use multiple .env files for different purposes and environments.

```yaml
services:
  app:
    env_file:
      - .env                    # Common variables
      - .env.${ENVIRONMENT}     # Environment-specific (dev, staging, prod)
      - .env.secrets            # Secrets (git-ignored)
```

### Use Docker Secrets for Production (Swarm)

In Docker Swarm, use secrets for sensitive data instead of environment variables.

```yaml
services:
  database:
    secrets:
      - db_password
    environment:
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password

secrets:
  db_password:
    external: true  # Created outside of compose: docker secret create db_password password.txt
```

### Set Restrictive Permissions on .env Files

Your .env files should never be readable by others. The generate_env_file.py script sets permissions to 600 automatically.

```bash
chmod 600 .env .env.secrets
```

---

## Logging and Monitoring

### Configure Log Rotation

Without log limits, container logs can fill up disk space. Always configure log rotation in production.

```yaml
services:
  app:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"    # Maximum 10MB per log file
        max-file: "5"      # Keep 5 rotated files
        compress: "true"   # Compress rotated files
```

### Use Appropriate Log Drivers

Choose the log driver based on your infrastructure. Common options include json-file for local development, syslog for traditional logging infrastructure, and fluentd or gelf for centralized logging systems.

```yaml
services:
  app:
    logging:
      driver: "fluentd"
      options:
        fluentd-address: "localhost:24224"
        tag: "myapp.{{.Name}}"
        fluentd-async: "true"
```

### Add Labels for Monitoring

Use labels to help monitoring systems identify and categorize containers.

```yaml
services:
  app:
    labels:
      - "prometheus.scrape=true"
      - "prometheus.port=9090"
      - "prometheus.path=/metrics"
      - "traefik.enable=true"
      - "com.example.service=api"
      - "com.example.environment=production"
```

### Include Health Endpoints

Always implement and expose health check endpoints in your applications.

```yaml
services:
  app:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    labels:
      - "healthcheck.endpoint=/health"
      - "healthcheck.port=8080"
```

---

## Service Dependencies

### Use Health Check Conditions

Instead of just `depends_on`, use conditions to wait for services to be healthy before starting dependent services.

```yaml
services:
  app:
    depends_on:
      database:
        condition: service_healthy  # Wait for database health check to pass
      redis:
        condition: service_healthy
      migrations:
        condition: service_completed_successfully  # Wait for one-time setup

  database:
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 10
```

### Implement Proper Health Checks

A good health check verifies the service is actually ready to handle requests, not just that the process is running.

```yaml
services:
  api:
    healthcheck:
      # Check that the API responds correctly, not just that the port is open
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s  # Give the app time to start before checking
```

### Use Init Containers for Setup Tasks

For one-time setup tasks like database migrations, use a separate service with `restart: "no"`.

```yaml
services:
  migrations:
    image: myapp:latest
    command: ["./run-migrations.sh"]
    restart: "no"  # Run once and exit
    depends_on:
      database:
        condition: service_healthy

  app:
    image: myapp:latest
    depends_on:
      migrations:
        condition: service_completed_successfully
```

---

## Image Management

### Use Specific Image Tags

Never use `latest` in production. Always pin to specific versions for reproducibility.

```yaml
# BAD - Unpredictable behavior
services:
  database:
    image: postgres:latest

# GOOD - Reproducible builds
services:
  database:
    image: postgres:15.4-alpine
```

### Use Alpine Images When Possible

Alpine-based images are significantly smaller, reducing attack surface and pull times.

```yaml
services:
  database:
    image: postgres:15-alpine  # ~80MB vs ~380MB for debian-based
```

### Build with Specific Targets

Use multi-stage builds and specify targets for different environments.

```yaml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      target: production  # Use the production stage from multi-stage build
      args:
        NODE_ENV: production
```

### Use Build Cache Effectively

Structure your Dockerfile to maximize cache hits. Copy dependency files before source code.

```dockerfile
# Good cache utilization
COPY package*.json ./
RUN npm ci --only=production
COPY . .

# Bad - cache invalidated on any source change
COPY . .
RUN npm ci --only=production
```

---

## Development vs Production

### Use Override Files

Keep your base compose file production-ready and use override files for development-specific settings.

```yaml
# docker-compose.yml (production base)
services:
  app:
    image: myapp:${VERSION:-latest}
    restart: always
    deploy:
      resources:
        limits:
          memory: 512M

# docker-compose.override.yml (development overrides - loaded automatically)
services:
  app:
    build:
      context: .
    volumes:
      - ./src:/app/src
    environment:
      DEBUG: "true"
    ports:
      - "8080:8080"
      - "9229:9229"  # Debugger port
```

### Use Profiles for Optional Services

Group services that should only run in certain contexts using profiles.

```yaml
services:
  app:
    image: myapp:latest
    # No profile - always runs

  debug-tools:
    image: busybox
    profiles:
      - debug  # Only runs when debug profile is active

  load-test:
    image: grafana/k6
    profiles:
      - testing  # Only runs when testing profile is active
```

Start with profiles:
```bash
docker-compose --profile debug up
docker-compose --profile testing up
```

### Environment-Specific Compose Files

For more complex differences, use separate compose files for each environment.

```bash
# Development
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Production
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up

# Testing
docker-compose -f docker-compose.yml -f docker-compose.test.yml up
```

---

## Summary Checklist

Before deploying to production, verify your compose file meets these criteria:

**Security:**
- [ ] Containers run as non-root users where possible
- [ ] Unnecessary capabilities are dropped
- [ ] Resource limits are set for all services
- [ ] Database ports are not exposed to host
- [ ] Secrets are not hardcoded

**Reliability:**
- [ ] Health checks are configured for all services
- [ ] Restart policies are set appropriately
- [ ] Service dependencies use health conditions
- [ ] Resource reservations guarantee minimum resources for critical services

**Operations:**
- [ ] Logging is configured with rotation
- [ ] Specific image tags are used (not `latest`)
- [ ] Volumes are used for persistent data
- [ ] Configuration files are mounted read-only
- [ ] Labels are added for monitoring and organization

**Maintainability:**
- [ ] Environment variables are used for configuration
- [ ] Separate override files exist for development
- [ ] Documentation exists for backup and recovery procedures
- [ ] Network segmentation isolates services appropriately