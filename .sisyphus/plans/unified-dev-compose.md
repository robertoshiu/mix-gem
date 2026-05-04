# Unified Docker Compose Dev Deployment

## TL;DR

> **Quick Summary**: Enhance the existing root `docker-compose.yml` to include all services (add missing `scavenger-recorder`), create a root `.env.example` for dev defaults, and add optional dev profiles for selective startup.
> 
> **Deliverables**:
> - Enhanced `/docker-compose.yml` with all services
> - New `/.env.example` with dev-friendly defaults
> - Verification commands documented
> 
> **Estimated Effort**: Quick (1-2 hours)
> **Parallel Execution**: YES - 2 waves
> **Critical Path**: Task 1 (understand) -> Task 2 (enhance compose) -> Task 4 (verify)

---

## Context

### Original Request
Create a single docker-compose dev deployment that brings up all services in /mnt/e/repo/mix-gem.

### Interview Summary
**Key Discussions**:
- User wants all services together in root compose
- Verification via `docker compose config`, `docker compose up -d`, health checks

**Research Findings**:
- **Root `docker-compose.yml` already exists** with 6 services: postgres, redis, ollama, rag-engine, scavenger-api, scavenger-simulator
- **Missing**: `scavenger-recorder` service (exists in `scavenger/docker-compose.yml` and `docker-compose.prod.yml`)
- **Missing**: Root `.env.example` (only exists in `scavenger/` and `equipment-monitor/`)
- Production compose has comprehensive profiles pattern to borrow from

### Current Service Inventory

| Service | Container | Port(s) | Status in Root Compose |
|---------|-----------|---------|------------------------|
| PostgreSQL (pgvector:pg17) | mixgem_postgres | 5432 | PRESENT |
| Redis (7-alpine) | mixgem_redis | 6379 | PRESENT |
| Ollama | mixgem_ollama | 11434 | PRESENT |
| RAG Engine | mixgem_rag_engine | 8001 | PRESENT |
| Scavenger API | mixgem_scavenger_api | 8000 | PRESENT |
| Scavenger Simulator | mixgem_simulator | 5000, 5001 | PRESENT |
| Scavenger Recorder | mixgem_scavenger_recorder | (none) | **MISSING** |

---

## Work Objectives

### Core Objective
Complete the root dev compose by adding the missing recorder service and creating a dev-friendly `.env.example` file.

### Concrete Deliverables
- `/docker-compose.yml` enhanced with `scavenger-recorder` service
- `/.env.example` with dev defaults (copied from equipment-monitor pattern)
- Verification script/commands documented in plan

### Definition of Done
- [ ] `docker compose config` validates without errors
- [ ] `docker compose up -d` starts all 7 services
- [ ] All health checks pass within 2 minutes
- [ ] `docker compose ps` shows all containers healthy

### Must Have
- All 7 services defined in root compose
- Health checks for all services
- Consistent naming convention (`mixgem_*` prefix)
- Volume definitions for data persistence

### Must NOT Have (Guardrails)
- DO NOT modify `scavenger/docker-compose.yml` (keep for standalone use)
- DO NOT add production-specific configs (that's what `docker-compose.prod.yml` is for)
- DO NOT add profiles to dev compose (keep simple - all services start by default)
- DO NOT commit real credentials to `.env.example`

---

## Verification Strategy (MANDATORY)

### Test Decision
- **Infrastructure exists**: NO (Docker commands only)
- **User wants tests**: NO (manual verification only)
- **Framework**: Shell commands

### Manual Execution Verification

Each TODO includes detailed verification procedures using shell commands.

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately):
├── Task 1: Inventory current state (no dependencies)
└── Task 3: Create .env.example (no dependencies)

Wave 2 (After Wave 1):
└── Task 2: Enhance docker-compose.yml (depends: Task 1)

Wave 3 (After Wave 2):
└── Task 4: Verify full stack (depends: Task 2, Task 3)

Critical Path: Task 1 -> Task 2 -> Task 4
Parallel Speedup: ~30% faster than sequential
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 2 | 3 |
| 2 | 1 | 4 | None |
| 3 | None | 4 | 1 |
| 4 | 2, 3 | None | None (final) |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Agents |
|------|-------|-------------------|
| 1 | 1, 3 | Both can run in parallel with `quick` category |
| 2 | 2 | Single agent with compose editing |
| 3 | 4 | Verification with bash commands |

---

## TODOs

- [ ] 1. Inventory and Document Current State

  **What to do**:
  - Read existing `/docker-compose.yml` and identify all services
  - Read existing `/docker-compose.prod.yml` to understand recorder service config
  - Read existing `/scavenger/docker-compose.yml` to understand recorder service config
  - Document any gaps between dev and prod configs
  - Identify any init.sql or migration scripts that need mounting

  **Must NOT do**:
  - Modify any files during this task
  - Skip reviewing production config patterns

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple file reading and documentation, no complex logic
  - **Skills**: [`docker-compose-generator`]
    - `docker-compose-generator`: Provides Docker Compose expertise for understanding config patterns

  **Skills Evaluated but Omitted**:
  - `git-master`: Not needed - no git operations
  - `python-programmer`: Not needed - no Python code

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 3)
  - **Blocks**: Task 2
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References**:
  - `/docker-compose.yml:1-186` - Current dev compose to understand existing patterns
  - `/docker-compose.prod.yml:279-319` - Production recorder service definition to copy
  - `/scavenger/docker-compose.yml:103-125` - Standalone recorder service definition

  **Documentation References**:
  - `/equipment-monitor/README.md` - Full stack documentation with profiles explanation

  **Acceptance Criteria**:

  **Manual Execution Verification:**
  - [ ] Command: `cat /docker-compose.yml | grep -c "container_name:"` -> Expected: 6
  - [ ] Command: `grep "recorder" /docker-compose.prod.yml` -> Shows recorder service exists
  - [ ] Document written with service comparison table

  **Commit**: NO (documentation only, groups with Task 2)

---

- [ ] 2. Add scavenger-recorder Service to Root Compose

  **What to do**:
  - Add `scavenger-recorder` service definition after `scavenger-simulator` section
  - Copy pattern from `/docker-compose.prod.yml:279-319` but simplify for dev:
    - Remove profiles declaration
    - Remove deploy/resources section
    - Remove logging driver options
    - Keep health check, environment, depends_on
  - Ensure consistent `mixgem_scavenger_recorder` container name
  - Verify service uses correct DATABASE_URL and REDIS_URL patterns

  **Must NOT do**:
  - Add profiles to any services (keep dev compose simple)
  - Add production configs (resource limits, logging drivers)
  - Change existing service definitions

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single file edit, straightforward service addition
  - **Skills**: [`docker-compose-generator`]
    - `docker-compose-generator`: Ensures proper YAML structure and Docker Compose best practices

  **Skills Evaluated but Omitted**:
  - `python-programmer`: Not needed - no Python code
  - `git-master`: Will be used for commit but not for this task

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (after Wave 1)
  - **Blocks**: Task 4
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `/docker-compose.prod.yml:279-319` - Production recorder config (source for dev version):
    ```yaml
    scavenger-recorder:
      build:
        context: ./scavenger
        target: recorder
      container_name: mixgem_scavenger_recorder
      depends_on:
        postgres:
          condition: service_healthy
        redis:
          condition: service_healthy
      environment:
        DATABASE_URL: postgresql+asyncpg://${POSTGRES_USER:-mixgem}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB:-mixgem}
        REDIS_URL: redis://redis:6379/0
        BATCH_SIZE: ${BATCH_SIZE:-100}
        FLUSH_INTERVAL_MS: ${FLUSH_INTERVAL_MS:-1000}
        LOG_LEVEL: ${LOG_LEVEL:-INFO}
      healthcheck:
        test: ["CMD", "python", "-c", "import redis; r=redis.from_url('redis://redis:6379/0'); r.ping()"]
        interval: 10s
        timeout: 5s
        retries: 3
        start_period: 10s
      restart: unless-stopped
    ```
  - `/docker-compose.yml:118-175` - Existing scavenger services pattern (for consistency)

  **Dockerfile References**:
  - `/scavenger/Dockerfile:64-71` - Recorder target definition confirming build context

  **Acceptance Criteria**:

  **Manual Execution Verification:**
  - [ ] Command: `docker compose config` -> Exit code 0, no errors
  - [ ] Command: `grep -A 30 "scavenger-recorder:" /docker-compose.yml` -> Shows new service
  - [ ] Command: `docker compose config --services | wc -l` -> Expected: 7

  **Commit**: YES
  - Message: `feat(docker): add scavenger-recorder to dev compose`
  - Files: `docker-compose.yml`
  - Pre-commit: `docker compose config --quiet`

---

- [ ] 3. Create Root .env.example File

  **What to do**:
  - Create `/.env.example` with dev-friendly defaults
  - Include all environment variables referenced in `/docker-compose.yml`
  - Use simple dev passwords (e.g., `mixgem` for all)
  - Include comments explaining each variable
  - Follow pattern from `/equipment-monitor/.env.example` but simplified

  **Must NOT do**:
  - Include real API keys or secrets
  - Include production-specific settings (resource limits, monitoring)
  - Make file executable

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple file creation with templated content
  - **Skills**: [`docker-compose-generator`]
    - `docker-compose-generator`: Provides environment file generation patterns

  **Skills Evaluated but Omitted**:
  - `python-programmer`: Not needed - no Python code
  - `git-master`: Will be used for commit but not for this task

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 1)
  - **Blocks**: Task 4
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References**:
  - `/equipment-monitor/.env.example:1-126` - Comprehensive example to simplify for dev
  - `/scavenger/.env.example:1-25` - Minimal example for reference
  - `/docker-compose.yml` - All `${VAR:-default}` patterns to extract

  **Template Content**:
  ```bash
  # Mix-GEM Development Environment
  # Copy to .env: cp .env.example .env

  # Database
  DB_NAME=mixgem
  DB_USER=mixgem
  DB_PASSWORD=mixgem

  # API Keys (optional for dev, required for full functionality)
  OPENAI_API_KEY=
  ANTHROPIC_API_KEY=

  # RAG Engine
  RAG_PORT=8001
  EMBEDDING_MODEL=snowflake-arctic-embed2
  LLM_MODEL=claude-sonnet-4-20250514

  # Scavenger
  SCAVENGER_PORT=8000
  EQUIPMENT_ID=LITHO01
  BATCH_SIZE=100
  FLUSH_INTERVAL_MS=1000

  # Logging
  LOG_LEVEL=INFO
  ```

  **Acceptance Criteria**:

  **Manual Execution Verification:**
  - [ ] Command: `test -f /.env.example && echo "exists"` -> Expected: "exists"
  - [ ] Command: `grep -c "=" /.env.example` -> Expected: 12+ lines with assignments
  - [ ] Command: `cp .env.example .env && docker compose config --quiet` -> Exit code 0

  **Commit**: YES
  - Message: `docs(docker): add .env.example for dev defaults`
  - Files: `.env.example`
  - Pre-commit: None needed

---

- [ ] 4. Verify Full Stack Startup and Health Checks

  **What to do**:
  - Validate compose configuration
  - Build all images (may take a few minutes first time)
  - Start all services
  - Wait for health checks to pass
  - Verify all 7 containers are running
  - Document verification results

  **Must NOT do**:
  - Skip waiting for health checks
  - Leave containers running after verification (optional cleanup)
  - Modify any files during verification

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Shell commands only, no coding required
  - **Skills**: [`docker-compose-generator`]
    - `docker-compose-generator`: Provides deployment verification patterns

  **Skills Evaluated but Omitted**:
  - `dev-browser`: Not needed - no browser interactions
  - `python-programmer`: Not needed - no Python code

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (final task)
  - **Blocks**: None (final)
  - **Blocked By**: Task 2, Task 3

  **References**:

  **Documentation References**:
  - `/equipment-monitor/README.md:68-82` - Health check endpoints
  - `/docker-compose.yml` - Health check definitions for each service

  **Verification Commands**:
  ```bash
  # 1. Validate config
  docker compose config --quiet

  # 2. Build images
  docker compose build

  # 3. Start stack
  docker compose up -d

  # 4. Wait and check health
  sleep 30
  docker compose ps

  # 5. Verify endpoints
  curl -f http://localhost:8000/health  # Scavenger API
  curl -f http://localhost:8001/health/live  # RAG Engine
  curl -f http://localhost:11434/api/tags  # Ollama

  # 6. Check container count
  docker compose ps --format json | jq -s 'length'  # Expected: 7

  # 7. Optional cleanup
  docker compose down
  ```

  **Acceptance Criteria**:

  **Manual Execution Verification:**
  - [ ] Command: `docker compose config --quiet` -> Exit code 0
  - [ ] Command: `docker compose up -d` -> All 7 services start
  - [ ] Command: `docker compose ps --format "table {{.Name}}\t{{.Status}}"` -> All show "Up" and "healthy"
  - [ ] Command: `curl -f http://localhost:8000/health` -> Returns 200 OK
  - [ ] Command: `docker compose ps --services | wc -l` -> Expected: 7

  **Evidence Required:**
  - [ ] Terminal output of `docker compose ps` captured
  - [ ] Curl responses logged for API health endpoints

  **Commit**: NO (verification only, no file changes)

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 2 | `feat(docker): add scavenger-recorder to dev compose` | docker-compose.yml | `docker compose config --quiet` |
| 3 | `docs(docker): add .env.example for dev defaults` | .env.example | None |

---

## Success Criteria

### Verification Commands
```bash
# Validate compose config
docker compose config --quiet  # Expected: exit 0

# Count services
docker compose config --services | wc -l  # Expected: 7

# List services
docker compose config --services
# Expected output:
# postgres
# redis
# ollama
# rag-engine
# scavenger-api
# scavenger-simulator
# scavenger-recorder

# Start and verify
docker compose up -d
sleep 60  # Wait for health checks
docker compose ps  # All should show "healthy"
```

### Final Checklist
- [ ] All 7 services defined in docker-compose.yml
- [ ] .env.example exists with dev defaults
- [ ] `docker compose config` validates without errors
- [ ] All health checks pass after `docker compose up -d`
- [ ] scavenger/docker-compose.yml NOT modified
- [ ] No production configs added to dev compose
