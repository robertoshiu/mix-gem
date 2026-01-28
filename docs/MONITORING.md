# Monitoring and Observability Guide

Comprehensive monitoring and observability for Mix-GEM production stack using Prometheus and Grafana.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Metrics Collection](#metrics-collection)
- [Grafana Dashboards](#grafana-dashboards)
- [Alerting](#alerting)
- [Performance Tuning](#performance-tuning)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

## Overview

The monitoring stack provides:

- **Real-time metrics**: System, application, and business metrics
- **Historical data**: 30 days of metrics retention
- **Visualization**: Pre-configured Grafana dashboards
- **Alerting**: Prometheus alert rules and Grafana notifications
- **Exporters**: Node, PostgreSQL, Redis, cAdvisor metrics

## Architecture

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                        Grafana UI                           │
│                    (Port 3001)                              │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ Query
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                      Prometheus                             │
│                    (Port 9090)                              │
│  • Metrics Storage (30 days)                               │
│  • Query Engine                                            │
│  • Alert Manager                                           │
└─────────┬───────────────────────────────────────────────────┘
          │
          │ Scrape (every 15s)
          │
┌─────────┴───────────────────────────────────────────────────┐
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │Node Exporter│  │PG Exporter  │  │Redis Export.│       │
│  │  (9100)     │  │  (9187)     │  │  (9121)     │       │
│  └─────────────┘  └─────────────┘  └─────────────┘       │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │  cAdvisor   │  │Scavenger API│  │  RAG Engine │       │
│  │  (8080)     │  │  (8000)     │  │  (8001)     │       │
│  └─────────────┘  └─────────────┘  └─────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

### Network

All monitoring services communicate via the `monitoring_network` Docker network.

## Metrics Collection

### 1. Node Exporter (System Metrics)

Collects host-level metrics:

- **CPU**: Usage, load average, context switches
- **Memory**: Available, used, swap, cache
- **Disk**: Usage, I/O, latency
- **Network**: Bandwidth, packets, errors
- **Filesystem**: Mountpoints, inodes

**Port**: 9100
**Endpoint**: `http://localhost:9100/metrics`

### 2. PostgreSQL Exporter

Database metrics:

- **Connections**: Active, idle, waiting
- **Query Performance**: Execution time, slow queries
- **Database Size**: Tables, indexes, bloat
- **Replication**: Lag, streaming status
- **Locks**: Deadlocks, blocking queries
- **Transactions**: Commits, rollbacks, conflicts

**Port**: 9187
**Endpoint**: `http://localhost:9187/metrics`

Key metrics:
```promql
# Connection count
pg_stat_database_numbackends

# Transaction rate
rate(pg_stat_database_xact_commit[5m])

# Database size
pg_database_size_bytes
```

### 3. Redis Exporter

Cache and queue metrics:

- **Memory**: Used, peak, fragmentation
- **Keys**: Total, expired, evicted
- **Commands**: Processed, latency
- **Connections**: Clients, blocked
- **Persistence**: RDB/AOF status
- **Replication**: Connected slaves, lag

**Port**: 9121
**Endpoint**: `http://localhost:9121/metrics`

Key metrics:
```promql
# Memory usage
redis_memory_used_bytes

# Hit rate
rate(redis_keyspace_hits_total[5m]) /
  (rate(redis_keyspace_hits_total[5m]) + rate(redis_keyspace_misses_total[5m]))

# Connected clients
redis_connected_clients
```

### 4. cAdvisor (Container Metrics)

Docker container resource usage:

- **CPU**: Usage per container
- **Memory**: Limit, usage, cache
- **Network**: RX/TX bytes and packets
- **Disk**: Read/write bytes and ops
- **Filesystem**: Usage per container

**Port**: 8080
**Endpoint**: `http://localhost:8080/metrics`

Key metrics:
```promql
# Container CPU usage
rate(container_cpu_usage_seconds_total[5m])

# Container memory usage
container_memory_usage_bytes

# Container network bandwidth
rate(container_network_transmit_bytes_total[5m])
```

### 5. Application Metrics (Custom)

Scavenger API and RAG Engine expose custom metrics:

**Scavenger API**:
- Request rate and latency
- SECS/GEM message processing time
- Queue depth
- Error rates

**RAG Engine**:
- Query latency
- Embedding generation time
- LLM API latency
- Document processing rate

## Grafana Dashboards

Access Grafana at `http://localhost:3001`

Default credentials:
- **Username**: admin
- **Password**: (set in `GRAFANA_ADMIN_PASSWORD`)

### Pre-configured Dashboards

#### 1. System Overview

**Metrics**:
- CPU usage (per core and total)
- Memory usage and swap
- Disk I/O and latency
- Network bandwidth
- System load average

**Use Cases**:
- Quick health check
- Resource capacity planning
- Identify bottlenecks

#### 2. PostgreSQL Dashboard

**Panels**:
- Active connections vs. max
- Query execution time (p50, p95, p99)
- Transaction rate (commits/rollbacks)
- Database size growth
- Table and index statistics
- Lock contention
- Cache hit ratio

**Queries**:
```promql
# Cache hit ratio
rate(pg_stat_database_blks_hit[5m]) /
  (rate(pg_stat_database_blks_hit[5m]) + rate(pg_stat_database_blks_read[5m]))

# Active connections
pg_stat_database_numbackends{datname="mixgem"}

# Slow queries
pg_stat_statements_mean_exec_time_seconds > 0.1
```

#### 3. Redis Dashboard

**Panels**:
- Memory usage and fragmentation
- Key count and evictions
- Commands per second
- Hit/miss ratio
- Connected clients
- Persistence status

**Queries**:
```promql
# Memory usage percentage
redis_memory_used_bytes / redis_memory_max_bytes * 100

# Command rate
rate(redis_commands_processed_total[5m])

# Cache efficiency
redis_keyspace_hits_total / (redis_keyspace_hits_total + redis_keyspace_misses_total)
```

#### 4. Docker Containers Dashboard

**Panels**:
- Container CPU usage (all containers)
- Container memory usage
- Container network I/O
- Container disk I/O
- Container restart count

**Queries**:
```promql
# Container CPU usage
sum(rate(container_cpu_usage_seconds_total{name=~".+"}[5m])) by (name) * 100

# Container memory usage
container_memory_usage_bytes{name=~".+"}

# Container restarts
changes(container_start_time_seconds{name=~".+"}[1h])
```

#### 5. Application Metrics Dashboard

**Scavenger API**:
- Request rate (RPS)
- Request latency (p50, p95, p99)
- Error rate (4xx, 5xx)
- Message processing time
- Queue depth

**RAG Engine**:
- Query latency
- Embedding generation time
- LLM API calls and latency
- Document indexing rate
- Search result relevance

### Creating Custom Dashboards

1. **Navigate to Grafana UI**
2. **Click "+" → "Dashboard"**
3. **Add Panel**
4. **Select Prometheus data source**
5. **Enter PromQL query**
6. **Configure visualization**
7. **Save dashboard**

Example panel (PostgreSQL connections):

```json
{
  "title": "PostgreSQL Connections",
  "targets": [
    {
      "expr": "pg_stat_database_numbackends{datname=\"mixgem\"}",
      "legendFormat": "{{datname}}"
    }
  ],
  "type": "graph"
}
```

## Alerting

### Prometheus Alert Rules

Create alert rules in `monitoring/prometheus/alerts.yml`:

```yaml
groups:
  - name: infrastructure
    interval: 30s
    rules:
      # High CPU usage
      - alert: HighCPUUsage
        expr: 100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage detected"
          description: "CPU usage is above 80% for 5 minutes"

      # High memory usage
      - alert: HighMemoryUsage
        expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100 > 90
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High memory usage detected"
          description: "Memory usage is above 90%"

      # Disk space low
      - alert: DiskSpaceLow
        expr: (node_filesystem_avail_bytes / node_filesystem_size_bytes) * 100 < 10
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Disk space is low"
          description: "Less than 10% disk space available"

  - name: database
    interval: 30s
    rules:
      # PostgreSQL down
      - alert: PostgreSQLDown
        expr: up{job="postgres-exporter"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "PostgreSQL is down"
          description: "PostgreSQL database is not responding"

      # High connection count
      - alert: PostgreSQLHighConnections
        expr: pg_stat_database_numbackends > 180
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "PostgreSQL connection count is high"
          description: "More than 180 connections active"

      # Low cache hit ratio
      - alert: PostgreSQLLowCacheHitRatio
        expr: rate(pg_stat_database_blks_hit[5m]) / (rate(pg_stat_database_blks_hit[5m]) + rate(pg_stat_database_blks_read[5m])) < 0.9
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "PostgreSQL cache hit ratio is low"
          description: "Cache hit ratio below 90%"

  - name: redis
    interval: 30s
    rules:
      # Redis down
      - alert: RedisDown
        expr: up{job="redis-exporter"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Redis is down"
          description: "Redis cache is not responding"

      # High memory usage
      - alert: RedisHighMemoryUsage
        expr: redis_memory_used_bytes / redis_memory_max_bytes > 0.9
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Redis memory usage is high"
          description: "Redis is using more than 90% of allocated memory"
```

### Grafana Alerts

1. **Navigate to alert panel in dashboard**
2. **Click "Alert" tab**
3. **Configure conditions**
4. **Set notification channel**
5. **Save**

**Example**: Alert when PostgreSQL connections > 180

```
WHEN max() OF query(A, 5m, now) IS ABOVE 180
```

### Notification Channels

Configure in Grafana UI: **Alerting → Notification channels**

Supported channels:
- **Email**: SMTP configuration
- **Slack**: Webhook URL
- **PagerDuty**: Integration key
- **Webhook**: Custom HTTP endpoint
- **Telegram**: Bot token and chat ID

## Performance Tuning

### Prometheus Optimization

**Retention tuning**:

```yaml
# In docker-compose.prod.yml
command:
  - '--storage.tsdb.retention.time=30d'  # Keep 30 days
  - '--storage.tsdb.retention.size=10GB'  # Max 10GB
```

**Scrape interval**:

```yaml
# In prometheus.yml
global:
  scrape_interval: 15s      # Default: 15s
  evaluation_interval: 15s  # Default: 15s
```

**Resource limits**:

```yaml
deploy:
  resources:
    limits:
      cpus: '2.0'
      memory: 4G  # Increase for larger retention
```

### Grafana Optimization

**Cache configuration**:

```bash
# In .env
GF_DATABASE_CACHE_MODE=shared
GF_SECURITY_SECRET_KEY=<random-key>
```

**Query timeout**:

```bash
GF_DATAPROXY_TIMEOUT=60
GF_DATAPROXY_DIAL_TIMEOUT=30
```

## Troubleshooting

### Prometheus Not Scraping Targets

```bash
# Check Prometheus targets
curl http://localhost:9090/api/v1/targets

# Check service health
docker-compose -f docker-compose.prod.yml ps

# Check Prometheus logs
docker-compose -f docker-compose.prod.yml logs prometheus
```

### Grafana Cannot Connect to Prometheus

```bash
# Test connectivity
docker-compose -f docker-compose.prod.yml exec grafana wget -qO- http://prometheus:9090/api/v1/status/config

# Check datasource configuration
# Grafana UI → Configuration → Data Sources → Prometheus
```

### High Memory Usage

```bash
# Check Prometheus memory
docker stats mixgem_prometheus

# Reduce retention
# Edit docker-compose.prod.yml: --storage.tsdb.retention.time=15d

# Restart Prometheus
docker-compose -f docker-compose.prod.yml restart prometheus
```

### Missing Metrics

```bash
# Check exporter logs
docker-compose -f docker-compose.prod.yml logs postgres-exporter
docker-compose -f docker-compose.prod.yml logs redis-exporter
docker-compose -f docker-compose.prod.yml logs node-exporter

# Test exporter endpoints
curl http://localhost:9187/metrics  # PostgreSQL
curl http://localhost:9121/metrics  # Redis
curl http://localhost:9100/metrics  # Node
```

## Best Practices

### 1. Regular Monitoring

- **Check dashboards daily**: Review system and application health
- **Set up alerts**: Configure critical alerts (service down, high resource usage)
- **Review trends**: Weekly review of performance trends

### 2. Metric Retention

- **Production**: 30-90 days retention
- **Development**: 7-14 days retention
- **Archive important metrics**: Export to long-term storage if needed

### 3. Alert Hygiene

- **Avoid alert fatigue**: Only alert on actionable issues
- **Use severity levels**: critical, warning, info
- **Document runbooks**: Link alerts to resolution procedures

### 4. Dashboard Organization

- **Group by concern**: System, database, application, business
- **Use variables**: Make dashboards reusable with variables
- **Keep it simple**: Don't overwhelm with too many panels

### 5. Performance

- **Optimize queries**: Use recording rules for expensive queries
- **Limit resolution**: Don't fetch more data than needed
- **Use downsampling**: For long-term trends, reduce resolution

### 6. Security

- **Authentication**: Enable Grafana authentication
- **HTTPS**: Use SSL for Grafana (especially in production)
- **Restrict Prometheus**: Not publicly accessible (use Nginx proxy if needed)

## Advanced Topics

### Recording Rules

For expensive queries, pre-compute with recording rules:

```yaml
# In prometheus.yml
groups:
  - name: recording_rules
    interval: 30s
    rules:
      - record: job:node_cpu_usage:avg
        expr: 100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

      - record: job:pg_cache_hit_ratio:avg
        expr: rate(pg_stat_database_blks_hit[5m]) / (rate(pg_stat_database_blks_hit[5m]) + rate(pg_stat_database_blks_read[5m]))
```

### Federation

For multi-cluster setups, federate Prometheus instances:

```yaml
# Central Prometheus
scrape_configs:
  - job_name: 'federate'
    scrape_interval: 15s
    honor_labels: true
    metrics_path: '/federate'
    params:
      'match[]':
        - '{job=~".*"}'
    static_configs:
      - targets:
        - 'prometheus-cluster1:9090'
        - 'prometheus-cluster2:9090'
```

### Custom Exporters

Create custom exporters for application-specific metrics using Prometheus client libraries:

**Python example**:
```python
from prometheus_client import Counter, Histogram, start_http_server

request_count = Counter('app_requests_total', 'Total requests')
request_latency = Histogram('app_request_latency_seconds', 'Request latency')

# Expose metrics on port 8000
start_http_server(8000)
```

## Support

For monitoring assistance:
- **Prometheus Documentation**: https://prometheus.io/docs/
- **Grafana Documentation**: https://grafana.com/docs/
- **Community**: GitHub Discussions
