# Common Service Configurations

This document provides production-ready Docker Compose configurations for commonly used services. Each configuration includes health checks, resource limits, proper volume management, and security considerations.

## Table of Contents

1. [Databases](#databases)
   - [PostgreSQL](#postgresql)
   - [MySQL / MariaDB](#mysql--mariadb)
   - [MongoDB](#mongodb)
   - [Redis](#redis)
2. [Web Servers & Reverse Proxies](#web-servers--reverse-proxies)
   - [Nginx](#nginx)
   - [Traefik](#traefik)
   - [Caddy](#caddy)
3. [Message Queues & Event Streaming](#message-queues--event-streaming)
   - [RabbitMQ](#rabbitmq)
   - [Apache Kafka](#apache-kafka)
   - [NATS](#nats)
4. [Search & Analytics](#search--analytics)
   - [Elasticsearch](#elasticsearch)
   - [OpenSearch](#opensearch)
   - [Meilisearch](#meilisearch)
5. [Monitoring & Observability](#monitoring--observability)
   - [Prometheus](#prometheus)
   - [Grafana](#grafana)
   - [Jaeger](#jaeger)
6. [Storage & Object Store](#storage--object-store)
   - [MinIO](#minio)
7. [Authentication & Identity](#authentication--identity)
   - [Keycloak](#keycloak)
8. [Development Tools](#development-tools)
   - [Adminer](#adminer)
   - [pgAdmin](#pgadmin)
   - [Redis Commander](#redis-commander)
   - [Mailhog](#mailhog)

---

## Databases

### PostgreSQL

PostgreSQL is a powerful, open-source relational database known for its reliability, feature robustness, and performance.

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: postgres
    restart: unless-stopped
    
    # Security: Run as postgres user
    user: postgres
    
    environment:
      # Required configuration
      POSTGRES_USER: ${POSTGRES_USER:-appuser}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?Database password required}
      POSTGRES_DB: ${POSTGRES_DB:-appdb}
      
      # Performance tuning
      POSTGRES_INITDB_ARGS: "--encoding=UTF8 --locale=C"
      
      # Data directory (useful for custom volume mounts)
      PGDATA: /var/lib/postgresql/data/pgdata
    
    volumes:
      # Persistent data storage
      - postgres_data:/var/lib/postgresql/data
      
      # Initialization scripts (run once on first start)
      - ./init-scripts:/docker-entrypoint-initdb.d:ro
      
      # Custom configuration (optional)
      # - ./postgresql.conf:/etc/postgresql/postgresql.conf:ro
    
    # Only expose port if external access is needed
    # ports:
    #   - "${POSTGRES_PORT:-5432}:5432"
    
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-appuser} -d ${POSTGRES_DB:-appdb}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s
    
    deploy:
      resources:
        limits:
          cpus: "2.0"
          memory: 2G
        reservations:
          cpus: "0.5"
          memory: 512M
    
    networks:
      - backend
    
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

volumes:
  postgres_data:
    driver: local

networks:
  backend:
    driver: bridge
```

**PostgreSQL with Replication (Primary-Replica):**

```yaml
services:
  postgres-primary:
    image: postgres:16-alpine
    container_name: postgres-primary
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-appuser}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?Password required}
      POSTGRES_DB: ${POSTGRES_DB:-appdb}
      POSTGRES_REPLICATION_USER: replicator
      POSTGRES_REPLICATION_PASSWORD: ${REPLICATION_PASSWORD:?Replication password required}
    volumes:
      - postgres_primary_data:/var/lib/postgresql/data
      - ./pg-primary-init.sh:/docker-entrypoint-initdb.d/init-replication.sh:ro
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-appuser}"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - database

  postgres-replica:
    image: postgres:16-alpine
    container_name: postgres-replica
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-appuser}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_PRIMARY_HOST: postgres-primary
      POSTGRES_REPLICATION_USER: replicator
      POSTGRES_REPLICATION_PASSWORD: ${REPLICATION_PASSWORD}
    volumes:
      - postgres_replica_data:/var/lib/postgresql/data
    depends_on:
      postgres-primary:
        condition: service_healthy
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-appuser}"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - database

volumes:
  postgres_primary_data:
  postgres_replica_data:

networks:
  database:
    driver: bridge
```

---

### MySQL / MariaDB

MySQL and MariaDB are popular relational databases. MariaDB is a community-developed fork of MySQL with additional features and optimizations.

```yaml
services:
  mysql:
    image: mysql:8.0
    # Alternative: image: mariadb:11
    container_name: mysql
    restart: unless-stopped
    
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD:?Root password required}
      MYSQL_DATABASE: ${MYSQL_DATABASE:-appdb}
      MYSQL_USER: ${MYSQL_USER:-appuser}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD:?User password required}
      
      # Character set configuration
      MYSQL_CHARSET: utf8mb4
      MYSQL_COLLATION: utf8mb4_unicode_ci
    
    volumes:
      # Persistent data storage
      - mysql_data:/var/lib/mysql
      
      # Initialization scripts
      - ./init-scripts:/docker-entrypoint-initdb.d:ro
      
      # Custom configuration
      - ./my.cnf:/etc/mysql/conf.d/custom.cnf:ro
    
    # Command to set default authentication plugin (MySQL 8.0+)
    command: >
      --default-authentication-plugin=mysql_native_password
      --character-set-server=utf8mb4
      --collation-server=utf8mb4_unicode_ci
    
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "-p${MYSQL_ROOT_PASSWORD}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s
    
    deploy:
      resources:
        limits:
          cpus: "2.0"
          memory: 2G
        reservations:
          cpus: "0.5"
          memory: 512M
    
    networks:
      - backend
    
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

volumes:
  mysql_data:
    driver: local

networks:
  backend:
    driver: bridge
```

---

### MongoDB

MongoDB is a document-oriented NoSQL database designed for high volume data storage and horizontal scaling.

```yaml
services:
  mongodb:
    image: mongo:7
    container_name: mongodb
    restart: unless-stopped
    
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_ROOT_USER:-admin}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_ROOT_PASSWORD:?Root password required}
      MONGO_INITDB_DATABASE: ${MONGO_DATABASE:-appdb}
    
    volumes:
      # Persistent data storage
      - mongodb_data:/data/db
      
      # Configuration data
      - mongodb_config:/data/configdb
      
      # Initialization scripts
      - ./mongo-init.js:/docker-entrypoint-initdb.d/init.js:ro
    
    # Optional: Custom configuration
    command: ["mongod", "--auth", "--bind_ip_all"]
    
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s
    
    deploy:
      resources:
        limits:
          cpus: "2.0"
          memory: 2G
        reservations:
          cpus: "0.5"
          memory: 512M
    
    networks:
      - backend
    
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

volumes:
  mongodb_data:
    driver: local
  mongodb_config:
    driver: local

networks:
  backend:
    driver: bridge
```

**MongoDB Replica Set Configuration:**

```yaml
services:
  mongo1:
    image: mongo:7
    container_name: mongo1
    command: ["mongod", "--replSet", "rs0", "--bind_ip_all", "--keyFile", "/etc/mongo-keyfile"]
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_ROOT_USER:-admin}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_ROOT_PASSWORD}
    volumes:
      - mongo1_data:/data/db
      - ./mongo-keyfile:/etc/mongo-keyfile:ro
    networks:
      - mongo-cluster

  mongo2:
    image: mongo:7
    container_name: mongo2
    command: ["mongod", "--replSet", "rs0", "--bind_ip_all", "--keyFile", "/etc/mongo-keyfile"]
    volumes:
      - mongo2_data:/data/db
      - ./mongo-keyfile:/etc/mongo-keyfile:ro
    depends_on:
      - mongo1
    networks:
      - mongo-cluster

  mongo3:
    image: mongo:7
    container_name: mongo3
    command: ["mongod", "--replSet", "rs0", "--bind_ip_all", "--keyFile", "/etc/mongo-keyfile"]
    volumes:
      - mongo3_data:/data/db
      - ./mongo-keyfile:/etc/mongo-keyfile:ro
    depends_on:
      - mongo1
    networks:
      - mongo-cluster

volumes:
  mongo1_data:
  mongo2_data:
  mongo3_data:

networks:
  mongo-cluster:
    driver: bridge
```

---

### Redis

Redis is an in-memory data structure store used as a database, cache, message broker, and queue.

```yaml
services:
  redis:
    image: redis:7-alpine
    container_name: redis
    restart: unless-stopped
    
    # Enable persistence and password authentication
    command: >
      redis-server
      --appendonly yes
      --appendfsync everysec
      --maxmemory ${REDIS_MAXMEMORY:-256mb}
      --maxmemory-policy allkeys-lru
      --requirepass ${REDIS_PASSWORD:?Redis password required}
    
    volumes:
      # Persistent data storage
      - redis_data:/data
      
      # Optional: Custom configuration file
      # - ./redis.conf:/usr/local/etc/redis/redis.conf:ro
    
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s
    
    deploy:
      resources:
        limits:
          cpus: "1.0"
          memory: 512M
        reservations:
          cpus: "0.25"
          memory: 128M
    
    networks:
      - backend
    
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

volumes:
  redis_data:
    driver: local

networks:
  backend:
    driver: bridge
```

**Redis Cluster Configuration (3 masters + 3 replicas):**

```yaml
services:
  redis-node-1:
    image: redis:7-alpine
    container_name: redis-node-1
    command: redis-server --cluster-enabled yes --cluster-config-file nodes.conf --cluster-node-timeout 5000 --appendonly yes
    volumes:
      - redis_node_1_data:/data
    networks:
      - redis-cluster
    ports:
      - "7001:6379"

  redis-node-2:
    image: redis:7-alpine
    container_name: redis-node-2
    command: redis-server --cluster-enabled yes --cluster-config-file nodes.conf --cluster-node-timeout 5000 --appendonly yes
    volumes:
      - redis_node_2_data:/data
    networks:
      - redis-cluster
    ports:
      - "7002:6379"

  # Add more nodes (redis-node-3 through redis-node-6) following the same pattern

volumes:
  redis_node_1_data:
  redis_node_2_data:

networks:
  redis-cluster:
    driver: bridge
```

---

## Web Servers & Reverse Proxies

### Nginx

Nginx is a high-performance web server and reverse proxy.

```yaml
services:
  nginx:
    image: nginx:1.25-alpine
    container_name: nginx
    restart: unless-stopped
    
    ports:
      - "80:80"
      - "443:443"
    
    volumes:
      # Configuration
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      
      # SSL certificates
      - ./certs:/etc/nginx/certs:ro
      
      # Static files
      - ./static:/usr/share/nginx/html:ro
      
      # Logs (optional - for external log processing)
      - nginx_logs:/var/log/nginx
    
    healthcheck:
      test: ["CMD", "nginx", "-t"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
    
    deploy:
      resources:
        limits:
          cpus: "1.0"
          memory: 256M
        reservations:
          cpus: "0.1"
          memory: 64M
    
    depends_on:
      - app
    
    networks:
      - frontend
      - backend
    
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "5"

volumes:
  nginx_logs:

networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge
```

**Example nginx.conf for reverse proxy:**

```nginx
# nginx/nginx.conf
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    # Logging format
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log warn;

    # Performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/xml;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

    # Upstream backend
    upstream backend {
        server app:8000;
        keepalive 32;
    }

    server {
        listen 80;
        server_name _;

        # Redirect to HTTPS
        location / {
            return 301 https://$host$request_uri;
        }
    }

    server {
        listen 443 ssl http2;
        server_name _;

        ssl_certificate /etc/nginx/certs/cert.pem;
        ssl_certificate_key /etc/nginx/certs/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;

        location / {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }
}
```

---

### Traefik

Traefik is a modern reverse proxy and load balancer designed for microservices with automatic service discovery.

```yaml
services:
  traefik:
    image: traefik:v3.0
    container_name: traefik
    restart: unless-stopped
    
    command:
      # API and Dashboard
      - "--api.dashboard=true"
      - "--api.insecure=false"
      
      # Docker provider
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--providers.docker.network=proxy"
      
      # Entrypoints
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      
      # HTTP to HTTPS redirect
      - "--entrypoints.web.http.redirections.entrypoint.to=websecure"
      - "--entrypoints.web.http.redirections.entrypoint.scheme=https"
      
      # Let's Encrypt
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge=true"
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web"
      - "--certificatesresolvers.letsencrypt.acme.email=${ACME_EMAIL}"
      - "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json"
      
      # Logging
      - "--log.level=INFO"
      - "--accesslog=true"
    
    ports:
      - "80:80"
      - "443:443"
    
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - traefik_letsencrypt:/letsencrypt
    
    labels:
      # Dashboard routing
      - "traefik.enable=true"
      - "traefik.http.routers.dashboard.rule=Host(`traefik.${DOMAIN}`)"
      - "traefik.http.routers.dashboard.service=api@internal"
      - "traefik.http.routers.dashboard.middlewares=auth"
      - "traefik.http.middlewares.auth.basicauth.users=${TRAEFIK_DASHBOARD_AUTH}"
    
    healthcheck:
      test: ["CMD", "traefik", "healthcheck"]
      interval: 30s
      timeout: 10s
      retries: 3
    
    networks:
      - proxy

  # Example service with Traefik labels
  app:
    image: myapp:latest
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.app.rule=Host(`app.${DOMAIN}`)"
      - "traefik.http.routers.app.entrypoints=websecure"
      - "traefik.http.routers.app.tls.certresolver=letsencrypt"
      - "traefik.http.services.app.loadbalancer.server.port=8000"
    networks:
      - proxy
      - backend

volumes:
  traefik_letsencrypt:

networks:
  proxy:
    driver: bridge
  backend:
    driver: bridge
```

---

### Caddy

Caddy is a modern web server with automatic HTTPS.

```yaml
services:
  caddy:
    image: caddy:2-alpine
    container_name: caddy
    restart: unless-stopped
    
    ports:
      - "80:80"
      - "443:443"
      - "443:443/udp"  # HTTP/3
    
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
      - ./static:/srv:ro
    
    environment:
      DOMAIN: ${DOMAIN:-localhost}
      EMAIL: ${ACME_EMAIL:-admin@example.com}
    
    healthcheck:
      test: ["CMD", "caddy", "validate", "--config", "/etc/caddy/Caddyfile"]
      interval: 30s
      timeout: 10s
      retries: 3
    
    networks:
      - frontend
      - backend

volumes:
  caddy_data:
  caddy_config:

networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge
```

**Example Caddyfile:**

```caddyfile
{
    email {$EMAIL}
}

{$DOMAIN} {
    reverse_proxy app:8000

    encode gzip

    log {
        output file /var/log/caddy/access.log
    }
}

api.{$DOMAIN} {
    reverse_proxy api:3000

    rate_limit {
        zone api {
            key {remote_host}
            events 100
            window 1m
        }
    }
}
```

---

## Message Queues & Event Streaming

### RabbitMQ

RabbitMQ is a reliable message broker supporting multiple messaging protocols.

```yaml
services:
  rabbitmq:
    image: rabbitmq:3.13-management-alpine
    container_name: rabbitmq
    restart: unless-stopped
    
    hostname: rabbitmq  # Important for clustering
    
    environment:
      RABBITMQ_DEFAULT_USER: ${RABBITMQ_USER:-admin}
      RABBITMQ_DEFAULT_PASS: ${RABBITMQ_PASSWORD:?RabbitMQ password required}
      RABBITMQ_DEFAULT_VHOST: ${RABBITMQ_VHOST:-/}
      
      # Erlang cookie for clustering
      RABBITMQ_ERLANG_COOKIE: ${RABBITMQ_ERLANG_COOKIE:-secret_cookie}
      
      # Memory and disk limits
      RABBITMQ_VM_MEMORY_HIGH_WATERMARK: 0.8
    
    volumes:
      # Persistent data
      - rabbitmq_data:/var/lib/rabbitmq
      
      # Custom configuration
      # - ./rabbitmq.conf:/etc/rabbitmq/rabbitmq.conf:ro
      # - ./definitions.json:/etc/rabbitmq/definitions.json:ro
    
    ports:
      # Only expose management UI if needed
      - "${RABBITMQ_MGMT_PORT:-15672}:15672"
      # AMQP port - typically not exposed externally
      # - "${RABBITMQ_PORT:-5672}:5672"
    
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "-q", "ping"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 60s
    
    deploy:
      resources:
        limits:
          cpus: "2.0"
          memory: 1G
        reservations:
          cpus: "0.5"
          memory: 256M
    
    networks:
      - backend
    
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

volumes:
  rabbitmq_data:
    driver: local

networks:
  backend:
    driver: bridge
```

---

### Apache Kafka

Kafka is a distributed event streaming platform for high-throughput, fault-tolerant messaging.

```yaml
services:
  zookeeper:
    image: confluentinc/cp-zookeeper:7.5.0
    container_name: zookeeper
    restart: unless-stopped
    
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000
      ZOOKEEPER_INIT_LIMIT: 5
      ZOOKEEPER_SYNC_LIMIT: 2
    
    volumes:
      - zookeeper_data:/var/lib/zookeeper/data
      - zookeeper_log:/var/lib/zookeeper/log
    
    healthcheck:
      test: ["CMD", "nc", "-z", "localhost", "2181"]
      interval: 10s
      timeout: 5s
      retries: 5
    
    networks:
      - kafka

  kafka:
    image: confluentinc/cp-kafka:7.5.0
    container_name: kafka
    restart: unless-stopped
    
    depends_on:
      zookeeper:
        condition: service_healthy
    
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:9092,PLAINTEXT_HOST://localhost:29092
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT:PLAINTEXT,PLAINTEXT_HOST:PLAINTEXT
      KAFKA_INTER_BROKER_LISTENER_NAME: PLAINTEXT
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_TRANSACTION_STATE_LOG_MIN_ISR: 1
      KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR: 1
      KAFKA_AUTO_CREATE_TOPICS_ENABLE: "false"
      KAFKA_LOG_RETENTION_HOURS: 168
      KAFKA_LOG_RETENTION_BYTES: 1073741824
    
    volumes:
      - kafka_data:/var/lib/kafka/data
    
    ports:
      - "29092:29092"  # External access
    
    healthcheck:
      test: ["CMD", "kafka-topics", "--bootstrap-server", "localhost:9092", "--list"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 60s
    
    deploy:
      resources:
        limits:
          cpus: "2.0"
          memory: 2G
        reservations:
          cpus: "0.5"
          memory: 512M
    
    networks:
      - kafka

  # Optional: Kafka UI
  kafka-ui:
    image: provectuslabs/kafka-ui:latest
    container_name: kafka-ui
    restart: unless-stopped
    
    depends_on:
      - kafka
    
    environment:
      KAFKA_CLUSTERS_0_NAME: local
      KAFKA_CLUSTERS_0_BOOTSTRAPSERVERS: kafka:9092
      KAFKA_CLUSTERS_0_ZOOKEEPER: zookeeper:2181
    
    ports:
      - "8080:8080"
    
    networks:
      - kafka

volumes:
  zookeeper_data:
  zookeeper_log:
  kafka_data:

networks:
  kafka:
    driver: bridge
```

---

### NATS

NATS is a simple, secure, and high-performance messaging system.

```yaml
services:
  nats:
    image: nats:2.10-alpine
    container_name: nats
    restart: unless-stopped
    
    command:
      - "--config=/etc/nats/nats.conf"
      - "--jetstream"
      - "--store_dir=/data"
    
    volumes:
      - nats_data:/data
      - ./nats.conf:/etc/nats/nats.conf:ro
    
    ports:
      - "4222:4222"   # Client connections
      - "8222:8222"   # HTTP monitoring
      - "6222:6222"   # Cluster routing
    
    healthcheck:
      test: ["CMD", "nats-server", "--help"]
      interval: 30s
      timeout: 10s
      retries: 3
    
    deploy:
      resources:
        limits:
          cpus: "1.0"
          memory: 512M
    
    networks:
      - backend

volumes:
  nats_data:

networks:
  backend:
    driver: bridge
```

---

## Search & Analytics

### Elasticsearch

Elasticsearch is a distributed search and analytics engine.

```yaml
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    container_name: elasticsearch
    restart: unless-stopped
    
    environment:
      # Cluster configuration
      - node.name=es01
      - cluster.name=docker-cluster
      - discovery.type=single-node
      
      # Security (disable for development, enable for production)
      - xpack.security.enabled=false
      # - ELASTIC_PASSWORD=${ELASTIC_PASSWORD}
      
      # Memory settings
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
      
      # Bootstrap checks
      - bootstrap.memory_lock=true
    
    ulimits:
      memlock:
        soft: -1
        hard: -1
      nofile:
        soft: 65536
        hard: 65536
    
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data
    
    ports:
      - "${ES_PORT:-9200}:9200"
    
    healthcheck:
      test: ["CMD-SHELL", "curl -s http://localhost:9200/_cluster/health | grep -vq '\"status\":\"red\"'"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 60s
    
    deploy:
      resources:
        limits:
          cpus: "2.0"
          memory: 2G
        reservations:
          cpus: "0.5"
          memory: 1G
    
    networks:
      - backend

volumes:
  elasticsearch_data:
    driver: local

networks:
  backend:
    driver: bridge
```

---

### OpenSearch

OpenSearch is a community-driven, open-source fork of Elasticsearch.

```yaml
services:
  opensearch:
    image: opensearchproject/opensearch:2.11.0
    container_name: opensearch
    restart: unless-stopped
    
    environment:
      - cluster.name=opensearch-cluster
      - node.name=opensearch-node1
      - discovery.type=single-node
      - bootstrap.memory_lock=true
      - "OPENSEARCH_JAVA_OPTS=-Xms512m -Xmx512m"
      - "DISABLE_INSTALL_DEMO_CONFIG=true"
      - "DISABLE_SECURITY_PLUGIN=true"  # Disable for development
    
    ulimits:
      memlock:
        soft: -1
        hard: -1
      nofile:
        soft: 65536
        hard: 65536
    
    volumes:
      - opensearch_data:/usr/share/opensearch/data
    
    ports:
      - "9200:9200"
      - "9600:9600"
    
    healthcheck:
      test: ["CMD-SHELL", "curl -s http://localhost:9200/_cluster/health | grep -vq '\"status\":\"red\"'"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 60s
    
    networks:
      - backend

  opensearch-dashboards:
    image: opensearchproject/opensearch-dashboards:2.11.0
    container_name: opensearch-dashboards
    restart: unless-stopped
    
    environment:
      - 'OPENSEARCH_HOSTS=["http://opensearch:9200"]'
      - "DISABLE_SECURITY_DASHBOARDS_PLUGIN=true"
    
    ports:
      - "5601:5601"
    
    depends_on:
      - opensearch
    
    networks:
      - backend

volumes:
  opensearch_data:

networks:
  backend:
    driver: bridge
```

---

### Meilisearch

Meilisearch is a fast, typo-tolerant search engine optimized for end-user experience.

```yaml
services:
  meilisearch:
    image: getmeili/meilisearch:v1.5
    container_name: meilisearch
    restart: unless-stopped
    
    environment:
      MEILI_MASTER_KEY: ${MEILI_MASTER_KEY:?Master key required for production}
      MEILI_ENV: ${MEILI_ENV:-development}
      MEILI_NO_ANALYTICS: "true"
    
    volumes:
      - meilisearch_data:/meili_data
    
    ports:
      - "${MEILI_PORT:-7700}:7700"
    
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:7700/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    
    deploy:
      resources:
        limits:
          cpus: "1.0"
          memory: 1G
    
    networks:
      - backend

volumes:
  meilisearch_data:

networks:
  backend:
    driver: bridge
```

---

## Monitoring & Observability

### Prometheus

Prometheus is a monitoring and alerting toolkit designed for reliability.

```yaml
services:
  prometheus:
    image: prom/prometheus:v2.48.0
    container_name: prometheus
    restart: unless-stopped
    
    command:
      - "--config.file=/etc/prometheus/prometheus.yml"
      - "--storage.tsdb.path=/prometheus"
      - "--storage.tsdb.retention.time=15d"
      - "--web.enable-lifecycle"
      - "--web.enable-admin-api"
    
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - ./prometheus/rules:/etc/prometheus/rules:ro
      - prometheus_data:/prometheus
    
    ports:
      - "${PROMETHEUS_PORT:-9090}:9090"
    
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:9090/-/healthy"]
      interval: 30s
      timeout: 10s
      retries: 3
    
    deploy:
      resources:
        limits:
          cpus: "1.0"
          memory: 1G
        reservations:
          cpus: "0.25"
          memory: 256M
    
    networks:
      - monitoring

volumes:
  prometheus_data:

networks:
  monitoring:
    driver: bridge
```

**Example prometheus.yml:**

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

rule_files:
  - "/etc/prometheus/rules/*.yml"

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'docker'
    static_configs:
      - targets: ['host.docker.internal:9323']

  - job_name: 'app'
    static_configs:
      - targets: ['app:8000']
    metrics_path: /metrics
```

---

### Grafana

Grafana is an analytics and visualization platform.

```yaml
services:
  grafana:
    image: grafana/grafana:10.2.0
    container_name: grafana
    restart: unless-stopped
    
    environment:
      GF_SECURITY_ADMIN_USER: ${GRAFANA_ADMIN_USER:-admin}
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_ADMIN_PASSWORD:?Admin password required}
      GF_USERS_ALLOW_SIGN_UP: "false"
      GF_SERVER_ROOT_URL: ${GRAFANA_ROOT_URL:-http://localhost:3000}
      
      # Database (optional - for HA setups)
      # GF_DATABASE_TYPE: postgres
      # GF_DATABASE_HOST: postgres:5432
      # GF_DATABASE_NAME: grafana
      # GF_DATABASE_USER: grafana
      # GF_DATABASE_PASSWORD: ${GRAFANA_DB_PASSWORD}
    
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning:ro
      - ./grafana/dashboards:/var/lib/grafana/dashboards:ro
    
    ports:
      - "${GRAFANA_PORT:-3000}:3000"
    
    healthcheck:
      test: ["CMD-SHELL", "wget --spider -q http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    
    depends_on:
      - prometheus
    
    deploy:
      resources:
        limits:
          cpus: "1.0"
          memory: 512M
    
    networks:
      - monitoring

volumes:
  grafana_data:

networks:
  monitoring:
    driver: bridge
```

---

### Jaeger

Jaeger is a distributed tracing system for monitoring and troubleshooting microservices.

```yaml
services:
  jaeger:
    image: jaegertracing/all-in-one:1.52
    container_name: jaeger
    restart: unless-stopped
    
    environment:
      COLLECTOR_OTLP_ENABLED: "true"
      SPAN_STORAGE_TYPE: badger
      BADGER_EPHEMERAL: "false"
      BADGER_DIRECTORY_VALUE: /badger/data
      BADGER_DIRECTORY_KEY: /badger/key
    
    volumes:
      - jaeger_data:/badger
    
    ports:
      - "16686:16686"  # UI
      - "4317:4317"    # OTLP gRPC
      - "4318:4318"    # OTLP HTTP
      - "14268:14268"  # Jaeger thrift
      - "6831:6831/udp" # Jaeger compact thrift
    
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:16686"]
      interval: 30s
      timeout: 10s
      retries: 3
    
    deploy:
      resources:
        limits:
          cpus: "1.0"
          memory: 512M
    
    networks:
      - monitoring

volumes:
  jaeger_data:

networks:
  monitoring:
    driver: bridge
```

---

## Storage & Object Store

### MinIO

MinIO is a high-performance, S3-compatible object storage.

```yaml
services:
  minio:
    image: minio/minio:latest
    container_name: minio
    restart: unless-stopped
    
    command: server /data --console-address ":9001"
    
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER:-minioadmin}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD:?MinIO password required}
      MINIO_BROWSER_REDIRECT_URL: ${MINIO_CONSOLE_URL:-http://localhost:9001}
    
    volumes:
      - minio_data:/data
    
    ports:
      - "${MINIO_API_PORT:-9000}:9000"    # API
      - "${MINIO_CONSOLE_PORT:-9001}:9001" # Console
    
    healthcheck:
      test: ["CMD", "mc", "ready", "local"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s
    
    deploy:
      resources:
        limits:
          cpus: "2.0"
          memory: 1G
    
    networks:
      - backend

volumes:
  minio_data:

networks:
  backend:
    driver: bridge
```

---

## Authentication & Identity

### Keycloak

Keycloak is an open-source identity and access management solution.

```yaml
services:
  keycloak:
    image: quay.io/keycloak/keycloak:23.0
    container_name: keycloak
    restart: unless-stopped
    
    command: start-dev  # Use "start" for production
    
    environment:
      KEYCLOAK_ADMIN: ${KEYCLOAK_ADMIN:-admin}
      KEYCLOAK_ADMIN_PASSWORD: ${KEYCLOAK_ADMIN_PASSWORD:?Admin password required}
      
      # Database connection (required for production)
      KC_DB: postgres
      KC_DB_URL: jdbc:postgresql://postgres:5432/keycloak
      KC_DB_USERNAME: ${KC_DB_USER:-keycloak}
      KC_DB_PASSWORD: ${KC_DB_PASSWORD:?Database password required}
      
      # Hostname settings
      KC_HOSTNAME: ${KC_HOSTNAME:-localhost}
      KC_HOSTNAME_STRICT: "false"
      KC_HTTP_ENABLED: "true"
      
      # Proxy settings (for reverse proxy)
      KC_PROXY: edge
    
    ports:
      - "${KEYCLOAK_PORT:-8080}:8080"
    
    depends_on:
      postgres:
        condition: service_healthy
    
    healthcheck:
      test: ["CMD-SHELL", "exec 3<>/dev/tcp/127.0.0.1/8080;echo -e 'GET /health/ready HTTP/1.1\r\nhost: http://localhost\r\nConnection: close\r\n\r\n' >&3;if [ $? -eq 0 ]; then echo 'Healthcheck Successful';exit 0;else echo 'Healthcheck Failed';exit 1;fi;"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 60s
    
    deploy:
      resources:
        limits:
          cpus: "2.0"
          memory: 1G
    
    networks:
      - frontend
      - backend

networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge
```

---

## Development Tools

### Adminer

Adminer is a lightweight database management tool supporting multiple databases.

```yaml
services:
  adminer:
    image: adminer:latest
    container_name: adminer
    restart: unless-stopped
    
    environment:
      ADMINER_DEFAULT_SERVER: postgres  # Default database server
      ADMINER_DESIGN: dracula           # Theme
    
    ports:
      - "${ADMINER_PORT:-8080}:8080"
    
    profiles:
      - dev  # Only start with: docker-compose --profile dev up
    
    networks:
      - backend

networks:
  backend:
    driver: bridge
```

---

### pgAdmin

pgAdmin is a feature-rich PostgreSQL administration tool.

```yaml
services:
  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: pgadmin
    restart: unless-stopped
    
    environment:
      PGADMIN_DEFAULT_EMAIL: ${PGADMIN_EMAIL:-admin@example.com}
      PGADMIN_DEFAULT_PASSWORD: ${PGADMIN_PASSWORD:?pgAdmin password required}
      PGADMIN_CONFIG_SERVER_MODE: "False"
      PGADMIN_CONFIG_MASTER_PASSWORD_REQUIRED: "False"
    
    volumes:
      - pgadmin_data:/var/lib/pgadmin
      - ./pgadmin/servers.json:/pgadmin4/servers.json:ro
    
    ports:
      - "${PGADMIN_PORT:-5050}:80"
    
    profiles:
      - dev
    
    depends_on:
      - postgres
    
    networks:
      - backend

volumes:
  pgadmin_data:

networks:
  backend:
    driver: bridge
```

---

### Redis Commander

Redis Commander is a web-based Redis management tool.

```yaml
services:
  redis-commander:
    image: rediscommander/redis-commander:latest
    container_name: redis-commander
    restart: unless-stopped
    
    environment:
      REDIS_HOSTS: local:redis:6379:0:${REDIS_PASSWORD}
      HTTP_USER: ${REDIS_COMMANDER_USER:-admin}
      HTTP_PASSWORD: ${REDIS_COMMANDER_PASSWORD:-admin}
    
    ports:
      - "${REDIS_COMMANDER_PORT:-8081}:8081"
    
    profiles:
      - dev
    
    depends_on:
      - redis
    
    networks:
      - backend

networks:
  backend:
    driver: bridge
```

---

### Mailhog

Mailhog is a fake SMTP server for development email testing.

```yaml
services:
  mailhog:
    image: mailhog/mailhog:latest
    container_name: mailhog
    restart: unless-stopped
    
    ports:
      - "${MAILHOG_SMTP_PORT:-1025}:1025"  # SMTP
      - "${MAILHOG_WEB_PORT:-8025}:8025"   # Web UI
    
    profiles:
      - dev
    
    networks:
      - backend

networks:
  backend:
    driver: bridge
```

---

## Quick Reference Table

| Service | Image | Default Ports | Health Check Command |
|---------|-------|---------------|---------------------|
| PostgreSQL | `postgres:16-alpine` | 5432 | `pg_isready -U user -d db` |
| MySQL | `mysql:8.0` | 3306 | `mysqladmin ping -h localhost` |
| MongoDB | `mongo:7` | 27017 | `mongosh --eval "db.adminCommand('ping')"` |
| Redis | `redis:7-alpine` | 6379 | `redis-cli ping` |
| Nginx | `nginx:1.25-alpine` | 80, 443 | `nginx -t` |
| Traefik | `traefik:v3.0` | 80, 443 | `traefik healthcheck` |
| RabbitMQ | `rabbitmq:3.13-management-alpine` | 5672, 15672 | `rabbitmq-diagnostics ping` |
| Kafka | `confluentinc/cp-kafka:7.5.0` | 9092 | `kafka-topics --list` |
| Elasticsearch | `elasticsearch:8.11.0` | 9200 | `curl localhost:9200/_cluster/health` |
| Prometheus | `prom/prometheus:v2.48.0` | 9090 | `wget localhost:9090/-/healthy` |
| Grafana | `grafana/grafana:10.2.0` | 3000 | `wget localhost:3000/api/health` |
| MinIO | `minio/minio:latest` | 9000, 9001 | `mc ready local` |
| Keycloak | `keycloak:23.0` | 8080 | HTTP check on `/health/ready` |