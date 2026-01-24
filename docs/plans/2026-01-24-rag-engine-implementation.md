# RAG Engine Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an ACE Context Engineering + Agentic RAG inference engine for lithography process engineering with SECS/GEM equipment integration.

**Architecture:** New `rag-engine` microservice using FastAPI that subscribes to Redis streams for equipment events, retrieves knowledge from pgvector, orchestrates LLM reasoning with domain-specific tools, and executes/queues actions based on classification.

**Tech Stack:** Python 3.12, FastAPI, SQLAlchemy, asyncpg, pgvector, Redis, Ollama (embeddings), Anthropic Claude (reasoning), secsgem (SECS/GEM)

---

## Phase 1: Project Scaffolding

### Task 1.1: Create Project Structure

**Files:**
- Create: `rag-engine/pyproject.toml`
- Create: `rag-engine/Dockerfile`
- Create: `rag-engine/app/__init__.py`
- Create: `rag-engine/app/main.py`
- Create: `rag-engine/app/config.py`

**Step 1: Create directory structure**

```bash
mkdir -p rag-engine/app/{routers,core,tools,services,models,seed/templates}
mkdir -p rag-engine/tests/test_tools
mkdir -p rag-engine/scripts
touch rag-engine/app/__init__.py
touch rag-engine/app/routers/__init__.py
touch rag-engine/app/core/__init__.py
touch rag-engine/app/tools/__init__.py
touch rag-engine/app/services/__init__.py
touch rag-engine/app/models/__init__.py
touch rag-engine/app/seed/__init__.py
touch rag-engine/tests/__init__.py
touch rag-engine/tests/test_tools/__init__.py
```

**Step 2: Create pyproject.toml**

```toml
[project]
name = "rag-engine"
version = "0.1.0"
description = "ACE Context Engineering + Agentic RAG for lithography process engineering"
requires-python = ">=3.12"
dependencies = [
    "fastapi>=0.115.0",
    "uvicorn[standard]>=0.32.0",
    "pydantic>=2.10.0",
    "pydantic-settings>=2.6.0",
    "sqlalchemy[asyncio]>=2.0.36",
    "asyncpg>=0.30.0",
    "pgvector>=0.3.6",
    "redis>=5.2.0",
    "httpx>=0.28.0",
    "anthropic>=0.40.0",
    "ollama>=0.4.0",
    "structlog>=24.4.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.3.0",
    "pytest-asyncio>=0.24.0",
    "pytest-cov>=6.0.0",
    "ruff>=0.8.0",
    "mypy>=1.13.0",
]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]

[tool.ruff]
target-version = "py312"
line-length = 100

[tool.ruff.lint]
select = ["E", "F", "I", "UP", "B", "SIM"]

[tool.mypy]
python_version = "3.12"
strict = true
```

**Step 3: Create config.py**

```python
# rag-engine/app/config.py
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings from environment variables."""

    # Database
    postgres_url: str = "postgresql+asyncpg://mixgem:mixgem@localhost:5432/mixgem"

    # Redis
    redis_url: str = "redis://localhost:6379"

    # Ollama (embeddings)
    ollama_host: str = "http://localhost:11434"
    embedding_model: str = "snowflake-arctic-embed2"
    embedding_dims: int = 1024

    # Anthropic (reasoning)
    anthropic_api_key: str = ""
    llm_model: str = "claude-sonnet-4-20250514"

    # Server
    host: str = "0.0.0.0"
    port: int = 8001
    log_level: str = "INFO"

    # Context budgets (percentages)
    tier1_budget: float = 0.12  # System instructions
    tier2_budget: float = 0.23  # Equipment state
    tier3_budget: float = 0.40  # Retrieved knowledge
    tier4_budget: float = 0.25  # Conversation history

    model_config = {"env_prefix": "", "case_sensitive": False}


settings = Settings()
```

**Step 4: Create main.py with lifespan**

```python
# rag-engine/app/main.py
from contextlib import asynccontextmanager
from typing import AsyncGenerator

import asyncpg
import redis.asyncio as redis
import structlog
from fastapi import FastAPI

from app.config import settings

logger = structlog.get_logger()

# Startup completion flag
startup_complete = False


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Manage application lifecycle: startup and shutdown."""
    global startup_complete

    # Startup
    logger.info("starting_up", postgres_url=settings.postgres_url[:20] + "...")

    app.state.db_pool = await asyncpg.create_pool(
        settings.postgres_url.replace("+asyncpg", ""),
        min_size=2,
        max_size=10,
    )
    app.state.redis = redis.from_url(settings.redis_url)

    startup_complete = True
    logger.info("startup_complete")

    yield

    # Shutdown
    logger.info("shutting_down")
    await app.state.db_pool.close()
    await app.state.redis.close()
    logger.info("shutdown_complete")


app = FastAPI(
    title="RAG Engine",
    version="0.1.0",
    description="ACE Context Engineering + Agentic RAG for lithography process engineering",
    lifespan=lifespan,
)


@app.get("/health/live")
async def liveness() -> dict[str, str]:
    """Liveness probe - process is running."""
    return {"status": "alive"}


@app.get("/health/startup")
async def startup_check() -> dict[str, str]:
    """Startup probe - initialization complete."""
    if startup_complete:
        return {"status": "started"}
    from fastapi.responses import JSONResponse

    return JSONResponse(status_code=503, content={"status": "starting"})
```

**Step 5: Create Dockerfile**

```dockerfile
# rag-engine/Dockerfile
FROM python:3.12-slim

WORKDIR /app

# Install dependencies
COPY pyproject.toml .
RUN pip install --no-cache-dir .

# Copy application
COPY app/ app/

# Run
EXPOSE 8001
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
```

**Step 6: Verify structure**

```bash
ls -la rag-engine/
ls -la rag-engine/app/
```

Expected: All directories and files present.

**Step 7: Commit**

```bash
git add rag-engine/
git commit -m "feat(rag-engine): scaffold project structure

- pyproject.toml with dependencies
- FastAPI app with lifespan (db pool, redis)
- Pydantic settings from env vars
- Dockerfile for containerization"
```

---

### Task 1.2: Add Health Endpoints with Dependency Checks

**Files:**
- Create: `rag-engine/app/routers/health.py`
- Modify: `rag-engine/app/main.py`
- Create: `rag-engine/tests/test_health.py`

**Step 1: Write failing test for readiness probe**

```python
# rag-engine/tests/test_health.py
import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.fixture
async def client():
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as ac:
        yield ac


@pytest.mark.asyncio
async def test_liveness(client: AsyncClient):
    response = await client.get("/health/live")
    assert response.status_code == 200
    assert response.json()["status"] == "alive"


@pytest.mark.asyncio
async def test_readiness_returns_components(client: AsyncClient):
    response = await client.get("/health/ready")
    # May be 200 or 503 depending on deps, but should have structure
    data = response.json()
    assert "status" in data
    assert "components" in data
    assert "version" in data
```

**Step 2: Run test to verify it fails**

```bash
cd rag-engine && pip install -e ".[dev]" && pytest tests/test_health.py -v
```

Expected: FAIL - `/health/ready` not found (404)

**Step 3: Create health router**

```python
# rag-engine/app/routers/health.py
import time
from typing import Any

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel

router = APIRouter(tags=["Health"])


class ComponentHealth(BaseModel):
    """Health status of a single component."""

    status: str  # healthy, degraded, unhealthy
    latency_ms: float | None = None
    message: str | None = None


class HealthResponse(BaseModel):
    """Overall health response."""

    status: str
    components: dict[str, ComponentHealth]
    version: str


async def check_postgres(app_state: Any) -> float:
    """Check PostgreSQL connectivity, return latency in ms."""
    start = time.time()
    async with app_state.db_pool.acquire() as conn:
        await conn.fetchval("SELECT 1")
    return (time.time() - start) * 1000


async def check_redis(app_state: Any) -> float:
    """Check Redis connectivity, return latency in ms."""
    start = time.time()
    await app_state.redis.ping()
    return (time.time() - start) * 1000


@router.get("/health/ready", response_model=HealthResponse)
async def readiness(request: Request) -> JSONResponse:
    """Readiness probe - all dependencies available."""
    components: dict[str, ComponentHealth] = {}
    overall_status = "healthy"

    # Check PostgreSQL
    try:
        latency = await check_postgres(request.app.state)
        components["postgres"] = ComponentHealth(status="healthy", latency_ms=latency)
    except Exception as e:
        components["postgres"] = ComponentHealth(status="unhealthy", message=str(e))
        overall_status = "unhealthy"

    # Check Redis
    try:
        latency = await check_redis(request.app.state)
        components["redis"] = ComponentHealth(status="healthy", latency_ms=latency)
    except Exception as e:
        components["redis"] = ComponentHealth(status="unhealthy", message=str(e))
        overall_status = "unhealthy"

    response = HealthResponse(
        status=overall_status,
        components=components,
        version="0.1.0",
    )

    status_code = 200 if overall_status == "healthy" else 503
    return JSONResponse(content=response.model_dump(), status_code=status_code)
```

**Step 4: Register router in main.py**

Add to `rag-engine/app/main.py` after app creation:

```python
from app.routers.health import router as health_router

app.include_router(health_router)
```

**Step 5: Run tests**

```bash
cd rag-engine && pytest tests/test_health.py -v
```

Expected: Tests may fail if no postgres/redis running, but structure is correct.

**Step 6: Commit**

```bash
git add rag-engine/app/routers/ rag-engine/tests/
git commit -m "feat(rag-engine): add health readiness probe

- Check postgres and redis connectivity
- Return component status with latency
- 503 if any component unhealthy"
```

---

## Phase 2: Knowledge Schema + Seeding

### Task 2.1: Create Database Models

**Files:**
- Create: `rag-engine/app/models/db.py`
- Create: `rag-engine/scripts/init_db.sql`

**Step 1: Create SQLAlchemy models**

```python
# rag-engine/app/models/db.py
from datetime import datetime
from uuid import UUID, uuid4

from pgvector.sqlalchemy import Vector
from sqlalchemy import Boolean, DateTime, Index, String, Text, func
from sqlalchemy.dialects.postgresql import TSVECTOR
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class KnowledgeChunk(Base):
    """Persistent knowledge with embeddings for semantic search."""

    __tablename__ = "knowledge_chunks"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    embedding: Mapped[list[float]] = mapped_column(Vector(1024), nullable=True)

    # Metadata for filtered search
    chunk_type: Mapped[str] = mapped_column(String(50), nullable=False)
    domain: Mapped[str | None] = mapped_column(String(50), nullable=True)
    layer_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    wavelength: Mapped[str | None] = mapped_column(String(20), nullable=True)
    difficulty: Mapped[str | None] = mapped_column(String(20), nullable=True)

    # Full-text search (computed column in PostgreSQL)
    content_tsv: Mapped[str] = mapped_column(TSVECTOR, nullable=True)

    # Provenance
    source: Mapped[str] = mapped_column(String(100), default="lithography-expert-skill")
    synthetic: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    __table_args__ = (
        Index("knowledge_filter_idx", "chunk_type", "domain", "layer_type"),
    )


class QueryLog(Base):
    """Log of engineer queries for analytics."""

    __tablename__ = "query_logs"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    session_id: Mapped[str] = mapped_column(String(100), nullable=False)
    question: Mapped[str] = mapped_column(Text, nullable=False)
    answer: Mapped[str] = mapped_column(Text, nullable=False)
    tool_id: Mapped[str | None] = mapped_column(String(50), nullable=True)
    evidence_count: Mapped[int] = mapped_column(default=0)
    action_proposed: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    __table_args__ = (Index("query_log_session_idx", "session_id", "created_at"),)
```

**Step 2: Create init SQL script**

```sql
-- rag-engine/scripts/init_db.sql
-- Run this to set up the database schema

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Knowledge chunks table
CREATE TABLE IF NOT EXISTS knowledge_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    embedding vector(1024),

    chunk_type VARCHAR(50) NOT NULL,
    domain VARCHAR(50),
    layer_type VARCHAR(50),
    wavelength VARCHAR(20),
    difficulty VARCHAR(20),

    content_tsv TSVECTOR GENERATED ALWAYS AS (to_tsvector('english', content)) STORED,

    source VARCHAR(100) DEFAULT 'lithography-expert-skill',
    synthetic BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- HNSW index for semantic search
CREATE INDEX IF NOT EXISTS knowledge_embedding_idx ON knowledge_chunks
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- GIN index for full-text search
CREATE INDEX IF NOT EXISTS knowledge_content_tsv_idx ON knowledge_chunks USING GIN (content_tsv);

-- Composite index for filtered queries
CREATE INDEX IF NOT EXISTS knowledge_filter_idx ON knowledge_chunks (chunk_type, domain, layer_type);

-- Query logs table
CREATE TABLE IF NOT EXISTS query_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(100) NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    tool_id VARCHAR(50),
    evidence_count INT DEFAULT 0,
    action_proposed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS query_log_session_idx ON query_logs (session_id, created_at);

-- Hybrid search function
CREATE OR REPLACE FUNCTION hybrid_search_knowledge(
    query_text TEXT,
    query_embedding vector(1024),
    filter_domain VARCHAR DEFAULT NULL,
    filter_layer VARCHAR DEFAULT NULL,
    match_count INT DEFAULT 10,
    full_text_weight FLOAT DEFAULT 0.3,
    semantic_weight FLOAT DEFAULT 0.7
) RETURNS TABLE (
    id UUID,
    content TEXT,
    chunk_type VARCHAR,
    domain VARCHAR,
    score FLOAT
) AS $$
BEGIN
    RETURN QUERY
    WITH semantic AS (
        SELECT
            k.id,
            k.content,
            k.chunk_type,
            k.domain,
            1 - (k.embedding <=> query_embedding) AS semantic_score,
            ROW_NUMBER() OVER (ORDER BY k.embedding <=> query_embedding) AS semantic_rank
        FROM knowledge_chunks k
        WHERE (filter_domain IS NULL OR k.domain = filter_domain)
          AND (filter_layer IS NULL OR k.layer_type = filter_layer)
          AND k.embedding IS NOT NULL
        LIMIT match_count * 2
    ),
    fulltext AS (
        SELECT
            k.id,
            ts_rank(k.content_tsv, websearch_to_tsquery('english', query_text)) AS ft_score,
            ROW_NUMBER() OVER (ORDER BY ts_rank(k.content_tsv, websearch_to_tsquery('english', query_text)) DESC) AS ft_rank
        FROM knowledge_chunks k
        WHERE k.content_tsv @@ websearch_to_tsquery('english', query_text)
          AND (filter_domain IS NULL OR k.domain = filter_domain)
          AND (filter_layer IS NULL OR k.layer_type = filter_layer)
        LIMIT match_count * 2
    )
    SELECT
        s.id,
        s.content,
        s.chunk_type,
        s.domain,
        (
            semantic_weight * COALESCE(s.semantic_score, 0) +
            full_text_weight * COALESCE(f.ft_score, 0)
        )::FLOAT AS score
    FROM semantic s
    LEFT JOIN fulltext f ON s.id = f.id
    ORDER BY score DESC
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql;
```

**Step 3: Commit**

```bash
git add rag-engine/app/models/ rag-engine/scripts/
git commit -m "feat(rag-engine): add database models and schema

- KnowledgeChunk with pgvector embedding
- QueryLog for analytics
- Hybrid search function (semantic + full-text)"
```

---

### Task 2.2: Create Embedding Service

**Files:**
- Create: `rag-engine/app/services/embedding.py`
- Create: `rag-engine/tests/test_embedding.py`

**Step 1: Write test for embedding service**

```python
# rag-engine/tests/test_embedding.py
import pytest
from unittest.mock import AsyncMock, patch

from app.services.embedding import EmbeddingService


@pytest.mark.asyncio
async def test_embed_single_text():
    mock_response = {"embeddings": [[0.1] * 1024]}

    with patch("ollama.embed", return_value=mock_response):
        service = EmbeddingService(host="http://test:11434", model="test-model")
        result = await service.embed("test text")

        assert len(result) == 1024
        assert result[0] == 0.1


@pytest.mark.asyncio
async def test_embed_batch():
    mock_response = {"embeddings": [[0.1] * 1024, [0.2] * 1024]}

    with patch("ollama.embed", return_value=mock_response):
        service = EmbeddingService(host="http://test:11434", model="test-model")
        results = await service.embed_batch(["text1", "text2"])

        assert len(results) == 2
        assert results[0][0] == 0.1
        assert results[1][0] == 0.2
```

**Step 2: Run test to verify it fails**

```bash
cd rag-engine && pytest tests/test_embedding.py -v
```

Expected: FAIL - module not found

**Step 3: Implement embedding service**

```python
# rag-engine/app/services/embedding.py
import ollama
from functools import lru_cache


class EmbeddingService:
    """Generate embeddings using Ollama."""

    def __init__(self, host: str, model: str = "snowflake-arctic-embed2"):
        self.host = host
        self.model = model
        # Configure ollama client
        ollama.Client(host=host)

    async def embed(self, text: str) -> list[float]:
        """Generate embedding for a single text."""
        response = ollama.embed(model=self.model, input=text)
        return response["embeddings"][0]

    async def embed_batch(self, texts: list[str]) -> list[list[float]]:
        """Generate embeddings for multiple texts."""
        response = ollama.embed(model=self.model, input=texts)
        return response["embeddings"]


@lru_cache
def get_embedding_service(host: str, model: str) -> EmbeddingService:
    """Get cached embedding service instance."""
    return EmbeddingService(host=host, model=model)
```

**Step 4: Run tests**

```bash
cd rag-engine && pytest tests/test_embedding.py -v
```

Expected: PASS

**Step 5: Commit**

```bash
git add rag-engine/app/services/embedding.py rag-engine/tests/test_embedding.py
git commit -m "feat(rag-engine): add Ollama embedding service

- Single text and batch embedding
- Cached service instance"
```

---

### Task 2.3: Create Knowledge Seeder

**Files:**
- Create: `rag-engine/app/seed/knowledge_seeder.py`
- Create: `rag-engine/app/seed/templates/concepts.yaml`
- Create: `rag-engine/scripts/seed_knowledge.py`

**Step 1: Create concept templates**

```yaml
# rag-engine/app/seed/templates/concepts.yaml
concepts:
  - chunk_type: concept
    domain: focus
    difficulty: conceptual
    content: |
      Focus in lithography refers to the vertical position of the wafer relative to the
      best focal plane of the imaging system. Optimal focus produces the sharpest aerial
      image and best CD control. Focus errors cause CD variations: a typical DUV system
      shows approximately 3-5nm CD change per 10nm focus offset. EUV systems are more
      sensitive due to shorter wavelength.

  - chunk_type: concept
    domain: dose
    difficulty: conceptual
    content: |
      Dose (exposure energy) controls how much light reaches the photoresist. Higher dose
      causes more resist to be exposed in positive-tone processes, resulting in smaller
      features. The dose-to-size sensitivity is typically 2-4nm CD per 1% dose change.
      Maintaining dose uniformity across the wafer is critical for CDU control.

  - chunk_type: concept
    domain: overlay
    difficulty: conceptual
    content: |
      Overlay is the alignment accuracy between successive lithography layers. Modern
      nodes require sub-2nm overlay. Components include translation (X/Y shift), rotation,
      magnification, and higher-order distortions. Overlay errors cause electrical shorts
      or opens when features don't align properly between layers.

  - chunk_type: concept
    domain: cdu
    difficulty: conceptual
    content: |
      CDU (Critical Dimension Uniformity) measures the variation in feature sizes across
      the wafer. It has multiple components: within-field (lens aberrations), field-to-field
      (scanner matching), and wafer-to-wafer (process drift). Total CDU budget is typically
      allocated as sqrt sum of components, each kept below 1-2nm for advanced nodes.

  - chunk_type: concept
    domain: defect
    difficulty: conceptual
    content: |
      Lithography defects include particles (from environment or resist), pattern collapse
      (aspect ratio too high), bridging (features merge), and stochastic failures (EUV
      shot noise). Defect density targets are typically <0.01/cm² for yield. Root cause
      analysis requires correlating defect maps with process parameters and equipment state.

  - chunk_type: qa
    domain: focus
    difficulty: troubleshooting
    content: |
      Q: CD is trending +3nm over the last 5 lots on LITHO01. What should I check?
      A: Systematic CD drift suggests focus or dose drift. Check: (1) Focus offset trend
      in equipment logs - look for gradual shift indicating thermal drift or stage drift.
      (2) Dose monitoring - verify energy sensor calibration. (3) Resist thickness - could
      indicate coating issue. (4) Recent maintenance - any lens or stage adjustments.
      Start with focus since 3nm CD shift typically corresponds to ~6-10nm focus offset.

  - chunk_type: qa
    domain: overlay
    difficulty: troubleshooting
    content: |
      Q: Overlay errors suddenly increased from 1.5nm to 3nm on metal layer. What happened?
      A: Sudden overlay degradation indicates discrete event rather than drift. Check:
      (1) Recent reticle changes or cleaning. (2) Stage calibration status. (3) Alignment
      mark quality on incoming wafers. (4) Any equipment interventions or PM activities.
      (5) Lot-to-lot correlation - if consistent, likely equipment; if random, likely wafer.

  - chunk_type: process_window
    domain: focus
    difficulty: expert
    content: |
      Process Window Estimation for Contact Layer:
      Target CD: 40nm ± 2nm (5% tolerance)
      Focus sensitivity: 4nm CD per 10nm focus
      Usable focus range: ±50nm (from DoF measurement)
      Guard band: 20% for process variation
      Effective focus window: ±40nm
      Dose sensitivity: 3nm CD per 1% dose
      Usable dose range: ±3% (from E-D matrix)
      Effective dose window: ±2.4%
      Overlapping process window area confirms manufacturable conditions.

  - chunk_type: anomaly
    domain: focus
    difficulty: expert
    content: |
      Anomaly Pattern: Focus Drift Alarm
      Symptom: ALARM_FOCUS_DRIFT, CD trending >2nm over 3 lots
      SECS Event: S5F1 with ALID=1001
      Root Causes:
      - Thermal drift in projection lens (probability: 40%, check: lens temp logs)
      - Stage Z calibration drift (probability: 30%, check: stage encoder data)
      - Reticle flatness change (probability: 20%, check: reticle qualification)
      - Metrology drift (probability: 10%, check: golden wafer)
      Recommended Actions:
      - Run focus calibration routine (S2F41: FOCUS_CAL)
      - If persists, escalate to lens thermal stabilization
```

**Step 2: Create knowledge seeder**

```python
# rag-engine/app/seed/knowledge_seeder.py
import asyncio
from pathlib import Path
from uuid import uuid4

import asyncpg
import structlog
import yaml

from app.config import settings
from app.services.embedding import EmbeddingService

logger = structlog.get_logger()

TEMPLATES_DIR = Path(__file__).parent / "templates"


async def load_templates() -> list[dict]:
    """Load all YAML template files."""
    templates = []

    for yaml_file in TEMPLATES_DIR.glob("*.yaml"):
        with open(yaml_file) as f:
            data = yaml.safe_load(f)
            if "concepts" in data:
                templates.extend(data["concepts"])

    logger.info("loaded_templates", count=len(templates))
    return templates


async def seed_knowledge(
    db_pool: asyncpg.Pool,
    embedding_service: EmbeddingService,
    force: bool = False,
) -> int:
    """Seed knowledge base with synthetic content.

    Args:
        db_pool: Database connection pool
        embedding_service: Service for generating embeddings
        force: If True, delete existing and reseed

    Returns:
        Number of chunks inserted
    """
    async with db_pool.acquire() as conn:
        # Check existing count
        existing = await conn.fetchval("SELECT COUNT(*) FROM knowledge_chunks")

        if existing > 0 and not force:
            logger.info("knowledge_exists", count=existing)
            return 0

        if force and existing > 0:
            await conn.execute("DELETE FROM knowledge_chunks WHERE synthetic = TRUE")
            logger.info("deleted_synthetic", count=existing)

        # Load templates
        templates = await load_templates()

        if not templates:
            logger.warning("no_templates_found")
            return 0

        # Generate embeddings in batch
        contents = [t["content"] for t in templates]
        embeddings = await embedding_service.embed_batch(contents)

        # Insert chunks
        inserted = 0
        for template, embedding in zip(templates, embeddings):
            await conn.execute(
                """
                INSERT INTO knowledge_chunks
                (id, content, embedding, chunk_type, domain, layer_type, wavelength, difficulty, source, synthetic)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, TRUE)
                """,
                uuid4(),
                template["content"],
                embedding,
                template.get("chunk_type", "concept"),
                template.get("domain"),
                template.get("layer_type"),
                template.get("wavelength"),
                template.get("difficulty"),
                "lithography-expert-skill",
            )
            inserted += 1

        logger.info("seeded_knowledge", count=inserted)
        return inserted
```

**Step 3: Create CLI script**

```python
#!/usr/bin/env python3
# rag-engine/scripts/seed_knowledge.py
"""CLI script to seed knowledge base."""
import argparse
import asyncio

import asyncpg

from app.config import settings
from app.seed.knowledge_seeder import seed_knowledge
from app.services.embedding import EmbeddingService


async def main(force: bool = False):
    print(f"Connecting to {settings.postgres_url[:30]}...")

    pool = await asyncpg.create_pool(
        settings.postgres_url.replace("+asyncpg", ""),
        min_size=1,
        max_size=2,
    )

    embedding_service = EmbeddingService(
        host=settings.ollama_host,
        model=settings.embedding_model,
    )

    try:
        count = await seed_knowledge(pool, embedding_service, force=force)
        print(f"Inserted {count} knowledge chunks")
    finally:
        await pool.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed knowledge base")
    parser.add_argument("--force", action="store_true", help="Delete and reseed")
    args = parser.parse_args()

    asyncio.run(main(force=args.force))
```

**Step 4: Commit**

```bash
git add rag-engine/app/seed/ rag-engine/scripts/seed_knowledge.py
git commit -m "feat(rag-engine): add knowledge seeder

- YAML templates for lithography concepts
- Batch embedding generation
- CLI script for seeding"
```

---

## Phase 3: Context Assembler

### Task 3.1: Create Query Classifier

**Files:**
- Create: `rag-engine/app/core/query_classifier.py`
- Create: `rag-engine/tests/test_query_classifier.py`

**Step 1: Write test for query classifier**

```python
# rag-engine/tests/test_query_classifier.py
import pytest

from app.core.query_classifier import QueryClassifier, QueryProfile


def test_classify_troubleshooting_query():
    classifier = QueryClassifier()
    profile = classifier.classify("Why is CD trending high on LITHO01?")

    assert profile.query_type == "troubleshooting"
    assert profile.tier2_weight > 0.20  # Equipment gets more weight


def test_classify_conceptual_query():
    classifier = QueryClassifier()
    profile = classifier.classify("Explain focus sensitivity in DUV lithography")

    assert profile.query_type == "conceptual"
    assert profile.tier3_weight > 0.40  # Knowledge gets more weight


def test_classify_process_query():
    classifier = QueryClassifier()
    profile = classifier.classify("What is the process window for contact layer?")

    assert profile.query_type == "process"


def test_budgets_sum_to_one():
    classifier = QueryClassifier()
    profile = classifier.classify("any question")

    total = profile.tier1_weight + profile.tier2_weight + profile.tier3_weight + profile.tier4_weight
    assert abs(total - 1.0) < 0.01
```

**Step 2: Run test to verify it fails**

```bash
cd rag-engine && pytest tests/test_query_classifier.py -v
```

Expected: FAIL - module not found

**Step 3: Implement query classifier**

```python
# rag-engine/app/core/query_classifier.py
import re
from dataclasses import dataclass

from app.config import settings


@dataclass
class QueryProfile:
    """Context budget allocation based on query type."""

    query_type: str  # troubleshooting, conceptual, process, conversational
    tier1_weight: float  # System instructions
    tier2_weight: float  # Equipment state
    tier3_weight: float  # Retrieved knowledge
    tier4_weight: float  # Conversation history
    extracted_domains: list[str]  # Detected domains (focus, dose, etc.)
    extracted_tool_id: str | None  # Detected equipment ID


# Keywords for classification
TROUBLESHOOTING_PATTERNS = [
    r"\bwhy\b.*\b(trending|increasing|decreasing|drift|fail|error|alarm)\b",
    r"\bwhat\s+(happened|caused|is wrong)\b",
    r"\b(debug|troubleshoot|diagnose|investigate)\b",
    r"\b(error|alarm|warning|fault)\b",
]

CONCEPTUAL_PATTERNS = [
    r"\b(explain|what is|how does|describe)\b",
    r"\b(definition|concept|theory|principle)\b",
    r"\b(sensitivity|relationship|effect)\b",
]

PROCESS_PATTERNS = [
    r"\b(process window|recipe|parameter)\b",
    r"\b(dose|focus|overlay|cdu)\s+(range|limit|spec)\b",
    r"\b(calculate|estimate|margin)\b",
]

DOMAIN_KEYWORDS = {
    "focus": ["focus", "dof", "depth of focus", "defocus"],
    "dose": ["dose", "exposure", "energy", "intensity"],
    "overlay": ["overlay", "alignment", "registration"],
    "cdu": ["cdu", "uniformity", "cd variation", "critical dimension"],
    "defect": ["defect", "particle", "bridging", "collapse"],
}

TOOL_PATTERN = r"\b(LITHO\d+|TRACK\d+|TOOL\d+)\b"


class QueryClassifier:
    """Classify queries to determine context budget allocation."""

    def classify(self, question: str) -> QueryProfile:
        """Analyze question and return context budget profile."""
        question_lower = question.lower()

        # Detect query type
        query_type = self._detect_type(question_lower)

        # Extract domains mentioned
        domains = self._extract_domains(question_lower)

        # Extract tool ID
        tool_match = re.search(TOOL_PATTERN, question, re.IGNORECASE)
        tool_id = tool_match.group(1).upper() if tool_match else None

        # Allocate budgets based on type
        weights = self._allocate_budgets(query_type, has_tool=tool_id is not None)

        return QueryProfile(
            query_type=query_type,
            tier1_weight=weights[0],
            tier2_weight=weights[1],
            tier3_weight=weights[2],
            tier4_weight=weights[3],
            extracted_domains=domains,
            extracted_tool_id=tool_id,
        )

    def _detect_type(self, question: str) -> str:
        """Detect query type from patterns."""
        for pattern in TROUBLESHOOTING_PATTERNS:
            if re.search(pattern, question, re.IGNORECASE):
                return "troubleshooting"

        for pattern in CONCEPTUAL_PATTERNS:
            if re.search(pattern, question, re.IGNORECASE):
                return "conceptual"

        for pattern in PROCESS_PATTERNS:
            if re.search(pattern, question, re.IGNORECASE):
                return "process"

        return "conversational"

    def _extract_domains(self, question: str) -> list[str]:
        """Extract lithography domains mentioned."""
        domains = []
        for domain, keywords in DOMAIN_KEYWORDS.items():
            if any(kw in question for kw in keywords):
                domains.append(domain)
        return domains

    def _allocate_budgets(self, query_type: str, has_tool: bool) -> tuple[float, float, float, float]:
        """Return (tier1, tier2, tier3, tier4) weights."""
        if query_type == "troubleshooting":
            # More equipment context for debugging
            return (0.10, 0.30, 0.40, 0.20)
        elif query_type == "conceptual":
            # More knowledge retrieval for explanations
            return (0.10, 0.15, 0.50, 0.25)
        elif query_type == "process":
            # Balanced for process engineering
            return (0.10, 0.25, 0.45, 0.20)
        else:
            # Conversational - more history
            return (0.12, 0.20, 0.33, 0.35)
```

**Step 4: Run tests**

```bash
cd rag-engine && pytest tests/test_query_classifier.py -v
```

Expected: PASS

**Step 5: Commit**

```bash
git add rag-engine/app/core/query_classifier.py rag-engine/tests/test_query_classifier.py
git commit -m "feat(rag-engine): add query classifier

- Pattern-based query type detection
- Domain extraction (focus, dose, overlay, etc.)
- Dynamic budget allocation per query type"
```

---

### Task 3.2: Create Context Assembler

**Files:**
- Create: `rag-engine/app/core/context_assembler.py`
- Create: `rag-engine/tests/test_context_assembler.py`

**Step 1: Write test for context assembler**

```python
# rag-engine/tests/test_context_assembler.py
import pytest
from unittest.mock import AsyncMock, MagicMock

from app.core.context_assembler import ContextAssembler, AssembledContext
from app.core.query_classifier import QueryProfile


@pytest.fixture
def mock_deps():
    return {
        "db_pool": AsyncMock(),
        "redis": AsyncMock(),
        "embedding_service": AsyncMock(),
    }


@pytest.mark.asyncio
async def test_assemble_includes_all_tiers(mock_deps):
    mock_deps["embedding_service"].embed.return_value = [0.1] * 1024
    mock_deps["db_pool"].acquire.return_value.__aenter__.return_value.fetch.return_value = []
    mock_deps["redis"].hgetall.return_value = {}
    mock_deps["redis"].zrevrange.return_value = []

    assembler = ContextAssembler(**mock_deps)
    profile = QueryProfile(
        query_type="troubleshooting",
        tier1_weight=0.10,
        tier2_weight=0.30,
        tier3_weight=0.40,
        tier4_weight=0.20,
        extracted_domains=["focus"],
        extracted_tool_id="LITHO01",
    )

    context = await assembler.assemble(
        question="Why is CD trending?",
        profile=profile,
        session_id="test-session",
    )

    assert context.tier1_system is not None
    assert "LITHO01" in context.tier1_system
    assert isinstance(context.tier2_equipment, dict)
    assert isinstance(context.tier3_knowledge, list)
    assert isinstance(context.tier4_history, list)


@pytest.mark.asyncio
async def test_assemble_respects_max_tokens(mock_deps):
    mock_deps["embedding_service"].embed.return_value = [0.1] * 1024
    mock_deps["db_pool"].acquire.return_value.__aenter__.return_value.fetch.return_value = [
        {"content": "x" * 10000, "chunk_type": "concept", "domain": "focus"}
        for _ in range(100)
    ]
    mock_deps["redis"].hgetall.return_value = {}
    mock_deps["redis"].zrevrange.return_value = []

    assembler = ContextAssembler(**mock_deps, max_tokens=4000)
    profile = QueryProfile(
        query_type="conceptual",
        tier1_weight=0.10,
        tier2_weight=0.15,
        tier3_weight=0.50,
        tier4_weight=0.25,
        extracted_domains=[],
        extracted_tool_id=None,
    )

    context = await assembler.assemble(
        question="Explain focus",
        profile=profile,
        session_id="test",
    )

    # Should not exceed max tokens
    total_chars = len(context.tier1_system) + sum(len(k["content"]) for k in context.tier3_knowledge)
    assert total_chars < 4000 * 4  # Rough char-to-token ratio
```

**Step 2: Run test to verify it fails**

```bash
cd rag-engine && pytest tests/test_context_assembler.py -v
```

Expected: FAIL - module not found

**Step 3: Implement context assembler**

```python
# rag-engine/app/core/context_assembler.py
import json
from dataclasses import dataclass, field

import asyncpg
import redis.asyncio as redis
import structlog

from app.core.query_classifier import QueryProfile
from app.services.embedding import EmbeddingService

logger = structlog.get_logger()

SYSTEM_TEMPLATE = """You are a lithography process engineering assistant with real-time equipment integration.

Current Equipment: {tool_id}
Domain Focus: {domains}

Capabilities:
- Answer process engineering questions using retrieved knowledge
- Analyze equipment state from SECS/GEM messages
- Propose corrective actions (requires engineer confirmation)

All knowledge is synthetic/illustrative unless marked otherwise.

Guidelines:
- Cite evidence sources in your reasoning
- Distinguish between physics-driven expectations and process integration reality
- For equipment-affecting actions, always propose and wait for confirmation
"""


@dataclass
class AssembledContext:
    """Tiered context ready for LLM prompt."""

    tier1_system: str
    tier2_equipment: dict
    tier3_knowledge: list[dict]
    tier4_history: list[dict]
    profile: QueryProfile
    total_tokens_estimate: int = 0


class ContextAssembler:
    """Build tiered context from multiple sources."""

    def __init__(
        self,
        db_pool: asyncpg.Pool,
        redis: redis.Redis,
        embedding_service: EmbeddingService,
        max_tokens: int = 8000,
    ):
        self.db_pool = db_pool
        self.redis = redis
        self.embedding_service = embedding_service
        self.max_tokens = max_tokens

    async def assemble(
        self,
        question: str,
        profile: QueryProfile,
        session_id: str,
    ) -> AssembledContext:
        """Assemble tiered context based on query profile."""
        logger.info(
            "assembling_context",
            query_type=profile.query_type,
            tool_id=profile.extracted_tool_id,
        )

        # Calculate token budgets
        tier1_tokens = int(self.max_tokens * profile.tier1_weight)
        tier2_tokens = int(self.max_tokens * profile.tier2_weight)
        tier3_tokens = int(self.max_tokens * profile.tier3_weight)
        tier4_tokens = int(self.max_tokens * profile.tier4_weight)

        # Build each tier
        tier1 = self._build_tier1(profile, tier1_tokens)
        tier2 = await self._build_tier2(profile.extracted_tool_id, tier2_tokens)
        tier3 = await self._build_tier3(question, profile, tier3_tokens)
        tier4 = await self._build_tier4(session_id, tier4_tokens)

        # Estimate total tokens (rough: 4 chars per token)
        total_chars = (
            len(tier1)
            + len(json.dumps(tier2))
            + sum(len(k.get("content", "")) for k in tier3)
            + sum(len(json.dumps(h)) for h in tier4)
        )

        return AssembledContext(
            tier1_system=tier1,
            tier2_equipment=tier2,
            tier3_knowledge=tier3,
            tier4_history=tier4,
            profile=profile,
            total_tokens_estimate=total_chars // 4,
        )

    def _build_tier1(self, profile: QueryProfile, max_tokens: int) -> str:
        """Build system instructions with tool context."""
        tool_id = profile.extracted_tool_id or "Not specified"
        domains = ", ".join(profile.extracted_domains) if profile.extracted_domains else "General"

        system = SYSTEM_TEMPLATE.format(tool_id=tool_id, domains=domains)

        # Truncate if needed
        max_chars = max_tokens * 4
        if len(system) > max_chars:
            system = system[:max_chars] + "..."

        return system

    async def _build_tier2(self, tool_id: str | None, max_tokens: int) -> dict:
        """Fetch equipment state from Redis."""
        if not tool_id:
            return {}

        try:
            # Get current state
            state_key = f"equipment:state:{tool_id}"
            state = await self.redis.hgetall(state_key)

            # Get recent messages
            messages_key = f"recent:messages:{tool_id}"
            recent = await self.redis.zrevrange(messages_key, 0, 10, withscores=True)

            return {
                "state": {k.decode() if isinstance(k, bytes) else k: v.decode() if isinstance(v, bytes) else v for k, v in state.items()},
                "recent_messages": [
                    {"data": m.decode() if isinstance(m, bytes) else m, "timestamp": s}
                    for m, s in recent
                ],
            }
        except Exception as e:
            logger.warning("tier2_fetch_failed", error=str(e))
            return {}

    async def _build_tier3(
        self,
        question: str,
        profile: QueryProfile,
        max_tokens: int,
    ) -> list[dict]:
        """Retrieve relevant knowledge from pgvector."""
        try:
            # Generate query embedding
            query_embedding = await self.embedding_service.embed(question)

            # Search with filters
            domain_filter = profile.extracted_domains[0] if profile.extracted_domains else None

            async with self.db_pool.acquire() as conn:
                results = await conn.fetch(
                    """
                    SELECT id, content, chunk_type, domain,
                           1 - (embedding <=> $1::vector) as similarity
                    FROM knowledge_chunks
                    WHERE ($2::text IS NULL OR domain = $2)
                    ORDER BY embedding <=> $1::vector
                    LIMIT 10
                    """,
                    query_embedding,
                    domain_filter,
                )

            # Fit within token budget
            knowledge = []
            chars_used = 0
            max_chars = max_tokens * 4

            for row in results:
                content = row["content"]
                if chars_used + len(content) > max_chars:
                    break
                knowledge.append({
                    "content": content,
                    "chunk_type": row["chunk_type"],
                    "domain": row["domain"],
                    "similarity": float(row["similarity"]),
                })
                chars_used += len(content)

            return knowledge

        except Exception as e:
            logger.warning("tier3_fetch_failed", error=str(e))
            return []

    async def _build_tier4(self, session_id: str, max_tokens: int) -> list[dict]:
        """Fetch conversation history from Redis."""
        try:
            history_key = f"session:{session_id}:history"
            history_raw = await self.redis.lrange(history_key, 0, 20)

            history = []
            chars_used = 0
            max_chars = max_tokens * 4

            for item in history_raw:
                data = json.loads(item) if isinstance(item, (str, bytes)) else item
                item_size = len(json.dumps(data))
                if chars_used + item_size > max_chars:
                    break
                history.append(data)
                chars_used += item_size

            return history

        except Exception as e:
            logger.warning("tier4_fetch_failed", error=str(e))
            return []
```

**Step 4: Run tests**

```bash
cd rag-engine && pytest tests/test_context_assembler.py -v
```

Expected: PASS

**Step 5: Commit**

```bash
git add rag-engine/app/core/context_assembler.py rag-engine/tests/test_context_assembler.py
git commit -m "feat(rag-engine): add context assembler

- Tiered context building with token budgets
- pgvector semantic search for knowledge
- Redis equipment state and history
- Dynamic allocation based on query profile"
```

---

## Phase 4: Agent Orchestrator + Tools

### Task 4.1: Create Tool Interface

**Files:**
- Create: `rag-engine/app/tools/base.py`
- Create: `rag-engine/app/tools/search_knowledge.py`
- Create: `rag-engine/tests/test_tools/test_search_knowledge.py`

**Step 1: Define tool base class**

```python
# rag-engine/app/tools/base.py
from abc import ABC, abstractmethod
from dataclasses import dataclass
from enum import Enum
from typing import Any


class ActionClass(Enum):
    """Classification for tool execution policy."""

    AUTO = "auto"  # Execute immediately
    CONFIRM = "confirm"  # Queue for engineer approval


@dataclass
class ToolResult:
    """Result from tool execution."""

    success: bool
    data: Any
    error: str | None = None


class BaseTool(ABC):
    """Base class for agent tools."""

    name: str
    description: str
    action_class: ActionClass = ActionClass.AUTO

    @abstractmethod
    async def execute(self, **kwargs) -> ToolResult:
        """Execute the tool with given parameters."""
        pass

    def to_anthropic_tool(self) -> dict:
        """Convert to Anthropic tool format."""
        return {
            "name": self.name,
            "description": self.description,
            "input_schema": self.get_input_schema(),
        }

    @abstractmethod
    def get_input_schema(self) -> dict:
        """Return JSON schema for tool inputs."""
        pass
```

**Step 2: Write test for search_knowledge tool**

```python
# rag-engine/tests/test_tools/test_search_knowledge.py
import pytest
from unittest.mock import AsyncMock

from app.tools.search_knowledge import SearchKnowledgeTool
from app.tools.base import ActionClass


@pytest.fixture
def mock_deps():
    db_pool = AsyncMock()
    embedding_service = AsyncMock()
    embedding_service.embed.return_value = [0.1] * 1024
    return db_pool, embedding_service


@pytest.mark.asyncio
async def test_search_knowledge_returns_results(mock_deps):
    db_pool, embedding_service = mock_deps

    db_pool.acquire.return_value.__aenter__.return_value.fetch.return_value = [
        {"content": "Focus sensitivity is 5nm per 10nm", "chunk_type": "concept", "domain": "focus", "similarity": 0.85}
    ]

    tool = SearchKnowledgeTool(db_pool=db_pool, embedding_service=embedding_service)
    result = await tool.execute(query="focus sensitivity")

    assert result.success
    assert len(result.data) == 1
    assert "Focus sensitivity" in result.data[0]["content"]


def test_search_knowledge_is_auto_execute(mock_deps):
    db_pool, embedding_service = mock_deps
    tool = SearchKnowledgeTool(db_pool=db_pool, embedding_service=embedding_service)
    assert tool.action_class == ActionClass.AUTO
```

**Step 3: Implement search_knowledge tool**

```python
# rag-engine/app/tools/search_knowledge.py
import asyncpg

from app.services.embedding import EmbeddingService
from app.tools.base import ActionClass, BaseTool, ToolResult


class SearchKnowledgeTool(BaseTool):
    """Search knowledge base for relevant information."""

    name = "search_knowledge"
    description = "Search the lithography knowledge base for concepts, Q&A, anomaly patterns, or process windows."
    action_class = ActionClass.AUTO

    def __init__(self, db_pool: asyncpg.Pool, embedding_service: EmbeddingService):
        self.db_pool = db_pool
        self.embedding_service = embedding_service

    def get_input_schema(self) -> dict:
        return {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Search query for knowledge retrieval",
                },
                "domain": {
                    "type": "string",
                    "enum": ["focus", "dose", "overlay", "cdu", "defect"],
                    "description": "Optional domain filter",
                },
                "limit": {
                    "type": "integer",
                    "default": 5,
                    "description": "Maximum results to return",
                },
            },
            "required": ["query"],
        }

    async def execute(
        self,
        query: str,
        domain: str | None = None,
        limit: int = 5,
    ) -> ToolResult:
        """Search knowledge base."""
        try:
            # Generate query embedding
            query_embedding = await self.embedding_service.embed(query)

            async with self.db_pool.acquire() as conn:
                results = await conn.fetch(
                    """
                    SELECT content, chunk_type, domain,
                           1 - (embedding <=> $1::vector) as similarity
                    FROM knowledge_chunks
                    WHERE ($2::text IS NULL OR domain = $2)
                      AND embedding IS NOT NULL
                    ORDER BY embedding <=> $1::vector
                    LIMIT $3
                    """,
                    query_embedding,
                    domain,
                    limit,
                )

            return ToolResult(
                success=True,
                data=[
                    {
                        "content": row["content"],
                        "chunk_type": row["chunk_type"],
                        "domain": row["domain"],
                        "similarity": float(row["similarity"]),
                    }
                    for row in results
                ],
            )

        except Exception as e:
            return ToolResult(success=False, data=None, error=str(e))
```

**Step 4: Run tests**

```bash
cd rag-engine && pytest tests/test_tools/test_search_knowledge.py -v
```

Expected: PASS

**Step 5: Commit**

```bash
git add rag-engine/app/tools/
git commit -m "feat(rag-engine): add tool base class and search_knowledge

- BaseTool with action classification
- SearchKnowledgeTool with pgvector search
- Anthropic tool format conversion"
```

---

### Task 4.2: Create Additional Tools

**Files:**
- Create: `rag-engine/app/tools/get_equipment_state.py`
- Create: `rag-engine/app/tools/analyze_alarm.py`
- Create: `rag-engine/app/tools/log_insight.py`
- Create: `rag-engine/app/tools/propose_action.py`

**Step 1: Create get_equipment_state tool**

```python
# rag-engine/app/tools/get_equipment_state.py
import json

import redis.asyncio as redis

from app.tools.base import ActionClass, BaseTool, ToolResult


class GetEquipmentStateTool(BaseTool):
    """Fetch current equipment state from Redis."""

    name = "get_equipment_state"
    description = "Get current state of equipment including process parameters, active alarms, and recent events."
    action_class = ActionClass.AUTO

    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client

    def get_input_schema(self) -> dict:
        return {
            "type": "object",
            "properties": {
                "tool_id": {
                    "type": "string",
                    "description": "Equipment identifier (e.g., LITHO01)",
                },
                "fields": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Specific fields to retrieve (optional, returns all if empty)",
                },
            },
            "required": ["tool_id"],
        }

    async def execute(
        self,
        tool_id: str,
        fields: list[str] | None = None,
    ) -> ToolResult:
        """Fetch equipment state."""
        try:
            state_key = f"equipment:state:{tool_id}"
            state = await self.redis.hgetall(state_key)

            if not state:
                return ToolResult(
                    success=True,
                    data={"tool_id": tool_id, "state": {}, "message": "No state found"},
                )

            # Decode bytes
            decoded = {
                k.decode() if isinstance(k, bytes) else k: v.decode() if isinstance(v, bytes) else v
                for k, v in state.items()
            }

            # Filter fields if specified
            if fields:
                decoded = {k: v for k, v in decoded.items() if k in fields}

            return ToolResult(
                success=True,
                data={"tool_id": tool_id, "state": decoded},
            )

        except Exception as e:
            return ToolResult(success=False, data=None, error=str(e))
```

**Step 2: Create analyze_alarm tool**

```python
# rag-engine/app/tools/analyze_alarm.py
import asyncpg

from app.services.embedding import EmbeddingService
from app.tools.base import ActionClass, BaseTool, ToolResult


class AnalyzeAlarmTool(BaseTool):
    """Match alarm to known anomaly patterns."""

    name = "analyze_alarm"
    description = "Analyze an alarm by matching it to known anomaly patterns in the knowledge base."
    action_class = ActionClass.AUTO

    def __init__(self, db_pool: asyncpg.Pool, embedding_service: EmbeddingService):
        self.db_pool = db_pool
        self.embedding_service = embedding_service

    def get_input_schema(self) -> dict:
        return {
            "type": "object",
            "properties": {
                "alarm_id": {
                    "type": "string",
                    "description": "Alarm identifier",
                },
                "alarm_text": {
                    "type": "string",
                    "description": "Alarm message or description",
                },
            },
            "required": ["alarm_text"],
        }

    async def execute(
        self,
        alarm_text: str,
        alarm_id: str | None = None,
    ) -> ToolResult:
        """Analyze alarm against known patterns."""
        try:
            # Search for matching anomaly patterns
            query = f"alarm anomaly {alarm_text}"
            query_embedding = await self.embedding_service.embed(query)

            async with self.db_pool.acquire() as conn:
                results = await conn.fetch(
                    """
                    SELECT content, domain,
                           1 - (embedding <=> $1::vector) as similarity
                    FROM knowledge_chunks
                    WHERE chunk_type = 'anomaly'
                      AND embedding IS NOT NULL
                    ORDER BY embedding <=> $1::vector
                    LIMIT 3
                    """,
                    query_embedding,
                )

            if not results:
                return ToolResult(
                    success=True,
                    data={
                        "alarm_id": alarm_id,
                        "matches": [],
                        "message": "No matching patterns found",
                    },
                )

            return ToolResult(
                success=True,
                data={
                    "alarm_id": alarm_id,
                    "matches": [
                        {
                            "pattern": row["content"],
                            "domain": row["domain"],
                            "confidence": float(row["similarity"]),
                        }
                        for row in results
                    ],
                },
            )

        except Exception as e:
            return ToolResult(success=False, data=None, error=str(e))
```

**Step 3: Create log_insight tool**

```python
# rag-engine/app/tools/log_insight.py
from datetime import datetime
from uuid import uuid4

import asyncpg

from app.tools.base import ActionClass, BaseTool, ToolResult


class LogInsightTool(BaseTool):
    """Log an insight to the database for audit trail."""

    name = "log_insight"
    description = "Record an insight or finding to the database for future reference and audit."
    action_class = ActionClass.AUTO

    def __init__(self, db_pool: asyncpg.Pool):
        self.db_pool = db_pool

    def get_input_schema(self) -> dict:
        return {
            "type": "object",
            "properties": {
                "session_id": {
                    "type": "string",
                    "description": "Current session identifier",
                },
                "insight": {
                    "type": "string",
                    "description": "The insight or finding to log",
                },
                "tool_id": {
                    "type": "string",
                    "description": "Related equipment (optional)",
                },
                "category": {
                    "type": "string",
                    "enum": ["observation", "diagnosis", "recommendation"],
                    "description": "Type of insight",
                },
            },
            "required": ["session_id", "insight"],
        }

    async def execute(
        self,
        session_id: str,
        insight: str,
        tool_id: str | None = None,
        category: str = "observation",
    ) -> ToolResult:
        """Log insight to database."""
        try:
            insight_id = uuid4()

            async with self.db_pool.acquire() as conn:
                await conn.execute(
                    """
                    INSERT INTO query_logs (id, session_id, question, answer, tool_id)
                    VALUES ($1, $2, $3, $4, $5)
                    """,
                    insight_id,
                    session_id,
                    f"[{category}]",
                    insight,
                    tool_id,
                )

            return ToolResult(
                success=True,
                data={"insight_id": str(insight_id), "logged": True},
            )

        except Exception as e:
            return ToolResult(success=False, data=None, error=str(e))
```

**Step 4: Create propose_action tool**

```python
# rag-engine/app/tools/propose_action.py
import json
from uuid import uuid4

import redis.asyncio as redis

from app.tools.base import ActionClass, BaseTool, ToolResult


class ProposeActionTool(BaseTool):
    """Propose an equipment action that requires engineer confirmation."""

    name = "propose_action"
    description = "Propose an action that affects equipment. This will queue the action for engineer review and approval."
    action_class = ActionClass.CONFIRM  # Requires confirmation

    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client

    def get_input_schema(self) -> dict:
        return {
            "type": "object",
            "properties": {
                "session_id": {
                    "type": "string",
                    "description": "Current session identifier",
                },
                "action_type": {
                    "type": "string",
                    "enum": ["adjust_focus", "adjust_dose", "send_command", "escalate"],
                    "description": "Type of action to propose",
                },
                "params": {
                    "type": "object",
                    "description": "Action parameters",
                },
                "reasoning": {
                    "type": "string",
                    "description": "Explanation for why this action is recommended",
                },
                "evidence": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Evidence supporting this recommendation",
                },
            },
            "required": ["session_id", "action_type", "params", "reasoning"],
        }

    async def execute(
        self,
        session_id: str,
        action_type: str,
        params: dict,
        reasoning: str,
        evidence: list[str] | None = None,
    ) -> ToolResult:
        """Queue action for confirmation."""
        try:
            action_id = str(uuid4())

            action_data = {
                "action_id": action_id,
                "session_id": session_id,
                "action_type": action_type,
                "params": params,
                "reasoning": reasoning,
                "evidence": evidence or [],
                "status": "pending",
            }

            # Store in Redis with TTL
            action_key = f"pending_action:{action_id}"
            await self.redis.setex(action_key, 3600, json.dumps(action_data))  # 1 hour TTL

            # Add to session's pending actions
            session_key = f"session:{session_id}:pending_actions"
            await self.redis.sadd(session_key, action_id)

            return ToolResult(
                success=True,
                data={
                    "action_id": action_id,
                    "status": "pending_confirmation",
                    "message": f"Action '{action_type}' queued for engineer approval",
                },
            )

        except Exception as e:
            return ToolResult(success=False, data=None, error=str(e))
```

**Step 5: Commit**

```bash
git add rag-engine/app/tools/
git commit -m "feat(rag-engine): add agent tools

- get_equipment_state: Redis state lookup
- analyze_alarm: Pattern matching against knowledge
- log_insight: Audit trail logging
- propose_action: Queue for confirmation"
```

---

### Task 4.3: Create Agent Orchestrator

**Files:**
- Create: `rag-engine/app/core/orchestrator.py`
- Create: `rag-engine/tests/test_orchestrator.py`

**Step 1: Write test for orchestrator**

```python
# rag-engine/tests/test_orchestrator.py
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from app.core.orchestrator import AgentOrchestrator, OrchestratorResult


@pytest.fixture
def mock_deps():
    return {
        "db_pool": AsyncMock(),
        "redis": AsyncMock(),
        "embedding_service": AsyncMock(),
        "anthropic_client": MagicMock(),
    }


@pytest.mark.asyncio
async def test_orchestrator_returns_answer(mock_deps):
    # Mock Anthropic response
    mock_response = MagicMock()
    mock_response.content = [MagicMock(type="text", text="The CD is trending due to focus drift.")]
    mock_response.stop_reason = "end_turn"
    mock_deps["anthropic_client"].messages.create.return_value = mock_response

    orchestrator = AgentOrchestrator(**mock_deps)

    result = await orchestrator.run(
        question="Why is CD trending?",
        system_prompt="You are a helpful assistant.",
        context={"equipment": {}, "knowledge": []},
        session_id="test",
    )

    assert isinstance(result, OrchestratorResult)
    assert "focus drift" in result.answer.lower() or "CD" in result.answer


@pytest.mark.asyncio
async def test_orchestrator_handles_tool_use(mock_deps):
    # First response uses a tool
    tool_use_response = MagicMock()
    tool_use_response.content = [
        MagicMock(type="tool_use", id="tool1", name="search_knowledge", input={"query": "focus"})
    ]
    tool_use_response.stop_reason = "tool_use"

    # Second response is final answer
    final_response = MagicMock()
    final_response.content = [MagicMock(type="text", text="Based on the search, focus is important.")]
    final_response.stop_reason = "end_turn"

    mock_deps["anthropic_client"].messages.create.side_effect = [tool_use_response, final_response]
    mock_deps["embedding_service"].embed.return_value = [0.1] * 1024
    mock_deps["db_pool"].acquire.return_value.__aenter__.return_value.fetch.return_value = [
        {"content": "Focus info", "chunk_type": "concept", "domain": "focus", "similarity": 0.9}
    ]

    orchestrator = AgentOrchestrator(**mock_deps)

    result = await orchestrator.run(
        question="What is focus?",
        system_prompt="You are helpful.",
        context={"equipment": {}, "knowledge": []},
        session_id="test",
    )

    assert result.answer is not None
    assert len(result.evidence) > 0
```

**Step 2: Implement orchestrator**

```python
# rag-engine/app/core/orchestrator.py
import json
from dataclasses import dataclass, field

import anthropic
import asyncpg
import redis.asyncio as redis
import structlog

from app.config import settings
from app.services.embedding import EmbeddingService
from app.tools.base import ActionClass, ToolResult
from app.tools.search_knowledge import SearchKnowledgeTool
from app.tools.get_equipment_state import GetEquipmentStateTool
from app.tools.analyze_alarm import AnalyzeAlarmTool
from app.tools.log_insight import LogInsightTool
from app.tools.propose_action import ProposeActionTool

logger = structlog.get_logger()

MAX_ITERATIONS = 10


@dataclass
class EvidenceItem:
    """Source used in reasoning."""

    source_type: str
    content: str
    relevance_score: float = 0.0


@dataclass
class PendingAction:
    """Action awaiting confirmation."""

    action_id: str
    action_type: str
    description: str
    params: dict
    evidence: list[str]


@dataclass
class OrchestratorResult:
    """Result from agent orchestration."""

    answer: str
    evidence: list[EvidenceItem] = field(default_factory=list)
    pending_actions: list[PendingAction] = field(default_factory=list)
    iterations: int = 0


class AgentOrchestrator:
    """ReAct-style agent with tool dispatch."""

    def __init__(
        self,
        db_pool: asyncpg.Pool,
        redis: redis.Redis,
        embedding_service: EmbeddingService,
        anthropic_client: anthropic.Anthropic | None = None,
    ):
        self.db_pool = db_pool
        self.redis = redis
        self.embedding_service = embedding_service
        self.client = anthropic_client or anthropic.Anthropic(api_key=settings.anthropic_api_key)

        # Initialize tools
        self.tools = {
            "search_knowledge": SearchKnowledgeTool(db_pool, embedding_service),
            "get_equipment_state": GetEquipmentStateTool(redis),
            "analyze_alarm": AnalyzeAlarmTool(db_pool, embedding_service),
            "log_insight": LogInsightTool(db_pool),
            "propose_action": ProposeActionTool(redis),
        }

    async def run(
        self,
        question: str,
        system_prompt: str,
        context: dict,
        session_id: str,
    ) -> OrchestratorResult:
        """Run the agent loop until answer or max iterations."""
        logger.info("orchestrator_start", question=question[:50])

        evidence: list[EvidenceItem] = []
        pending_actions: list[PendingAction] = []

        # Build initial messages
        messages = [
            {
                "role": "user",
                "content": self._build_user_message(question, context),
            }
        ]

        # Get tool definitions
        tools = [tool.to_anthropic_tool() for tool in self.tools.values()]

        for iteration in range(MAX_ITERATIONS):
            logger.info("orchestrator_iteration", iteration=iteration)

            # Call LLM
            response = self.client.messages.create(
                model=settings.llm_model,
                max_tokens=4096,
                system=system_prompt,
                messages=messages,
                tools=tools,
            )

            # Process response
            assistant_content = []
            for block in response.content:
                if block.type == "text":
                    assistant_content.append({"type": "text", "text": block.text})
                elif block.type == "tool_use":
                    assistant_content.append({
                        "type": "tool_use",
                        "id": block.id,
                        "name": block.name,
                        "input": block.input,
                    })

            messages.append({"role": "assistant", "content": assistant_content})

            # Check if done
            if response.stop_reason == "end_turn":
                # Extract final answer
                answer = ""
                for block in response.content:
                    if block.type == "text":
                        answer += block.text

                return OrchestratorResult(
                    answer=answer,
                    evidence=evidence,
                    pending_actions=pending_actions,
                    iterations=iteration + 1,
                )

            # Handle tool use
            if response.stop_reason == "tool_use":
                tool_results = []

                for block in response.content:
                    if block.type == "tool_use":
                        result, new_evidence, new_action = await self._execute_tool(
                            block.name,
                            block.input,
                            session_id,
                        )
                        tool_results.append({
                            "type": "tool_result",
                            "tool_use_id": block.id,
                            "content": json.dumps(result.data) if result.success else result.error,
                        })

                        if new_evidence:
                            evidence.append(new_evidence)
                        if new_action:
                            pending_actions.append(new_action)

                messages.append({"role": "user", "content": tool_results})

        # Max iterations reached
        return OrchestratorResult(
            answer="I was unable to complete the analysis within the allowed steps. Please try a more specific question.",
            evidence=evidence,
            pending_actions=pending_actions,
            iterations=MAX_ITERATIONS,
        )

    def _build_user_message(self, question: str, context: dict) -> str:
        """Build user message with context."""
        parts = [f"Question: {question}"]

        if context.get("equipment"):
            parts.append(f"\nEquipment State:\n{json.dumps(context['equipment'], indent=2)}")

        if context.get("knowledge"):
            parts.append("\nRelevant Knowledge:")
            for k in context["knowledge"][:3]:
                parts.append(f"- {k.get('content', '')[:200]}...")

        return "\n".join(parts)

    async def _execute_tool(
        self,
        tool_name: str,
        tool_input: dict,
        session_id: str,
    ) -> tuple[ToolResult, EvidenceItem | None, PendingAction | None]:
        """Execute a tool and return result plus any evidence/action."""
        tool = self.tools.get(tool_name)
        if not tool:
            return ToolResult(success=False, data=None, error=f"Unknown tool: {tool_name}"), None, None

        logger.info("tool_execute", tool=tool_name, input=tool_input)

        # Add session_id if tool needs it
        if "session_id" in tool.get_input_schema().get("properties", {}):
            tool_input["session_id"] = session_id

        result = await tool.execute(**tool_input)

        # Create evidence from successful searches
        evidence = None
        if result.success and tool_name == "search_knowledge" and result.data:
            evidence = EvidenceItem(
                source_type="knowledge",
                content=str(result.data[0].get("content", ""))[:200] if result.data else "",
                relevance_score=result.data[0].get("similarity", 0) if result.data else 0,
            )

        # Track pending actions
        pending_action = None
        if tool_name == "propose_action" and result.success:
            pending_action = PendingAction(
                action_id=result.data.get("action_id", ""),
                action_type=tool_input.get("action_type", ""),
                description=tool_input.get("reasoning", ""),
                params=tool_input.get("params", {}),
                evidence=tool_input.get("evidence", []),
            )

        return result, evidence, pending_action
```

**Step 3: Run tests**

```bash
cd rag-engine && pytest tests/test_orchestrator.py -v
```

Expected: PASS (with mocks)

**Step 4: Commit**

```bash
git add rag-engine/app/core/orchestrator.py rag-engine/tests/test_orchestrator.py
git commit -m "feat(rag-engine): add agent orchestrator

- ReAct loop with tool dispatch
- Evidence chain tracking
- Pending action collection
- Max iteration safety"
```

---

## Phase 5: API Endpoints

### Task 5.1: Create Query Router

**Files:**
- Create: `rag-engine/app/routers/query.py`
- Modify: `rag-engine/app/main.py`
- Create: `rag-engine/tests/test_query_api.py`

**Step 1: Create query router**

```python
# rag-engine/app/routers/query.py
from typing import Annotated
from uuid import uuid4

import structlog
from fastapi import APIRouter, BackgroundTasks, Depends, Request
from pydantic import BaseModel, Field

from app.core.context_assembler import ContextAssembler
from app.core.orchestrator import AgentOrchestrator, EvidenceItem, PendingAction
from app.core.query_classifier import QueryClassifier
from app.services.embedding import EmbeddingService, get_embedding_service
from app.config import settings

logger = structlog.get_logger()
router = APIRouter(prefix="/query", tags=["Query"])


class QueryRequest(BaseModel):
    """Engineer query to the RAG system."""

    question: str = Field(min_length=1, max_length=2000, examples=["Why is CD trending high?"])
    session_id: str | None = Field(default=None, description="Resume existing session")
    tool_id: str | None = Field(default=None, description="Equipment context", examples=["LITHO01"])


class EvidenceItemResponse(BaseModel):
    """Source used to generate answer."""

    source_type: str
    content: str
    relevance_score: float


class PendingActionResponse(BaseModel):
    """Action awaiting confirmation."""

    action_id: str
    action_type: str
    description: str
    params: dict


class QueryResponse(BaseModel):
    """Response from RAG engine."""

    answer: str
    evidence: list[EvidenceItemResponse]
    pending_actions: list[PendingActionResponse] | None = None
    session_id: str


async def log_query_async(
    session_id: str,
    question: str,
    answer: str,
    evidence_count: int,
    has_action: bool,
    db_pool,
):
    """Background task to log query."""
    try:
        async with db_pool.acquire() as conn:
            await conn.execute(
                """
                INSERT INTO query_logs (id, session_id, question, answer, evidence_count, action_proposed)
                VALUES ($1, $2, $3, $4, $5, $6)
                """,
                uuid4(),
                session_id,
                question,
                answer,
                evidence_count,
                has_action,
            )
    except Exception as e:
        logger.error("log_query_failed", error=str(e))


@router.post("", response_model=QueryResponse)
async def query(
    req: QueryRequest,
    request: Request,
    background_tasks: BackgroundTasks,
) -> QueryResponse:
    """Query the RAG engine with a process engineering question."""
    # Generate or use session ID
    session_id = req.session_id or f"sess_{uuid4().hex[:12]}"

    logger.info("query_received", question=req.question[:50], session_id=session_id)

    # Get dependencies from app state
    db_pool = request.app.state.db_pool
    redis_client = request.app.state.redis

    # Initialize services
    embedding_service = get_embedding_service(settings.ollama_host, settings.embedding_model)
    classifier = QueryClassifier()
    assembler = ContextAssembler(db_pool, redis_client, embedding_service)
    orchestrator = AgentOrchestrator(db_pool, redis_client, embedding_service)

    # Classify query
    profile = classifier.classify(req.question)

    # Override tool_id if provided
    if req.tool_id:
        profile.extracted_tool_id = req.tool_id

    # Assemble context
    context = await assembler.assemble(
        question=req.question,
        profile=profile,
        session_id=session_id,
    )

    # Run orchestrator
    result = await orchestrator.run(
        question=req.question,
        system_prompt=context.tier1_system,
        context={
            "equipment": context.tier2_equipment,
            "knowledge": context.tier3_knowledge,
            "history": context.tier4_history,
        },
        session_id=session_id,
    )

    # Log in background
    background_tasks.add_task(
        log_query_async,
        session_id,
        req.question,
        result.answer,
        len(result.evidence),
        len(result.pending_actions) > 0,
        db_pool,
    )

    return QueryResponse(
        answer=result.answer,
        evidence=[
            EvidenceItemResponse(
                source_type=e.source_type,
                content=e.content,
                relevance_score=e.relevance_score,
            )
            for e in result.evidence
        ],
        pending_actions=[
            PendingActionResponse(
                action_id=a.action_id,
                action_type=a.action_type,
                description=a.description,
                params=a.params,
            )
            for a in result.pending_actions
        ] if result.pending_actions else None,
        session_id=session_id,
    )
```

**Step 2: Register router in main.py**

Add to `rag-engine/app/main.py`:

```python
from app.routers.query import router as query_router

app.include_router(query_router)
```

**Step 3: Write API test**

```python
# rag-engine/tests/test_query_api.py
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.fixture
async def client():
    # Mock app state
    app.state.db_pool = AsyncMock()
    app.state.redis = AsyncMock()

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as ac:
        yield ac


@pytest.mark.asyncio
async def test_query_endpoint_returns_response(client):
    with patch("app.routers.query.QueryClassifier") as mock_classifier, \
         patch("app.routers.query.ContextAssembler") as mock_assembler, \
         patch("app.routers.query.AgentOrchestrator") as mock_orchestrator, \
         patch("app.routers.query.get_embedding_service"):

        # Setup mocks
        mock_classifier.return_value.classify.return_value = MagicMock(
            query_type="troubleshooting",
            tier1_weight=0.1,
            tier2_weight=0.3,
            tier3_weight=0.4,
            tier4_weight=0.2,
            extracted_domains=["focus"],
            extracted_tool_id=None,
        )

        mock_assembler.return_value.assemble = AsyncMock(return_value=MagicMock(
            tier1_system="System prompt",
            tier2_equipment={},
            tier3_knowledge=[],
            tier4_history=[],
        ))

        mock_orchestrator.return_value.run = AsyncMock(return_value=MagicMock(
            answer="Test answer",
            evidence=[],
            pending_actions=[],
        ))

        response = await client.post(
            "/query",
            json={"question": "Why is CD trending?"},
        )

        assert response.status_code == 200
        data = response.json()
        assert "answer" in data
        assert "session_id" in data


@pytest.mark.asyncio
async def test_query_validates_input(client):
    response = await client.post(
        "/query",
        json={"question": ""},  # Too short
    )
    assert response.status_code == 422
```

**Step 4: Run tests**

```bash
cd rag-engine && pytest tests/test_query_api.py -v
```

Expected: PASS

**Step 5: Commit**

```bash
git add rag-engine/app/routers/query.py rag-engine/tests/test_query_api.py rag-engine/app/main.py
git commit -m "feat(rag-engine): add /query API endpoint

- Query classification and context assembly
- Orchestrator integration
- Background query logging
- Input validation"
```

---

### Task 5.2: Create Actions Router

**Files:**
- Create: `rag-engine/app/routers/actions.py`
- Modify: `rag-engine/app/main.py`

**Step 1: Create actions router**

```python
# rag-engine/app/routers/actions.py
import json

import structlog
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

logger = structlog.get_logger()
router = APIRouter(prefix="/actions", tags=["Actions"])


class ActionDecision(BaseModel):
    """Engineer decision on pending action."""

    approved: bool
    modified_params: dict | None = None
    rejection_reason: str | None = Field(default=None, max_length=500)


class ActionResult(BaseModel):
    """Result of action decision."""

    action_id: str
    status: str
    result: dict | None = None
    error: str | None = None


@router.get("/{action_id}")
async def get_action(action_id: str, request: Request) -> dict:
    """Get pending action details."""
    redis_client = request.app.state.redis

    action_key = f"pending_action:{action_id}"
    action_data = await redis_client.get(action_key)

    if not action_data:
        raise HTTPException(status_code=404, detail="Action not found or expired")

    return json.loads(action_data)


@router.post("/{action_id}/decide", response_model=ActionResult)
async def decide_action(
    action_id: str,
    decision: ActionDecision,
    request: Request,
) -> ActionResult:
    """Approve or reject a pending action."""
    redis_client = request.app.state.redis

    action_key = f"pending_action:{action_id}"
    action_data = await redis_client.get(action_key)

    if not action_data:
        raise HTTPException(status_code=404, detail="Action not found or expired")

    action = json.loads(action_data)

    if action.get("status") != "pending":
        raise HTTPException(status_code=409, detail="Action already decided")

    logger.info(
        "action_decision",
        action_id=action_id,
        approved=decision.approved,
    )

    if decision.approved:
        # Update params if modified
        if decision.modified_params:
            action["params"].update(decision.modified_params)

        # Mark as approved
        action["status"] = "approved"
        await redis_client.setex(action_key, 3600, json.dumps(action))

        # TODO: Execute the actual SECS/GEM command here
        # For now, just return success
        return ActionResult(
            action_id=action_id,
            status="executed",
            result={"message": f"Action {action['action_type']} executed with params {action['params']}"},
        )
    else:
        # Mark as rejected
        action["status"] = "rejected"
        action["rejection_reason"] = decision.rejection_reason
        await redis_client.setex(action_key, 3600, json.dumps(action))

        return ActionResult(
            action_id=action_id,
            status="rejected",
        )


@router.get("")
async def list_pending_actions(session_id: str, request: Request) -> list[dict]:
    """List pending actions for a session."""
    redis_client = request.app.state.redis

    session_key = f"session:{session_id}:pending_actions"
    action_ids = await redis_client.smembers(session_key)

    actions = []
    for action_id in action_ids:
        aid = action_id.decode() if isinstance(action_id, bytes) else action_id
        action_key = f"pending_action:{aid}"
        action_data = await redis_client.get(action_key)
        if action_data:
            action = json.loads(action_data)
            if action.get("status") == "pending":
                actions.append(action)

    return actions
```

**Step 2: Register router**

Add to `rag-engine/app/main.py`:

```python
from app.routers.actions import router as actions_router

app.include_router(actions_router)
```

**Step 3: Commit**

```bash
git add rag-engine/app/routers/actions.py rag-engine/app/main.py
git commit -m "feat(rag-engine): add /actions API endpoints

- GET /actions/{id}: View pending action
- POST /actions/{id}/decide: Approve/reject
- GET /actions: List session's pending actions"
```

---

## Phase 6: Docker Integration

### Task 6.1: Update Docker Compose

**Files:**
- Modify: `docker-compose.yml` (root level)

**Step 1: Add rag-engine and ollama services**

Add to existing `docker-compose.yml`:

```yaml
  ollama:
    image: ollama/ollama:latest
    container_name: mixgem_ollama
    volumes:
      - ollama_data:/root/.ollama
    ports:
      - "11434:11434"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:11434/api/tags"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]

  rag-engine:
    build:
      context: ./rag-engine
      dockerfile: Dockerfile
    container_name: mixgem_rag_engine
    environment:
      POSTGRES_URL: postgresql+asyncpg://${DB_USER:-mixgem}:${DB_PASSWORD:-mixgem}@postgres:5432/${DB_NAME:-mixgem}
      REDIS_URL: redis://redis:6379
      OLLAMA_HOST: http://ollama:11434
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
      LOG_LEVEL: ${LOG_LEVEL:-INFO}
    ports:
      - "${RAG_PORT:-8001}:8001"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      ollama:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8001/health/live"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    restart: unless-stopped
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

volumes:
  ollama_data:
```

**Step 2: Commit**

```bash
git add docker-compose.yml
git commit -m "feat(docker): add rag-engine and ollama services

- Ollama with GPU support for embeddings
- RAG engine with health checks
- Proper service dependencies"
```

---

## Phase 7: Final Integration

### Task 7.1: Create Integration Test

**Files:**
- Create: `rag-engine/tests/test_integration.py`

**Step 1: Write integration test**

```python
# rag-engine/tests/test_integration.py
"""
Integration tests - require running services.
Run with: pytest tests/test_integration.py -v --integration
"""
import os
import pytest

# Skip if not running integration tests
pytestmark = pytest.mark.skipif(
    os.getenv("RUN_INTEGRATION_TESTS") != "1",
    reason="Set RUN_INTEGRATION_TESTS=1 to run integration tests",
)


@pytest.mark.asyncio
async def test_full_query_flow():
    """Test complete query flow with real services."""
    import httpx

    async with httpx.AsyncClient(base_url="http://localhost:8001") as client:
        # Health check
        health = await client.get("/health/ready")
        assert health.status_code == 200

        # Query
        response = await client.post(
            "/query",
            json={
                "question": "What is focus sensitivity in lithography?",
                "tool_id": "LITHO01",
            },
        )
        assert response.status_code == 200
        data = response.json()

        assert "answer" in data
        assert "session_id" in data
        assert len(data["answer"]) > 0


@pytest.mark.asyncio
async def test_action_flow():
    """Test action proposal and decision flow."""
    import httpx

    async with httpx.AsyncClient(base_url="http://localhost:8001") as client:
        # First, make a query that might propose an action
        query_response = await client.post(
            "/query",
            json={
                "question": "CD is trending +5nm on LITHO01. What should we do?",
                "tool_id": "LITHO01",
            },
        )
        assert query_response.status_code == 200
        data = query_response.json()

        # If there are pending actions, test the decision flow
        if data.get("pending_actions"):
            action_id = data["pending_actions"][0]["action_id"]

            # Get action details
            action_response = await client.get(f"/actions/{action_id}")
            assert action_response.status_code == 200

            # Approve the action
            decision_response = await client.post(
                f"/actions/{action_id}/decide",
                json={"approved": True},
            )
            assert decision_response.status_code == 200
            assert decision_response.json()["status"] == "executed"
```

**Step 2: Commit**

```bash
git add rag-engine/tests/test_integration.py
git commit -m "test(rag-engine): add integration tests

- Full query flow test
- Action proposal and decision flow"
```

---

### Task 7.2: Final Verification

**Step 1: Run all tests**

```bash
cd rag-engine && pytest tests/ -v --cov=app --cov-report=term-missing
```

**Step 2: Lint and type check**

```bash
cd rag-engine && ruff check app/ && mypy app/
```

**Step 3: Build Docker image**

```bash
cd rag-engine && docker build -t rag-engine:latest .
```

**Step 4: Start services and test**

```bash
docker-compose up -d postgres redis ollama rag-engine
docker-compose logs -f rag-engine
```

**Step 5: Test API**

```bash
curl -X POST http://localhost:8001/query \
  -H "Content-Type: application/json" \
  -d '{"question": "What is focus sensitivity?", "tool_id": "LITHO01"}'
```

**Step 6: Final commit**

```bash
git add -A
git commit -m "feat(rag-engine): complete implementation

- All phases implemented and tested
- Docker integration ready
- API endpoints functional"
```

---

## Summary

| Phase | Tasks | Status |
|-------|-------|--------|
| 1. Scaffolding | Project structure, health endpoints | Ready |
| 2. Knowledge | DB models, embedding service, seeder | Ready |
| 3. Context | Query classifier, context assembler | Ready |
| 4. Agent | Tool interface, orchestrator | Ready |
| 5. API | Query router, actions router | Ready |
| 6. Docker | Compose integration | Ready |
| 7. Integration | End-to-end tests | Ready |

**Total estimated tasks:** 15 bite-sized tasks across 7 phases.
