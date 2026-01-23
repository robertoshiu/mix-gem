# Health Check Examples

Health checks are essential for container orchestration, ensuring that services are running correctly and can handle traffic. This document provides comprehensive health check configurations for various service types, along with best practices and troubleshooting guidance.

## Table of Contents

1. [Health Check Fundamentals](#health-check-fundamentals)
2. [Database Health Checks](#database-health-checks)
3. [Web Service Health Checks](#web-service-health-checks)
4. [Message Queue Health Checks](#message-queue-health-checks)
5. [Cache Health Checks](#cache-health-checks)
6. [Search Engine Health Checks](#search-engine-health-checks)
7. [Custom Application Health Checks](#custom-application-health-checks)
8. [Advanced Patterns](#advanced-patterns)
9. [Troubleshooting](#troubleshooting)

---

## Health Check Fundamentals

### Anatomy of a Docker Health Check

A Docker health check consists of five key parameters that control when and how the container's health is evaluated. Understanding each parameter helps you tune health checks for your specific service characteristics.

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
  interval: 30s      # Time between health checks
  timeout: 10s       # Maximum time for a single check to complete
  retries: 3         # Consecutive failures before marking unhealthy
  start_period: 60s  # Grace period for container startup
```

The **test** parameter defines the actual health check command. It can be specified in three formats:

```yaml
# Shell form - runs through /bin/sh
test: curl -f http://localhost:8080/health || exit 1

# Exec form (recommended) - runs command directly
test: ["CMD", "curl", "-f", "http://localhost:8080/health"]

# Exec form with shell - useful for complex commands with pipes/redirects
test: ["CMD-SHELL", "curl -f http://localhost:8080/health || exit 1"]
```

The **interval** determines how frequently Docker runs the health check. A shorter interval provides faster detection of failures but increases system load. For most services, 30 seconds strikes a good balance, though critical services might benefit from 10-15 second intervals.

The **timeout** sets the maximum duration for a single health check execution. If the command doesn't complete within this time, it's considered a failure. Set this value based on your service's expected response time under normal conditions, with some buffer for occasional slowdowns.

The **retries** parameter specifies how many consecutive failures must occur before Docker marks the container as unhealthy. This prevents transient issues from triggering unnecessary restarts. Three retries is a common default, meaning a service must fail health checks for at least `interval × retries` seconds before being marked unhealthy.

The **start_period** provides a grace period during container startup when health check failures don't count toward the retry limit. This is crucial for services that need time to initialize, load data, or warm up caches before they can respond to health checks.

### Health Check Exit Codes

Health check commands must return specific exit codes to indicate the container's state:

| Exit Code | Status | Meaning |
|-----------|--------|---------|
| 0 | healthy | Service is operating normally |
| 1 | unhealthy | Service has a problem |
| 2 | reserved | Do not use (reserved for future use) |

### Choosing the Right Check Type

Different scenarios call for different types of health checks. Here's guidance on selecting the appropriate approach:

**TCP Port Check** is the simplest form, verifying only that a port is accepting connections. Use this when you just need to confirm the process is running and listening:

```yaml
# Good for: Basic process liveness
test: ["CMD-SHELL", "nc -z localhost 8080 || exit 1"]
```

**HTTP Endpoint Check** verifies that the service can process requests and return valid responses. This is more thorough than a port check and should be your default choice for web services:

```yaml
# Good for: Web services, APIs
test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
```

**Command Execution Check** runs a service-specific command to verify functionality. This is ideal for databases and services that provide their own health verification tools:

```yaml
# Good for: Databases, specialized services
test: ["CMD-SHELL", "pg_isready -U postgres"]
```

**Business Logic Check** verifies that the service can perform its actual work, not just respond to pings. This is the most thorough but also most complex approach:

```yaml
# Good for: Critical services requiring deep verification
test: ["CMD-SHELL", "curl -f http://localhost:8080/health/deep"]
```

---

## Database Health Checks

### PostgreSQL

PostgreSQL provides the `pg_isready` utility specifically designed for health checks. This tool verifies that the database server is accepting connections.

```yaml
services:
  postgres:
    image: postgres:16-alpine
    healthcheck:
      # Basic check - verifies server is accepting connections
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-postgres} -d ${POSTGRES_DB:-postgres}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s
```

For more thorough verification, you can execute an actual query to ensure the database can process requests:

```yaml
healthcheck:
  # Deep check - executes actual query
  test: ["CMD-SHELL", "pg_isready -U postgres && psql -U postgres -d postgres -c 'SELECT 1' || exit 1"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 60s
```

When connecting to a specific database as a specific user, ensure your health check uses the correct credentials:

```yaml
healthcheck:
  # With explicit connection parameters
  test: ["CMD-SHELL", "pg_isready -h localhost -p 5432 -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
  interval: 10s
  timeout: 5s
  retries: 5
```

For PostgreSQL with SSL/TLS enabled:

```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U postgres && PGSSLMODE=require psql -U postgres -c 'SELECT 1'"]
  interval: 30s
  timeout: 10s
  retries: 3
```

### MySQL / MariaDB

MySQL provides `mysqladmin ping` for basic connectivity checks. Note that the password must be provided as a command-line argument for non-interactive use.

```yaml
services:
  mysql:
    image: mysql:8.0
    healthcheck:
      # Basic ping check
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "-p${MYSQL_ROOT_PASSWORD}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s
```

For a more comprehensive check that verifies query execution:

```yaml
healthcheck:
  # Query execution check
  test: ["CMD-SHELL", "mysql -u root -p${MYSQL_ROOT_PASSWORD} -e 'SELECT 1' || exit 1"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 60s
```

Checking a specific database with a non-root user:

```yaml
healthcheck:
  test: ["CMD-SHELL", "mysql -h localhost -u ${MYSQL_USER} -p${MYSQL_PASSWORD} -D ${MYSQL_DATABASE} -e 'SELECT 1'"]
  interval: 30s
  timeout: 10s
  retries: 3
```

### MongoDB

MongoDB uses the `mongosh` shell (or `mongo` in older versions) to execute administrative commands.

```yaml
services:
  mongodb:
    image: mongo:7
    healthcheck:
      # Ping check using mongosh (MongoDB 5.0+)
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s
```

For authenticated MongoDB instances:

```yaml
healthcheck:
  # With authentication
  test: ["CMD", "mongosh", "-u", "${MONGO_USER}", "-p", "${MONGO_PASSWORD}", "--authenticationDatabase", "admin", "--eval", "db.adminCommand('ping')"]
  interval: 30s
  timeout: 10s
  retries: 3
```

Checking replica set status:

```yaml
healthcheck:
  # Replica set status check
  test: ["CMD-SHELL", "mongosh --eval \"rs.status().ok\" | grep -q 1"]
  interval: 30s
  timeout: 10s
  retries: 5
```

### SQLite

SQLite doesn't have a server process, so health checks verify file accessibility and integrity:

```yaml
healthcheck:
  # Verify database file is readable and valid
  test: ["CMD-SHELL", "sqlite3 /data/app.db 'SELECT 1' || exit 1"]
  interval: 60s
  timeout: 10s
  retries: 3
```

---

## Web Service Health Checks

### HTTP Endpoint Checks

The most common approach for web services is checking a dedicated health endpoint using `curl` or `wget`. The `-f` flag makes curl return a non-zero exit code on HTTP errors.

```yaml
services:
  api:
    image: myapi:latest
    healthcheck:
      # Basic HTTP check
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
```

If curl isn't available in your image, use wget instead:

```yaml
healthcheck:
  # Using wget (common in Alpine-based images)
  test: ["CMD", "wget", "--spider", "-q", "http://localhost:8080/health"]
  interval: 30s
  timeout: 10s
  retries: 3
```

For services without curl or wget, you can use shell networking:

```yaml
healthcheck:
  # Using /dev/tcp (Bash built-in)
  test: ["CMD-SHELL", "exec 3<>/dev/tcp/127.0.0.1/8080 && echo -e 'GET /health HTTP/1.1\r\nHost: localhost\r\n\r\n' >&3 && cat <&3 | grep -q '200 OK'"]
  interval: 30s
  timeout: 10s
  retries: 3
```

### Nginx

Nginx provides a stub_status module for monitoring. First, configure Nginx to expose status:

```nginx
# nginx.conf - add this server block
server {
    listen 8081;
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
    location /nginx_status {
        stub_status;
        access_log off;
    }
}
```

Then configure the health check:

```yaml
services:
  nginx:
    image: nginx:alpine
    healthcheck:
      # Check config validity and server response
      test: ["CMD-SHELL", "nginx -t && curl -f http://localhost:8081/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
```

Simpler approach checking only config validity:

```yaml
healthcheck:
  # Config validation only
  test: ["CMD", "nginx", "-t"]
  interval: 30s
  timeout: 10s
  retries: 3
```

### Apache HTTP Server

Apache can be checked using its server-status module or a simple HTTP request:

```yaml
services:
  apache:
    image: httpd:alpine
    healthcheck:
      # Basic HTTP check
      test: ["CMD-SHELL", "curl -f http://localhost/ || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
```

With server-status module enabled:

```yaml
healthcheck:
  # Server status check
  test: ["CMD-SHELL", "curl -f http://localhost/server-status?auto | grep -q 'ServerUptime'"]
  interval: 30s
  timeout: 10s
  retries: 3
```

### Traefik

Traefik includes a built-in health check command:

```yaml
services:
  traefik:
    image: traefik:v3.0
    healthcheck:
      test: ["CMD", "traefik", "healthcheck"]
      interval: 30s
      timeout: 10s
      retries: 3
```

Alternatively, check the API endpoint:

```yaml
healthcheck:
  test: ["CMD-SHELL", "wget --spider -q http://localhost:8080/ping"]
  interval: 30s
  timeout: 10s
  retries: 3
```

### Caddy

Caddy's admin API provides health information:

```yaml
services:
  caddy:
    image: caddy:2-alpine
    healthcheck:
      # Check admin API
      test: ["CMD", "caddy", "validate", "--config", "/etc/caddy/Caddyfile"]
      interval: 30s
      timeout: 10s
      retries: 3
```

---

## Message Queue Health Checks

### RabbitMQ

RabbitMQ provides comprehensive diagnostic tools. The simplest check uses `rabbitmq-diagnostics`:

```yaml
services:
  rabbitmq:
    image: rabbitmq:3.13-management-alpine
    healthcheck:
      # Quick ping check
      test: ["CMD", "rabbitmq-diagnostics", "-q", "ping"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 60s
```

For a more thorough check that verifies the node is fully operational:

```yaml
healthcheck:
  # Comprehensive check
  test: ["CMD", "rabbitmq-diagnostics", "-q", "check_running"]
  interval: 30s
  timeout: 10s
  retries: 5
```

Checking cluster connectivity (for clustered deployments):

```yaml
healthcheck:
  # Cluster health check
  test: ["CMD-SHELL", "rabbitmq-diagnostics -q check_running && rabbitmq-diagnostics -q check_local_alarms"]
  interval: 30s
  timeout: 15s
  retries: 5
```

Using the management API:

```yaml
healthcheck:
  # Management API check
  test: ["CMD-SHELL", "curl -f -u ${RABBITMQ_USER}:${RABBITMQ_PASSWORD} http://localhost:15672/api/healthchecks/node || exit 1"]
  interval: 30s
  timeout: 10s
  retries: 5
```

### Apache Kafka

Kafka health can be verified using the kafka-topics command to list topics:

```yaml
services:
  kafka:
    image: confluentinc/cp-kafka:7.5.0
    healthcheck:
      # Verify broker is responding
      test: ["CMD-SHELL", "kafka-topics --bootstrap-server localhost:9092 --list"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 60s
```

More specific broker metadata check:

```yaml
healthcheck:
  # Broker metadata check
  test: ["CMD-SHELL", "kafka-broker-api-versions --bootstrap-server localhost:9092 | grep -q 'ApiVersion'"]
  interval: 30s
  timeout: 15s
  retries: 5
```

### Zookeeper

Zookeeper provides the "ruok" (are you ok?) four-letter command:

```yaml
services:
  zookeeper:
    image: confluentinc/cp-zookeeper:7.5.0
    healthcheck:
      # "Are you OK" check
      test: ["CMD-SHELL", "echo ruok | nc localhost 2181 | grep -q imok"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s
```

Alternative using netcat for TCP check:

```yaml
healthcheck:
  # Simple TCP check
  test: ["CMD-SHELL", "nc -z localhost 2181"]
  interval: 10s
  timeout: 5s
  retries: 5
```

### NATS

NATS exposes a monitoring endpoint for health checks:

```yaml
services:
  nats:
    image: nats:2.10-alpine
    healthcheck:
      # Monitoring endpoint check
      test: ["CMD-SHELL", "wget --spider -q http://localhost:8222/healthz || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### Amazon SQS (LocalStack)

For LocalStack or similar local AWS emulators:

```yaml
services:
  localstack:
    image: localstack/localstack:latest
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:4566/_localstack/health | grep -q '\"sqs\": \"running\"'"]
      interval: 30s
      timeout: 10s
      retries: 5
```

---

## Cache Health Checks

### Redis

Redis provides the PING command specifically for health checks:

```yaml
services:
  redis:
    image: redis:7-alpine
    healthcheck:
      # Basic ping (no authentication)
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s
```

With password authentication:

```yaml
healthcheck:
  # Authenticated ping
  test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "ping"]
  interval: 10s
  timeout: 5s
  retries: 5
```

More comprehensive check including memory:

```yaml
healthcheck:
  # Check ping and memory status
  test: ["CMD-SHELL", "redis-cli -a ${REDIS_PASSWORD} ping && redis-cli -a ${REDIS_PASSWORD} info memory | grep -q used_memory"]
  interval: 30s
  timeout: 10s
  retries: 3
```

For Redis Cluster:

```yaml
healthcheck:
  # Cluster node check
  test: ["CMD-SHELL", "redis-cli -a ${REDIS_PASSWORD} cluster info | grep -q 'cluster_state:ok'"]
  interval: 30s
  timeout: 10s
  retries: 5
```

### Memcached

Memcached can be checked using a simple stats command:

```yaml
services:
  memcached:
    image: memcached:alpine
    healthcheck:
      # Stats command check
      test: ["CMD-SHELL", "echo stats | nc localhost 11211 | grep -q 'STAT pid'"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
```

Simpler TCP check:

```yaml
healthcheck:
  # TCP port check
  test: ["CMD-SHELL", "nc -z localhost 11211"]
  interval: 30s
  timeout: 5s
  retries: 3
```

### Varnish

Varnish provides a management interface for health checks:

```yaml
services:
  varnish:
    image: varnish:stable
    healthcheck:
      # Backend health status
      test: ["CMD-SHELL", "varnishadm backend.list | grep -q healthy"]
      interval: 30s
      timeout: 10s
      retries: 3
```

---

## Search Engine Health Checks

### Elasticsearch

Elasticsearch provides comprehensive cluster health APIs:

```yaml
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    healthcheck:
      # Cluster health check (accepts yellow or green)
      test: ["CMD-SHELL", "curl -s http://localhost:9200/_cluster/health | grep -vq '\"status\":\"red\"'"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 60s
```

Requiring green status (all shards allocated):

```yaml
healthcheck:
  # Strict green status only
  test: ["CMD-SHELL", "curl -s http://localhost:9200/_cluster/health | grep -q '\"status\":\"green\"'"]
  interval: 30s
  timeout: 10s
  retries: 10
  start_period: 120s
```

With authentication (X-Pack security enabled):

```yaml
healthcheck:
  # Authenticated cluster health check
  test: ["CMD-SHELL", "curl -s -u elastic:${ELASTIC_PASSWORD} http://localhost:9200/_cluster/health | grep -vq '\"status\":\"red\"'"]
  interval: 30s
  timeout: 10s
  retries: 5
```

### OpenSearch

OpenSearch uses the same API patterns as Elasticsearch:

```yaml
services:
  opensearch:
    image: opensearchproject/opensearch:2.11.0
    healthcheck:
      # Cluster health check
      test: ["CMD-SHELL", "curl -s http://localhost:9200/_cluster/health | grep -vq '\"status\":\"red\"'"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 60s
```

### Meilisearch

Meilisearch provides a dedicated health endpoint:

```yaml
services:
  meilisearch:
    image: getmeili/meilisearch:v1.5
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:7700/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s
```

### Apache Solr

Solr provides admin ping endpoints:

```yaml
services:
  solr:
    image: solr:9
    healthcheck:
      # Admin ping
      test: ["CMD-SHELL", "curl -f http://localhost:8983/solr/admin/ping || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 5
```

---

## Custom Application Health Checks

### Node.js Applications

For Node.js applications, implement a health endpoint and use curl to check it:

```yaml
services:
  node-app:
    build: .
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s
```

If your image doesn't include curl, add a minimal health check script:

```javascript
// healthcheck.js
const http = require('http');

const options = {
  host: 'localhost',
  port: process.env.PORT || 3000,
  path: '/health',
  timeout: 5000
};

const request = http.request(options, (res) => {
  process.exit(res.statusCode === 200 ? 0 : 1);
});

request.on('error', () => process.exit(1));
request.on('timeout', () => process.exit(1));
request.end();
```

```yaml
healthcheck:
  test: ["CMD", "node", "/app/healthcheck.js"]
  interval: 30s
  timeout: 10s
  retries: 3
```

### Python/FastAPI Applications

FastAPI and Flask applications should expose a health endpoint:

```python
# FastAPI example
@app.get("/health")
async def health_check():
    return {"status": "healthy"}
```

```yaml
services:
  fastapi:
    build: .
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s
```

Using Python's built-in urllib for images without curl:

```python
# healthcheck.py
import urllib.request
import sys

try:
    response = urllib.request.urlopen('http://localhost:8000/health', timeout=5)
    sys.exit(0 if response.status == 200 else 1)
except:
    sys.exit(1)
```

```yaml
healthcheck:
  test: ["CMD", "python", "/app/healthcheck.py"]
  interval: 30s
  timeout: 10s
  retries: 3
```

### Go Applications

Go applications can include health checks directly without external dependencies:

```go
// main.go
http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
    w.WriteHeader(http.StatusOK)
    w.Write([]byte("OK"))
})
```

```yaml
services:
  go-app:
    build: .
    healthcheck:
      # Go apps often use wget in scratch/distroless images
      test: ["CMD-SHELL", "wget --spider -q http://localhost:8080/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
```

For minimal images without wget, build a health check binary:

```go
// cmd/healthcheck/main.go
package main

import (
    "net/http"
    "os"
)

func main() {
    resp, err := http.Get("http://localhost:8080/health")
    if err != nil || resp.StatusCode != 200 {
        os.Exit(1)
    }
    os.Exit(0)
}
```

```yaml
healthcheck:
  test: ["CMD", "/app/healthcheck"]
  interval: 30s
  timeout: 10s
  retries: 3
```

### Java/Spring Boot Applications

Spring Boot Actuator provides comprehensive health endpoints:

```yaml
# application.yml
management:
  endpoints:
    web:
      exposure:
        include: health
  endpoint:
    health:
      show-details: always
```

```yaml
services:
  spring-app:
    build: .
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:8080/actuator/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 120s  # Java apps need longer startup time
```

Using wget for Alpine-based images:

```yaml
healthcheck:
  test: ["CMD-SHELL", "wget --spider -q http://localhost:8080/actuator/health/liveness || exit 1"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 120s
```

---

## Advanced Patterns

### Multi-Check Health Verification

Sometimes you need to verify multiple conditions for a service to be considered healthy. This pattern checks multiple aspects in sequence:

```yaml
healthcheck:
  test: ["CMD-SHELL", "
    curl -f http://localhost:8080/health && 
    curl -f http://localhost:8080/ready &&
    test $(curl -s http://localhost:8080/metrics | grep process_uptime | cut -d' ' -f2) -gt 30
  "]
  interval: 30s
  timeout: 15s
  retries: 3
```

### Dependency-Aware Health Checks

A service might need its dependencies to be healthy before it can be considered healthy:

```yaml
healthcheck:
  # Check own health AND database connectivity
  test: ["CMD-SHELL", "
    curl -f http://localhost:8080/health &&
    pg_isready -h postgres -U app_user
  "]
  interval: 30s
  timeout: 15s
  retries: 3
```

### Liveness vs Readiness Separation

Some orchestrators (like Kubernetes) distinguish between liveness (is the app alive?) and readiness (can it serve traffic?). You can implement this pattern in Docker Compose using environment variables:

```yaml
services:
  app:
    environment:
      HEALTH_CHECK_TYPE: ${HEALTH_CHECK_TYPE:-liveness}
    healthcheck:
      test: ["CMD-SHELL", "
        if [ \"$HEALTH_CHECK_TYPE\" = \"readiness\" ]; then
          curl -f http://localhost:8080/ready;
        else
          curl -f http://localhost:8080/health;
        fi
      "]
```

### Graceful Degradation Checks

Check if core functionality works even if some features are degraded:

```yaml
healthcheck:
  # Service is healthy if core API works, even if cache is down
  test: ["CMD-SHELL", "
    STATUS=$(curl -s http://localhost:8080/health);
    echo $STATUS | grep -q '\"core\":\"healthy\"'
  "]
  interval: 30s
  timeout: 10s
  retries: 3
```

### Health Check with Metrics Collection

Combine health checking with metrics reporting:

```yaml
healthcheck:
  test: ["CMD-SHELL", "
    RESPONSE=$(curl -s -w '%{http_code}' http://localhost:8080/health);
    HTTP_CODE=$(echo $RESPONSE | tail -c 4);
    echo \"health_check_status $HTTP_CODE\" >> /tmp/metrics.prom;
    [ $HTTP_CODE -eq 200 ]
  "]
  interval: 30s
  timeout: 10s
  retries: 3
```

### File-Based Health Checks

Some services write health status to a file, which can be useful for batch processes:

```yaml
healthcheck:
  # Check for recent heartbeat file
  test: ["CMD-SHELL", "
    test -f /tmp/heartbeat &&
    test $(( $(date +%s) - $(stat -c %Y /tmp/heartbeat) )) -lt 60
  "]
  interval: 30s
  timeout: 5s
  retries: 3
```

### SSL/TLS Endpoint Checks

For HTTPS endpoints with self-signed certificates:

```yaml
healthcheck:
  # Skip certificate verification (development only)
  test: ["CMD-SHELL", "curl -kf https://localhost:443/health || exit 1"]
  interval: 30s
  timeout: 10s
  retries: 3
```

For production with proper certificates:

```yaml
healthcheck:
  # Verify certificate
  test: ["CMD-SHELL", "curl -f --cacert /etc/ssl/certs/ca.pem https://localhost:443/health"]
  interval: 30s
  timeout: 10s
  retries: 3
```

---

## Troubleshooting

### Common Issues and Solutions

**Health check always fails immediately:**

This usually indicates the container is crashing or the command isn't available. First, verify the container runs at all:

```bash
# Check container logs
docker-compose logs service_name

# Verify the health check command works manually
docker-compose exec service_name curl -f http://localhost:8080/health
```

**Health check times out:**

The service might be slow to respond. Increase the timeout or check for performance issues:

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "--max-time", "30", "http://localhost:8080/health"]
  timeout: 35s  # Slightly more than max-time
```

**"curl: not found" or "wget: not found":**

Many minimal images don't include these tools. Options include:

1. Use a different check method:
```yaml
test: ["CMD-SHELL", "nc -z localhost 8080"]
```

2. Use the application's built-in health check:
```yaml
test: ["CMD", "/app/healthcheck"]
```

3. Add curl to your Dockerfile:
```dockerfile
RUN apk add --no-cache curl
```

**Container marked unhealthy during startup:**

Increase the start_period to give the application more time to initialize:

```yaml
healthcheck:
  start_period: 120s  # Allow 2 minutes for startup
```

**Intermittent health check failures:**

If checks fail occasionally due to temporary load, increase retries:

```yaml
healthcheck:
  retries: 5  # More tolerance for transient failures
```

### Debugging Health Checks

View health check status and history:

```bash
# Check current health status
docker inspect --format='{{json .State.Health}}' container_name | jq

# View health check logs
docker inspect --format='{{range .State.Health.Log}}{{.Output}}{{end}}' container_name

# Watch health status in real-time
watch -n1 'docker inspect --format="{{.State.Health.Status}}" container_name'
```

Test health check command manually:

```bash
# Execute the exact health check command
docker exec container_name sh -c 'curl -f http://localhost:8080/health && echo "HEALTHY" || echo "UNHEALTHY"'
```

### Health Check Status Reference

Docker containers have four possible health states:

| Status | Meaning |
|--------|---------|
| `starting` | Container started, health checks not yet run or within start_period |
| `healthy` | Most recent health checks passed |
| `unhealthy` | Consecutive health check failures exceeded retry count |
| `none` | No health check configured |

### Best Practices Summary

1. **Always set start_period** for services that need initialization time, especially databases and Java applications.

2. **Use appropriate intervals** based on how quickly you need to detect failures. Critical services might use 10-15s intervals, while less critical services can use 30-60s.

3. **Keep checks lightweight** to avoid impacting service performance. A health check that takes 5 seconds to complete is too heavy.

4. **Check actual functionality** rather than just process existence. A process can be running but unable to serve requests.

5. **Use service-provided tools** when available, such as `pg_isready` for PostgreSQL or `redis-cli ping` for Redis, as they're designed for this purpose.

6. **Test health checks** during development to ensure they work correctly and have appropriate timeouts.

7. **Document health check behavior** so operators understand what's being verified and how to interpret failures.