# Scavenger Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Python-based knowledge base (OnOKB) with HSMS runtime for semiconductor equipment alarm/recipe data, featuring hybrid RRF search and bidirectional closed-loop execution.

**Architecture:** Local Docker stack with PostgreSQL+pgvector for storage, FastAPI for API, asyncio-based HSMS runtime wrapping secsgem, and Click CLI for admin tasks. Three-layer synthetic data generation (schema → vendor → physics).

**Tech Stack:** Python 3.12, FastAPI, SQLAlchemy 2.0 (async), asyncpg, pgvector, Click, OpenAI embeddings, secsgem, Docker Compose

**Skills Referenced:**
- @secs-gem-open-source-docs - HSMS protocol patterns
- @mastering-postgresql - pgvector setup and hybrid search
- @docker-compose-generator - Container configuration
- @asyncio-concurrency-patterns - Async patterns
- @fastapi-patterns - API design

---

## Phase 0: Project Scaffold

### Task 0.1: Initialize Project Structure

**Files:**
- Create: `scavenger/pyproject.toml`
- Create: `scavenger/src/scavenger/__init__.py`
- Create: `scavenger/src/scavenger/py.typed`
- Create: `scavenger/tests/__init__.py`

**Step 1: Create project directory**

```bash
mkdir -p scavenger/src/scavenger scavenger/tests
```

**Step 2: Write pyproject.toml**

```toml
[project]
name = "scavenger"
version = "0.1.0"
description = "Semiconductor equipment knowledge base with HSMS runtime"
requires-python = ">=3.12"
dependencies = [
    "fastapi>=0.115.0",
    "uvicorn[standard]>=0.32.0",
    "sqlalchemy[asyncio]>=2.0.36",
    "asyncpg>=0.30.0",
    "pgvector>=0.3.6",
    "alembic>=1.14.0",
    "click>=8.1.7",
    "pydantic>=2.10.0",
    "pydantic-settings>=2.6.0",
    "openai>=1.58.0",
    "secsgem>=0.2.0",
    "websockets>=14.1",
    "httpx>=0.28.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.3.0",
    "pytest-asyncio>=0.24.0",
    "pytest-cov>=6.0.0",
    "testcontainers[postgres]>=4.8.0",
    "ruff>=0.8.0",
    "mypy>=1.13.0",
]

[project.scripts]
scavenger = "scavenger.cli:main"

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.hatch.build.targets.wheel]
packages = ["src/scavenger"]

[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]

[tool.ruff]
target-version = "py312"
line-length = 100

[tool.mypy]
python_version = "3.12"
strict = true
```

**Step 3: Create package files**

```python
# src/scavenger/__init__.py
"""Scavenger: Semiconductor equipment knowledge base with HSMS runtime."""
__version__ = "0.1.0"
```

```python
# tests/__init__.py
"""Scavenger test suite."""
```

```
# src/scavenger/py.typed
# Marker file for PEP 561
```

**Step 4: Verify structure**

```bash
ls -la scavenger/
ls -la scavenger/src/scavenger/
```
Expected: Directory structure created

**Step 5: Commit**

```bash
cd scavenger && git init && git add . && git commit -m "chore: initialize project scaffold"
```

---

### Task 0.2: Docker Compose Setup

**Files:**
- Create: `scavenger/docker-compose.yml`
- Create: `scavenger/init.sql`
- Create: `scavenger/.env.example`
- Create: `scavenger/Dockerfile`

**Step 1: Write docker-compose.yml**

```yaml
# docker-compose.yml
services:
  postgres:
    image: pgvector/pgvector:pg17
    container_name: scavenger-db
    environment:
      POSTGRES_DB: onokb
      POSTGRES_USER: scavenger
      POSTGRES_PASSWORD: ${DB_PASSWORD:-scavenger_dev}
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    shm_size: '256mb'
    command: >
      postgres
      -c shared_buffers=256MB
      -c work_mem=64MB
      -c maintenance_work_mem=256MB
      -c effective_cache_size=512MB
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U scavenger -d onokb"]
      interval: 5s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  scavenger:
    build: .
    container_name: scavenger-app
    depends_on:
      postgres:
        condition: service_healthy
    ports:
      - "8000:8000"
      - "5000:5000"
    environment:
      DATABASE_URL: postgresql+asyncpg://scavenger:${DB_PASSWORD:-scavenger_dev}@postgres:5432/onokb
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      HSMS_PORT: 5000
      HSMS_DEVICE_ID: 1
    volumes:
      - ./data:/app/data
      - ./src:/app/src:ro
    restart: unless-stopped

volumes:
  pgdata:
    name: scavenger_pgdata
```

**Step 2: Write init.sql**

```sql
-- init.sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Verify extensions
SELECT extname, extversion FROM pg_extension WHERE extname IN ('vector', 'pg_trgm', 'uuid-ossp');
```

**Step 3: Write .env.example**

```bash
# .env.example
DB_PASSWORD=scavenger_dev
OPENAI_API_KEY=sk-your-key-here
```

**Step 4: Write Dockerfile**

```dockerfile
# Dockerfile
FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy project files
COPY pyproject.toml .
COPY src/ src/

# Install package
RUN pip install --no-cache-dir -e .

# Expose ports
EXPOSE 8000 5000

# Run API server
CMD ["uvicorn", "scavenger.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Step 5: Verify docker-compose syntax**

```bash
cd scavenger && docker compose config
```
Expected: Valid YAML output

**Step 6: Commit**

```bash
git add . && git commit -m "chore: add Docker Compose configuration"
```

---

### Task 0.3: Settings and Configuration

**Files:**
- Create: `scavenger/src/scavenger/config.py`
- Create: `scavenger/tests/test_config.py`

**Step 1: Write the failing test**

```python
# tests/test_config.py
import os
import pytest
from scavenger.config import Settings


def test_settings_from_env(monkeypatch):
    """Settings loads from environment variables."""
    monkeypatch.setenv("DATABASE_URL", "postgresql+asyncpg://test:test@localhost/test")
    monkeypatch.setenv("OPENAI_API_KEY", "sk-test-key")

    settings = Settings()

    assert "localhost" in str(settings.database_url)
    assert settings.openai_api_key == "sk-test-key"


def test_settings_defaults():
    """Settings has sensible defaults."""
    settings = Settings(_env_file=None)

    assert settings.hsms_port == 5000
    assert settings.hsms_device_id == 1
    assert settings.api_host == "0.0.0.0"
    assert settings.api_port == 8000
```

**Step 2: Run test to verify it fails**

```bash
cd scavenger && pip install -e ".[dev]" && pytest tests/test_config.py -v
```
Expected: FAIL with ModuleNotFoundError

**Step 3: Write minimal implementation**

```python
# src/scavenger/config.py
"""Application configuration using pydantic-settings."""
from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Database
    database_url: str = Field(
        default="postgresql+asyncpg://scavenger:scavenger_dev@localhost:5432/onokb",
        description="PostgreSQL connection URL",
    )

    # OpenAI
    openai_api_key: SecretStr = Field(
        default=SecretStr(""),
        description="OpenAI API key for embeddings",
    )

    # HSMS Runtime
    hsms_port: int = Field(default=5000, description="HSMS passive mode port")
    hsms_device_id: int = Field(default=1, description="HSMS device ID")
    hsms_t3_timeout: float = Field(default=45.0, description="Reply timeout seconds")
    hsms_t6_timeout: float = Field(default=5.0, description="Control timeout seconds")
    hsms_t7_timeout: float = Field(default=10.0, description="Connection timeout seconds")

    # API
    api_host: str = Field(default="0.0.0.0", description="API server host")
    api_port: int = Field(default=8000, description="API server port")

    # Embeddings
    embedding_model: str = Field(
        default="text-embedding-3-small",
        description="OpenAI embedding model",
    )
    embedding_dimensions: int = Field(
        default=1536,
        description="Embedding vector dimensions",
    )


def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
```

**Step 4: Run test to verify it passes**

```bash
pytest tests/test_config.py -v
```
Expected: PASS

**Step 5: Commit**

```bash
git add . && git commit -m "feat: add pydantic-settings configuration"
```

---

## Phase 1: Database Schema and Models

### Task 1.1: SQLAlchemy Base and Provenance Model

**Files:**
- Create: `scavenger/src/scavenger/db/__init__.py`
- Create: `scavenger/src/scavenger/db/base.py`
- Create: `scavenger/src/scavenger/db/models/__init__.py`
- Create: `scavenger/src/scavenger/db/models/provenance.py`
- Create: `scavenger/tests/db/__init__.py`
- Create: `scavenger/tests/db/test_models.py`

**Step 1: Write the failing test**

```python
# tests/db/__init__.py
"""Database tests."""

# tests/db/test_models.py
import pytest
from scavenger.db.models.provenance import Provenance, SourceType


def test_provenance_model_attributes():
    """Provenance model has required fields."""
    p = Provenance(
        source_type=SourceType.SYNTHETIC,
        generation_params={"model": "gpt-4", "seed": 42},
    )

    assert p.source_type == SourceType.SYNTHETIC
    assert p.generation_params["seed"] == 42


def test_source_type_enum():
    """SourceType enum has expected values."""
    assert SourceType.SYNTHETIC.value == "synthetic"
    assert SourceType.PUBLIC_DOC.value == "public_doc"
    assert SourceType.SEMI_STANDARD.value == "semi_standard"
```

**Step 2: Run test to verify it fails**

```bash
pytest tests/db/test_models.py -v
```
Expected: FAIL with ModuleNotFoundError

**Step 3: Write implementation**

```python
# src/scavenger/db/__init__.py
"""Database package."""
from scavenger.db.base import Base
from scavenger.db.session import get_session, init_db

__all__ = ["Base", "get_session", "init_db"]
```

```python
# src/scavenger/db/base.py
"""SQLAlchemy base class and common mixins."""
from datetime import datetime
from sqlalchemy import DateTime, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    """Base class for all models."""
    pass


class TimestampMixin:
    """Mixin for created_at and updated_at timestamps."""

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        onupdate=func.now(),
    )
```

```python
# src/scavenger/db/models/__init__.py
"""Database models."""
from scavenger.db.models.provenance import Provenance, SourceType

__all__ = ["Provenance", "SourceType"]
```

```python
# src/scavenger/db/models/provenance.py
"""Provenance tracking model."""
from datetime import date
from enum import Enum
from typing import Any

from sqlalchemy import Date, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from scavenger.db.base import Base, TimestampMixin


class SourceType(str, Enum):
    """Type of data source."""

    SYNTHETIC = "synthetic"
    PUBLIC_DOC = "public_doc"
    SEMI_STANDARD = "semi_standard"


class Provenance(Base, TimestampMixin):
    """Tracks origin and generation details of all data."""

    __tablename__ = "provenance"

    id: Mapped[int] = mapped_column(primary_key=True)
    source_type: Mapped[SourceType] = mapped_column(
        String(50),
        nullable=False,
    )
    source_url: Mapped[str | None] = mapped_column(Text)
    document_title: Mapped[str | None] = mapped_column(Text)
    access_date: Mapped[date | None] = mapped_column(Date)
    generation_params: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    license_notes: Mapped[str | None] = mapped_column(Text)
```

**Step 4: Run test to verify it passes**

```bash
pytest tests/db/test_models.py -v
```
Expected: PASS

**Step 5: Commit**

```bash
git add . && git commit -m "feat(db): add Base, TimestampMixin, and Provenance model"
```

---

### Task 1.2: Equipment Vendor and Model Tables

**Files:**
- Create: `scavenger/src/scavenger/db/models/equipment.py`
- Modify: `scavenger/src/scavenger/db/models/__init__.py`
- Create: `scavenger/tests/db/test_equipment.py`

**Step 1: Write the failing test**

```python
# tests/db/test_equipment.py
import pytest
from scavenger.db.models.equipment import EquipmentVendor, EquipmentModel, EquipmentType


def test_equipment_vendor_model():
    """EquipmentVendor has required fields."""
    vendor = EquipmentVendor(
        name="ASML",
        naming_convention_notes="Uses UPPER_SNAKE_CASE for alarms",
    )
    assert vendor.name == "ASML"


def test_equipment_model():
    """EquipmentModel has required fields."""
    model = EquipmentModel(
        vendor_id=1,
        model_name="TWINSCAN NXE:3400C",
        equipment_type=EquipmentType.LITHO,
        module_names=["Wafer Stage", "Reticle Stage", "Lens"],
    )
    assert model.equipment_type == EquipmentType.LITHO
    assert "Wafer Stage" in model.module_names


def test_equipment_type_enum():
    """EquipmentType has expected values."""
    assert EquipmentType.LITHO.value == "litho"
    assert EquipmentType.ETCH.value == "etch"
    assert EquipmentType.CVD.value == "cvd"
```

**Step 2: Run test to verify it fails**

```bash
pytest tests/db/test_equipment.py -v
```
Expected: FAIL with ModuleNotFoundError

**Step 3: Write implementation**

```python
# src/scavenger/db/models/equipment.py
"""Equipment vendor and model tables."""
from enum import Enum

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from scavenger.db.base import Base, TimestampMixin


class EquipmentType(str, Enum):
    """Type of semiconductor equipment."""

    LITHO = "litho"
    ETCH = "etch"
    CVD = "cvd"
    PVD = "pvd"
    CMP = "cmp"
    IMPLANT = "implant"
    METROLOGY = "metrology"
    OTHER = "other"


class EquipmentVendor(Base, TimestampMixin):
    """Equipment manufacturer."""

    __tablename__ = "equipment_vendors"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    naming_convention_notes: Mapped[str | None] = mapped_column(Text)

    # Relationships
    models: Mapped[list["EquipmentModel"]] = relationship(back_populates="vendor")


class EquipmentModel(Base, TimestampMixin):
    """Specific equipment model."""

    __tablename__ = "equipment_models"

    id: Mapped[int] = mapped_column(primary_key=True)
    vendor_id: Mapped[int] = mapped_column(ForeignKey("equipment_vendors.id"))
    model_name: Mapped[str] = mapped_column(String(200), nullable=False)
    equipment_type: Mapped[EquipmentType | None] = mapped_column(String(50))
    module_names: Mapped[list[str] | None] = mapped_column(ARRAY(String(100)))

    # Relationships
    vendor: Mapped["EquipmentVendor"] = relationship(back_populates="models")
```

**Step 4: Update models __init__.py**

```python
# src/scavenger/db/models/__init__.py
"""Database models."""
from scavenger.db.models.provenance import Provenance, SourceType
from scavenger.db.models.equipment import EquipmentVendor, EquipmentModel, EquipmentType

__all__ = [
    "Provenance",
    "SourceType",
    "EquipmentVendor",
    "EquipmentModel",
    "EquipmentType",
]
```

**Step 5: Run test to verify it passes**

```bash
pytest tests/db/test_equipment.py -v
```
Expected: PASS

**Step 6: Commit**

```bash
git add . && git commit -m "feat(db): add EquipmentVendor and EquipmentModel"
```

---

### Task 1.3: Alarm Model with Vector and Full-Text

**Files:**
- Create: `scavenger/src/scavenger/db/models/alarm.py`
- Modify: `scavenger/src/scavenger/db/models/__init__.py`
- Create: `scavenger/tests/db/test_alarm.py`

**Step 1: Write the failing test**

```python
# tests/db/test_alarm.py
import pytest
from scavenger.db.models.alarm import Alarm, AlarmCategory, DataLayer


def test_alarm_model():
    """Alarm has SEMI E30 compliant fields."""
    alarm = Alarm(
        alid=1001,
        alcd=AlarmCategory.EQUIPMENT_SAFETY,
        altx="Wafer chuck vacuum pressure low",
        module_name="Chuck",
        severity="warning",
        data_layer=DataLayer.SCHEMA_ONLY,
    )
    assert alarm.alid == 1001
    assert alarm.alcd == AlarmCategory.EQUIPMENT_SAFETY
    assert "vacuum" in alarm.altx


def test_alarm_category_enum():
    """AlarmCategory follows SEMI E30 ALCD values."""
    assert AlarmCategory.PERSONAL_SAFETY.value == 1
    assert AlarmCategory.EQUIPMENT_SAFETY.value == 2
    assert AlarmCategory.PARAMETER_LIMIT.value == 3


def test_data_layer_enum():
    """DataLayer has three tiers."""
    assert DataLayer.SCHEMA_ONLY.value == "schema_only"
    assert DataLayer.VENDOR_FLAVORED.value == "vendor_flavored"
    assert DataLayer.PHYSICS_GROUNDED.value == "physics_grounded"
```

**Step 2: Run test to verify it fails**

```bash
pytest tests/db/test_alarm.py -v
```
Expected: FAIL

**Step 3: Write implementation**

```python
# src/scavenger/db/models/alarm.py
"""Alarm model with SEMI E30 compliance."""
from enum import Enum
from typing import Any

from pgvector.sqlalchemy import Vector
from sqlalchemy import ForeignKey, Index, String, Text, Integer, text
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, TSVECTOR
from sqlalchemy.orm import Mapped, mapped_column, relationship

from scavenger.db.base import Base, TimestampMixin


class AlarmCategory(int, Enum):
    """SEMI E30 ALCD values."""

    PERSONAL_SAFETY = 1
    EQUIPMENT_SAFETY = 2
    PARAMETER_LIMIT = 3
    PARAMETER_CHANGE = 4
    EQUIPMENT_STATUS_CHANGE = 5
    ATTENTION_FLAG = 6
    DATA_INTEGRITY = 7
    OTHER = 8


class DataLayer(str, Enum):
    """Synthetic data generation layer."""

    SCHEMA_ONLY = "schema_only"
    VENDOR_FLAVORED = "vendor_flavored"
    PHYSICS_GROUNDED = "physics_grounded"


class Alarm(Base, TimestampMixin):
    """Equipment alarm (SEMI E30 S5F1 compliant)."""

    __tablename__ = "alarms"

    id: Mapped[int] = mapped_column(primary_key=True)
    equipment_model_id: Mapped[int | None] = mapped_column(
        ForeignKey("equipment_models.id")
    )

    # SEMI E30 fields
    alid: Mapped[int] = mapped_column(Integer, nullable=False)
    alcd: Mapped[AlarmCategory] = mapped_column(Integer, nullable=False)
    altx: Mapped[str] = mapped_column(Text, nullable=False)

    # Search vectors (populated by triggers/application)
    altx_tsv: Mapped[Any | None] = mapped_column(TSVECTOR)
    altx_embedding: Mapped[list[float] | None] = mapped_column(Vector(1536))

    # Extended fields
    module_name: Mapped[str | None] = mapped_column(String(100))
    severity: Mapped[str | None] = mapped_column(String(50))
    probable_causes: Mapped[list[str] | None] = mapped_column(ARRAY(Text))
    recommended_actions: Mapped[list[str] | None] = mapped_column(ARRAY(Text))
    physics_context: Mapped[dict[str, Any] | None] = mapped_column(JSONB)

    # Metadata
    data_layer: Mapped[DataLayer] = mapped_column(String(50), nullable=False)
    provenance_id: Mapped[int | None] = mapped_column(ForeignKey("provenance.id"))

    # Indexes defined at table level
    __table_args__ = (
        Index("idx_alarms_altx_tsv", "altx_tsv", postgresql_using="gin"),
        Index(
            "idx_alarms_embedding",
            "altx_embedding",
            postgresql_using="hnsw",
            postgresql_ops={"altx_embedding": "vector_cosine_ops"},
            postgresql_with={"m": 16, "ef_construction": 64},
        ),
        Index("idx_alarms_alid", "alid"),
        Index("idx_alarms_equipment", "equipment_model_id"),
    )
```

**Step 4: Update models __init__.py**

```python
# src/scavenger/db/models/__init__.py
"""Database models."""
from scavenger.db.models.provenance import Provenance, SourceType
from scavenger.db.models.equipment import EquipmentVendor, EquipmentModel, EquipmentType
from scavenger.db.models.alarm import Alarm, AlarmCategory, DataLayer

__all__ = [
    "Provenance",
    "SourceType",
    "EquipmentVendor",
    "EquipmentModel",
    "EquipmentType",
    "Alarm",
    "AlarmCategory",
    "DataLayer",
]
```

**Step 5: Run test to verify it passes**

```bash
pytest tests/db/test_alarm.py -v
```
Expected: PASS

**Step 6: Commit**

```bash
git add . && git commit -m "feat(db): add Alarm model with vector and full-text search"
```

---

### Task 1.4: Recipe Model

**Files:**
- Create: `scavenger/src/scavenger/db/models/recipe.py`
- Modify: `scavenger/src/scavenger/db/models/__init__.py`
- Create: `scavenger/tests/db/test_recipe.py`

**Step 1: Write the failing test**

```python
# tests/db/test_recipe.py
import pytest
from scavenger.db.models.recipe import Recipe


def test_recipe_model():
    """Recipe has required fields."""
    recipe = Recipe(
        recipe_name="LITHO_STEP1_EXP",
        process_type="litho",
        parameters={
            "exposure_dose_mj": 25.0,
            "focus_offset_nm": 0,
            "na": 0.93,
        },
        description="Standard lithography exposure step",
        is_golden=True,
    )
    assert recipe.recipe_name == "LITHO_STEP1_EXP"
    assert recipe.parameters["exposure_dose_mj"] == 25.0
    assert recipe.is_golden is True
```

**Step 2: Run test to verify it fails**

```bash
pytest tests/db/test_recipe.py -v
```
Expected: FAIL

**Step 3: Write implementation**

```python
# src/scavenger/db/models/recipe.py
"""Recipe model for golden process recipes."""
from typing import Any

from pgvector.sqlalchemy import Vector
from sqlalchemy import Boolean, ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from scavenger.db.base import Base, TimestampMixin


class Recipe(Base, TimestampMixin):
    """Golden process recipe."""

    __tablename__ = "recipes"

    id: Mapped[int] = mapped_column(primary_key=True)
    equipment_model_id: Mapped[int | None] = mapped_column(
        ForeignKey("equipment_models.id")
    )

    # Recipe identification
    recipe_name: Mapped[str] = mapped_column(String(200), nullable=False)
    process_type: Mapped[str | None] = mapped_column(String(50))

    # Recipe content
    parameters: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    description: Mapped[str | None] = mapped_column(Text)
    description_embedding: Mapped[list[float] | None] = mapped_column(Vector(1536))

    # Flags
    is_golden: Mapped[bool] = mapped_column(Boolean, default=False)

    # Provenance
    provenance_id: Mapped[int | None] = mapped_column(ForeignKey("provenance.id"))

    __table_args__ = (
        Index(
            "idx_recipes_embedding",
            "description_embedding",
            postgresql_using="hnsw",
            postgresql_ops={"description_embedding": "vector_cosine_ops"},
            postgresql_with={"m": 16, "ef_construction": 64},
        ),
        Index("idx_recipes_process", "process_type"),
        Index("idx_recipes_golden", "is_golden"),
    )
```

**Step 4: Update models __init__.py**

Add `Recipe` to imports and `__all__`.

**Step 5: Run test to verify it passes**

```bash
pytest tests/db/test_recipe.py -v
```
Expected: PASS

**Step 6: Commit**

```bash
git add . && git commit -m "feat(db): add Recipe model"
```

---

### Task 1.5: Scenario and Execution Log Models

**Files:**
- Create: `scavenger/src/scavenger/db/models/scenario.py`
- Create: `scavenger/src/scavenger/db/models/execution.py`
- Modify: `scavenger/src/scavenger/db/models/__init__.py`
- Create: `scavenger/tests/db/test_scenario.py`

**Step 1: Write the failing test**

```python
# tests/db/test_scenario.py
import pytest
from scavenger.db.models.scenario import Scenario
from scavenger.db.models.execution import ExecutionRun, ExecutionEvent, RunStatus


def test_scenario_model():
    """Scenario stores HSMS message sequences."""
    scenario = Scenario(
        name="S1F13 Communication Establish",
        description="Host establishes communication with equipment",
        steps=[
            {"sxfy": "S1F13", "direction": "H2E", "delay_ms": 0},
            {"sxfy": "S1F14", "direction": "E2H", "delay_ms": 100},
        ],
        expected_ceids=[1],
    )
    assert len(scenario.steps) == 2
    assert scenario.steps[0]["sxfy"] == "S1F13"


def test_execution_run_status():
    """ExecutionRun tracks scenario execution."""
    run = ExecutionRun(
        scenario_id=1,
        status=RunStatus.RUNNING,
    )
    assert run.status == RunStatus.RUNNING


def test_execution_event():
    """ExecutionEvent logs individual messages."""
    event = ExecutionEvent(
        run_id=1,
        event_type="sxfy",
        direction="H2E",
        raw_sml="'S1F13' W.",
        parsed_data={"stream": 1, "function": 13},
    )
    assert event.direction == "H2E"
```

**Step 2: Run test to verify it fails**

```bash
pytest tests/db/test_scenario.py -v
```
Expected: FAIL

**Step 3: Write Scenario model**

```python
# src/scavenger/db/models/scenario.py
"""Scenario model for HSMS message sequences."""
from typing import Any

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.orm import Mapped, mapped_column

from scavenger.db.base import Base, TimestampMixin


class Scenario(Base, TimestampMixin):
    """HSMS message sequence scenario."""

    __tablename__ = "scenarios"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)

    # Scenario steps: [{sxfy, direction, data, delay_ms}, ...]
    steps: Mapped[list[dict[str, Any]]] = mapped_column(JSONB, nullable=False)

    # Expected outcomes
    expected_alarms: Mapped[list[int] | None] = mapped_column(ARRAY(Integer))
    expected_ceids: Mapped[list[int] | None] = mapped_column(ARRAY(Integer))

    # Provenance
    provenance_id: Mapped[int | None] = mapped_column(ForeignKey("provenance.id"))
```

Wait - there's a missing import. Let me fix:

```python
# src/scavenger/db/models/scenario.py
"""Scenario model for HSMS message sequences."""
from typing import Any

from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.orm import Mapped, mapped_column

from scavenger.db.base import Base, TimestampMixin


class Scenario(Base, TimestampMixin):
    """HSMS message sequence scenario."""

    __tablename__ = "scenarios"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)

    # Scenario steps: [{sxfy, direction, data, delay_ms}, ...]
    steps: Mapped[list[dict[str, Any]]] = mapped_column(JSONB, nullable=False)

    # Expected outcomes
    expected_alarms: Mapped[list[int] | None] = mapped_column(ARRAY(Integer))
    expected_ceids: Mapped[list[int] | None] = mapped_column(ARRAY(Integer))

    # Provenance
    provenance_id: Mapped[int | None] = mapped_column(ForeignKey("provenance.id"))
```

**Step 4: Write Execution models**

```python
# src/scavenger/db/models/execution.py
"""Execution run and event logging models."""
from datetime import datetime
from enum import Enum
from typing import Any

from sqlalchemy import DateTime, ForeignKey, Index, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from scavenger.db.base import Base


class RunStatus(str, Enum):
    """Execution run status."""

    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class ExecutionRun(Base):
    """Tracks a scenario execution run."""

    __tablename__ = "execution_runs"

    id: Mapped[int] = mapped_column(primary_key=True)
    scenario_id: Mapped[int] = mapped_column(ForeignKey("scenarios.id"))

    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    status: Mapped[RunStatus] = mapped_column(String(20), nullable=False)

    # Relationships
    events: Mapped[list["ExecutionEvent"]] = relationship(back_populates="run")

    __table_args__ = (
        Index("idx_runs_scenario", "scenario_id"),
        Index("idx_runs_status", "status"),
    )


class ExecutionEvent(Base):
    """Individual HSMS message or event log entry."""

    __tablename__ = "execution_events"

    id: Mapped[int] = mapped_column(primary_key=True)
    run_id: Mapped[int] = mapped_column(ForeignKey("execution_runs.id"))

    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    event_type: Mapped[str] = mapped_column(String(20), nullable=False)  # sxfy, alarm, ceid
    direction: Mapped[str | None] = mapped_column(String(10))  # H2E, E2H

    # Message content
    raw_sml: Mapped[str | None] = mapped_column(Text)
    parsed_data: Mapped[dict[str, Any] | None] = mapped_column(JSONB)

    # KB links
    matched_alarm_id: Mapped[int | None] = mapped_column(ForeignKey("alarms.id"))
    matched_recipe_id: Mapped[int | None] = mapped_column(ForeignKey("recipes.id"))

    # Relationships
    run: Mapped["ExecutionRun"] = relationship(back_populates="events")

    __table_args__ = (
        Index("idx_events_run", "run_id"),
        Index("idx_events_timestamp", "timestamp"),
    )
```

**Step 5: Update models __init__.py**

```python
# src/scavenger/db/models/__init__.py
"""Database models."""
from scavenger.db.models.provenance import Provenance, SourceType
from scavenger.db.models.equipment import EquipmentVendor, EquipmentModel, EquipmentType
from scavenger.db.models.alarm import Alarm, AlarmCategory, DataLayer
from scavenger.db.models.recipe import Recipe
from scavenger.db.models.scenario import Scenario
from scavenger.db.models.execution import ExecutionRun, ExecutionEvent, RunStatus

__all__ = [
    "Provenance",
    "SourceType",
    "EquipmentVendor",
    "EquipmentModel",
    "EquipmentType",
    "Alarm",
    "AlarmCategory",
    "DataLayer",
    "Recipe",
    "Scenario",
    "ExecutionRun",
    "ExecutionEvent",
    "RunStatus",
]
```

**Step 6: Run test to verify it passes**

```bash
pytest tests/db/test_scenario.py -v
```
Expected: PASS

**Step 7: Commit**

```bash
git add . && git commit -m "feat(db): add Scenario and Execution logging models"
```

---

### Task 1.6: Database Session and Alembic Setup

**Files:**
- Create: `scavenger/src/scavenger/db/session.py`
- Create: `scavenger/alembic.ini`
- Create: `scavenger/alembic/env.py`
- Create: `scavenger/alembic/versions/.gitkeep`
- Create: `scavenger/tests/db/test_session.py`

**Step 1: Write the failing test**

```python
# tests/db/test_session.py
import pytest
from scavenger.db.session import get_session, init_db


def test_get_session_returns_context_manager():
    """get_session provides async context manager."""
    session_ctx = get_session()
    assert hasattr(session_ctx, "__aenter__")
    assert hasattr(session_ctx, "__aexit__")
```

**Step 2: Run test to verify it fails**

```bash
pytest tests/db/test_session.py -v
```
Expected: FAIL

**Step 3: Write session.py**

```python
# src/scavenger/db/session.py
"""Async database session management."""
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from scavenger.config import get_settings
from scavenger.db.base import Base

# Lazy engine initialization
_engine = None
_session_factory = None


def _get_engine():
    """Get or create the async engine."""
    global _engine
    if _engine is None:
        settings = get_settings()
        _engine = create_async_engine(
            settings.database_url,
            echo=False,
            pool_size=5,
            max_overflow=10,
        )
    return _engine


def _get_session_factory():
    """Get or create the session factory."""
    global _session_factory
    if _session_factory is None:
        _session_factory = async_sessionmaker(
            bind=_get_engine(),
            class_=AsyncSession,
            expire_on_commit=False,
        )
    return _session_factory


@asynccontextmanager
async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """Async context manager for database sessions."""
    factory = _get_session_factory()
    async with factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def init_db() -> None:
    """Create all tables (for development/testing)."""
    engine = _get_engine()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def close_db() -> None:
    """Close database connections."""
    global _engine, _session_factory
    if _engine is not None:
        await _engine.dispose()
        _engine = None
        _session_factory = None
```

**Step 4: Create alembic.ini**

```ini
# alembic.ini
[alembic]
script_location = alembic
prepend_sys_path = .
version_path_separator = os

[post_write_hooks]

[loggers]
keys = root,sqlalchemy,alembic

[handlers]
keys = console

[formatters]
keys = generic

[logger_root]
level = WARN
handlers = console

[logger_sqlalchemy]
level = WARN
handlers =
qualname = sqlalchemy.engine

[logger_alembic]
level = INFO
handlers =
qualname = alembic

[handler_console]
class = StreamHandler
args = (sys.stderr,)
level = NOTSET
formatter = generic

[formatter_generic]
format = %(levelname)-5.5s [%(name)s] %(message)s
datefmt = %H:%M:%S
```

**Step 5: Create alembic/env.py**

```python
# alembic/env.py
"""Alembic migration environment."""
import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy import pool
from sqlalchemy.ext.asyncio import async_engine_from_config

from scavenger.config import get_settings
from scavenger.db.base import Base
from scavenger.db.models import *  # noqa: F401, F403 - Import all models

config = context.config
settings = get_settings()

# Set database URL from settings
config.set_main_option("sqlalchemy.url", settings.database_url.replace("+asyncpg", ""))

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection):
    """Run migrations with connection."""
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Run migrations in 'online' mode with async engine."""
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
```

**Step 6: Create directory structure**

```bash
mkdir -p alembic/versions
touch alembic/versions/.gitkeep
```

**Step 7: Run test to verify it passes**

```bash
pytest tests/db/test_session.py -v
```
Expected: PASS

**Step 8: Commit**

```bash
git add . && git commit -m "feat(db): add async session management and Alembic setup"
```

---

## Phase 2: CLI Foundation

### Task 2.1: CLI Entry Point

**Files:**
- Create: `scavenger/src/scavenger/cli/__init__.py`
- Create: `scavenger/src/scavenger/cli/main.py`
- Create: `scavenger/tests/cli/__init__.py`
- Create: `scavenger/tests/cli/test_main.py`

**Step 1: Write the failing test**

```python
# tests/cli/__init__.py
"""CLI tests."""

# tests/cli/test_main.py
import pytest
from click.testing import CliRunner
from scavenger.cli.main import cli


def test_cli_version():
    """CLI shows version."""
    runner = CliRunner()
    result = runner.invoke(cli, ["--version"])
    assert result.exit_code == 0
    assert "0.1.0" in result.output


def test_cli_help():
    """CLI shows help."""
    runner = CliRunner()
    result = runner.invoke(cli, ["--help"])
    assert result.exit_code == 0
    assert "Scavenger" in result.output
```

**Step 2: Run test to verify it fails**

```bash
pytest tests/cli/test_main.py -v
```
Expected: FAIL

**Step 3: Write implementation**

```python
# src/scavenger/cli/__init__.py
"""CLI package."""
from scavenger.cli.main import cli, main

__all__ = ["cli", "main"]
```

```python
# src/scavenger/cli/main.py
"""Scavenger CLI entry point."""
import click

from scavenger import __version__


@click.group()
@click.version_option(version=__version__, prog_name="scavenger")
def cli() -> None:
    """Scavenger: Semiconductor equipment knowledge base with HSMS runtime."""
    pass


@cli.command()
def info() -> None:
    """Show configuration info."""
    from scavenger.config import get_settings

    settings = get_settings()
    click.echo(f"Database: {settings.database_url.split('@')[-1]}")
    click.echo(f"HSMS Port: {settings.hsms_port}")
    click.echo(f"API Port: {settings.api_port}")


def main() -> None:
    """Main entry point."""
    cli()


if __name__ == "__main__":
    main()
```

**Step 4: Run test to verify it passes**

```bash
pytest tests/cli/test_main.py -v
```
Expected: PASS

**Step 5: Verify CLI works**

```bash
cd scavenger && pip install -e . && scavenger --version
```
Expected: `scavenger, version 0.1.0`

**Step 6: Commit**

```bash
git add . && git commit -m "feat(cli): add Click CLI entry point"
```

---

### Task 2.2: Database CLI Commands

**Files:**
- Create: `scavenger/src/scavenger/cli/db.py`
- Modify: `scavenger/src/scavenger/cli/main.py`
- Create: `scavenger/tests/cli/test_db.py`

**Step 1: Write the failing test**

```python
# tests/cli/test_db.py
import pytest
from click.testing import CliRunner
from scavenger.cli.main import cli


def test_db_group_exists():
    """db command group exists."""
    runner = CliRunner()
    result = runner.invoke(cli, ["db", "--help"])
    assert result.exit_code == 0
    assert "migrate" in result.output or "init" in result.output
```

**Step 2: Run test to verify it fails**

```bash
pytest tests/cli/test_db.py -v
```
Expected: FAIL

**Step 3: Write implementation**

```python
# src/scavenger/cli/db.py
"""Database management CLI commands."""
import asyncio
import click


@click.group()
def db() -> None:
    """Database management commands."""
    pass


@db.command()
def init() -> None:
    """Initialize database tables (development only)."""
    from scavenger.db.session import init_db

    click.echo("Initializing database tables...")
    asyncio.run(init_db())
    click.echo("Done.")


@db.command()
@click.option("--message", "-m", required=True, help="Migration message")
def migrate(message: str) -> None:
    """Create a new Alembic migration."""
    import subprocess

    result = subprocess.run(
        ["alembic", "revision", "--autogenerate", "-m", message],
        capture_output=True,
        text=True,
    )
    click.echo(result.stdout)
    if result.returncode != 0:
        click.echo(result.stderr, err=True)
        raise SystemExit(result.returncode)


@db.command()
def upgrade() -> None:
    """Apply pending migrations."""
    import subprocess

    result = subprocess.run(
        ["alembic", "upgrade", "head"],
        capture_output=True,
        text=True,
    )
    click.echo(result.stdout)
    if result.returncode != 0:
        click.echo(result.stderr, err=True)
        raise SystemExit(result.returncode)
```

**Step 4: Update main.py to include db group**

```python
# src/scavenger/cli/main.py
"""Scavenger CLI entry point."""
import click

from scavenger import __version__
from scavenger.cli.db import db


@click.group()
@click.version_option(version=__version__, prog_name="scavenger")
def cli() -> None:
    """Scavenger: Semiconductor equipment knowledge base with HSMS runtime."""
    pass


# Register command groups
cli.add_command(db)


@cli.command()
def info() -> None:
    """Show configuration info."""
    from scavenger.config import get_settings

    settings = get_settings()
    click.echo(f"Database: {settings.database_url.split('@')[-1]}")
    click.echo(f"HSMS Port: {settings.hsms_port}")
    click.echo(f"API Port: {settings.api_port}")


def main() -> None:
    """Main entry point."""
    cli()


if __name__ == "__main__":
    main()
```

**Step 5: Run test to verify it passes**

```bash
pytest tests/cli/test_db.py -v
```
Expected: PASS

**Step 6: Commit**

```bash
git add . && git commit -m "feat(cli): add database management commands"
```

---

## Phase 3: Hybrid Search

### Task 3.1: Embedding Service

**Files:**
- Create: `scavenger/src/scavenger/search/__init__.py`
- Create: `scavenger/src/scavenger/search/embeddings.py`
- Create: `scavenger/tests/search/__init__.py`
- Create: `scavenger/tests/search/test_embeddings.py`

**Step 1: Write the failing test**

```python
# tests/search/__init__.py
"""Search tests."""

# tests/search/test_embeddings.py
import pytest
from unittest.mock import AsyncMock, patch
from scavenger.search.embeddings import EmbeddingService


@pytest.fixture
def embedding_service():
    return EmbeddingService(api_key="test-key", model="text-embedding-3-small")


def test_embedding_service_init(embedding_service):
    """EmbeddingService initializes with model config."""
    assert embedding_service.model == "text-embedding-3-small"
    assert embedding_service.dimensions == 1536


@pytest.mark.asyncio
async def test_embed_text_returns_vector(embedding_service):
    """embed_text returns vector of correct dimensions."""
    mock_response = AsyncMock()
    mock_response.data = [AsyncMock(embedding=[0.1] * 1536)]

    with patch.object(embedding_service._client.embeddings, "create", return_value=mock_response):
        result = await embedding_service.embed_text("test text")

    assert len(result) == 1536


@pytest.mark.asyncio
async def test_embed_batch_returns_vectors(embedding_service):
    """embed_batch returns list of vectors."""
    mock_response = AsyncMock()
    mock_response.data = [
        AsyncMock(embedding=[0.1] * 1536),
        AsyncMock(embedding=[0.2] * 1536),
    ]

    with patch.object(embedding_service._client.embeddings, "create", return_value=mock_response):
        result = await embedding_service.embed_batch(["text1", "text2"])

    assert len(result) == 2
```

**Step 2: Run test to verify it fails**

```bash
pytest tests/search/test_embeddings.py -v
```
Expected: FAIL

**Step 3: Write implementation**

```python
# src/scavenger/search/__init__.py
"""Search package."""
from scavenger.search.embeddings import EmbeddingService

__all__ = ["EmbeddingService"]
```

```python
# src/scavenger/search/embeddings.py
"""OpenAI embedding service."""
from openai import AsyncOpenAI


class EmbeddingService:
    """Async OpenAI embedding service."""

    DIMENSIONS = {
        "text-embedding-3-small": 1536,
        "text-embedding-3-large": 3072,
        "text-embedding-ada-002": 1536,
    }

    def __init__(self, api_key: str, model: str = "text-embedding-3-small"):
        self.model = model
        self.dimensions = self.DIMENSIONS.get(model, 1536)
        self._client = AsyncOpenAI(api_key=api_key)

    async def embed_text(self, text: str) -> list[float]:
        """Generate embedding for a single text."""
        response = await self._client.embeddings.create(
            model=self.model,
            input=text,
        )
        return response.data[0].embedding

    async def embed_batch(
        self,
        texts: list[str],
        batch_size: int = 100,
    ) -> list[list[float]]:
        """Generate embeddings for multiple texts."""
        all_embeddings: list[list[float]] = []

        for i in range(0, len(texts), batch_size):
            batch = texts[i : i + batch_size]
            response = await self._client.embeddings.create(
                model=self.model,
                input=batch,
            )
            all_embeddings.extend([d.embedding for d in response.data])

        return all_embeddings
```

**Step 4: Run test to verify it passes**

```bash
pytest tests/search/test_embeddings.py -v
```
Expected: PASS

**Step 5: Commit**

```bash
git add . && git commit -m "feat(search): add OpenAI embedding service"
```

---

### Task 3.2: RRF Hybrid Search

**Files:**
- Create: `scavenger/src/scavenger/search/hybrid.py`
- Modify: `scavenger/src/scavenger/search/__init__.py`
- Create: `scavenger/tests/search/test_hybrid.py`

**Step 1: Write the failing test**

```python
# tests/search/test_hybrid.py
import pytest
from scavenger.search.hybrid import reciprocal_rank_fusion, HybridSearchResult


def test_rrf_combines_rankings():
    """RRF combines keyword and semantic rankings."""
    keyword_ids = [1, 2, 3, 4, 5]
    semantic_ids = [3, 1, 6, 2, 7]

    results = reciprocal_rank_fusion(
        keyword_ids=keyword_ids,
        semantic_ids=semantic_ids,
        keyword_weight=0.4,
        semantic_weight=0.6,
        k=60,
    )

    # ID 1 appears in both, should rank high
    result_ids = [r.id for r in results]
    assert 1 in result_ids[:3]
    assert 3 in result_ids[:3]


def test_rrf_respects_weights():
    """RRF respects weight configuration."""
    keyword_ids = [1, 2, 3]
    semantic_ids = [4, 5, 6]

    # Heavy semantic weight
    results = reciprocal_rank_fusion(
        keyword_ids=keyword_ids,
        semantic_ids=semantic_ids,
        keyword_weight=0.1,
        semantic_weight=0.9,
        k=60,
    )

    # Semantic results should dominate
    top_3 = [r.id for r in results[:3]]
    assert 4 in top_3  # Top semantic result


def test_hybrid_search_result_dataclass():
    """HybridSearchResult holds combined scores."""
    result = HybridSearchResult(
        id=1,
        keyword_rank=2,
        semantic_rank=1,
        rrf_score=0.032,
    )
    assert result.id == 1
    assert result.rrf_score == 0.032
```

**Step 2: Run test to verify it fails**

```bash
pytest tests/search/test_hybrid.py -v
```
Expected: FAIL

**Step 3: Write implementation**

```python
# src/scavenger/search/hybrid.py
"""Reciprocal Rank Fusion for hybrid search."""
from dataclasses import dataclass


@dataclass
class HybridSearchResult:
    """Result with combined RRF score."""

    id: int
    keyword_rank: int | None
    semantic_rank: int | None
    rrf_score: float


def reciprocal_rank_fusion(
    keyword_ids: list[int],
    semantic_ids: list[int],
    keyword_weight: float = 0.4,
    semantic_weight: float = 0.6,
    k: int = 60,
) -> list[HybridSearchResult]:
    """
    Combine keyword and semantic search results using RRF.

    RRF formula: score = weight / (k + rank)

    Args:
        keyword_ids: IDs ranked by keyword search (position = rank)
        semantic_ids: IDs ranked by semantic search (position = rank)
        keyword_weight: Weight for keyword component (0-1)
        semantic_weight: Weight for semantic component (0-1)
        k: RRF constant (typically 60)

    Returns:
        Combined results sorted by RRF score descending
    """
    scores: dict[int, HybridSearchResult] = {}

    # Score keyword results
    for rank, doc_id in enumerate(keyword_ids, start=1):
        score = keyword_weight / (k + rank)
        if doc_id not in scores:
            scores[doc_id] = HybridSearchResult(
                id=doc_id,
                keyword_rank=rank,
                semantic_rank=None,
                rrf_score=0.0,
            )
        scores[doc_id].keyword_rank = rank
        scores[doc_id].rrf_score += score

    # Score semantic results
    for rank, doc_id in enumerate(semantic_ids, start=1):
        score = semantic_weight / (k + rank)
        if doc_id not in scores:
            scores[doc_id] = HybridSearchResult(
                id=doc_id,
                keyword_rank=None,
                semantic_rank=rank,
                rrf_score=0.0,
            )
        scores[doc_id].semantic_rank = rank
        scores[doc_id].rrf_score += score

    # Sort by RRF score descending
    return sorted(scores.values(), key=lambda x: x.rrf_score, reverse=True)
```

**Step 4: Update __init__.py**

```python
# src/scavenger/search/__init__.py
"""Search package."""
from scavenger.search.embeddings import EmbeddingService
from scavenger.search.hybrid import HybridSearchResult, reciprocal_rank_fusion

__all__ = ["EmbeddingService", "HybridSearchResult", "reciprocal_rank_fusion"]
```

**Step 5: Run test to verify it passes**

```bash
pytest tests/search/test_hybrid.py -v
```
Expected: PASS

**Step 6: Commit**

```bash
git add . && git commit -m "feat(search): add Reciprocal Rank Fusion hybrid search"
```

---

### Task 3.3: Alarm Search Repository

**Files:**
- Create: `scavenger/src/scavenger/search/alarm_search.py`
- Create: `scavenger/tests/search/test_alarm_search.py`

**Step 1: Write the failing test**

```python
# tests/search/test_alarm_search.py
import pytest
from scavenger.search.alarm_search import AlarmSearchQuery, AlarmSearcher


def test_alarm_search_query_dataclass():
    """AlarmSearchQuery validates input."""
    query = AlarmSearchQuery(
        text="vacuum pressure low",
        vendor="ASML",
        process_type="litho",
        limit=20,
        keyword_weight=0.4,
        semantic_weight=0.6,
    )
    assert query.text == "vacuum pressure low"
    assert query.limit == 20


def test_alarm_searcher_init():
    """AlarmSearcher initializes with embedding service."""
    from unittest.mock import MagicMock

    mock_embedding = MagicMock()
    searcher = AlarmSearcher(session=MagicMock(), embedding_service=mock_embedding)

    assert searcher._embedding_service == mock_embedding
```

**Step 2: Run test to verify it fails**

```bash
pytest tests/search/test_alarm_search.py -v
```
Expected: FAIL

**Step 3: Write implementation**

```python
# src/scavenger/search/alarm_search.py
"""Alarm search with hybrid RRF."""
from dataclasses import dataclass, field

from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from scavenger.db.models.alarm import Alarm
from scavenger.search.embeddings import EmbeddingService
from scavenger.search.hybrid import HybridSearchResult, reciprocal_rank_fusion


@dataclass
class AlarmSearchQuery:
    """Search query parameters."""

    text: str
    vendor: str | None = None
    process_type: str | None = None
    limit: int = 20
    keyword_weight: float = 0.4
    semantic_weight: float = 0.6


@dataclass
class AlarmSearchResult:
    """Alarm search result with scores."""

    alarm: Alarm
    rrf_score: float
    keyword_rank: int | None = None
    semantic_rank: int | None = None


class AlarmSearcher:
    """Hybrid search for alarms."""

    def __init__(
        self,
        session: AsyncSession,
        embedding_service: EmbeddingService,
    ):
        self._session = session
        self._embedding_service = embedding_service

    async def search(
        self,
        query: AlarmSearchQuery,
    ) -> list[AlarmSearchResult]:
        """Execute hybrid search."""
        # Get keyword results
        keyword_ids = await self._keyword_search(query)

        # Get semantic results
        semantic_ids = await self._semantic_search(query)

        # Combine with RRF
        rrf_results = reciprocal_rank_fusion(
            keyword_ids=keyword_ids,
            semantic_ids=semantic_ids,
            keyword_weight=query.keyword_weight,
            semantic_weight=query.semantic_weight,
        )

        # Fetch alarm objects for top results
        top_ids = [r.id for r in rrf_results[: query.limit]]
        if not top_ids:
            return []

        alarms_query = select(Alarm).where(Alarm.id.in_(top_ids))
        result = await self._session.execute(alarms_query)
        alarms_by_id = {a.id: a for a in result.scalars()}

        # Build results preserving RRF order
        return [
            AlarmSearchResult(
                alarm=alarms_by_id[r.id],
                rrf_score=r.rrf_score,
                keyword_rank=r.keyword_rank,
                semantic_rank=r.semantic_rank,
            )
            for r in rrf_results[: query.limit]
            if r.id in alarms_by_id
        ]

    async def _keyword_search(self, query: AlarmSearchQuery) -> list[int]:
        """Full-text search using tsvector."""
        # Use websearch_to_tsquery for natural language queries
        stmt = (
            select(Alarm.id)
            .where(
                Alarm.altx_tsv.op("@@")(
                    func.websearch_to_tsquery("english", query.text)
                )
            )
            .order_by(
                func.ts_rank(
                    Alarm.altx_tsv,
                    func.websearch_to_tsquery("english", query.text),
                ).desc()
            )
            .limit(query.limit * 2)  # Fetch more for RRF
        )

        result = await self._session.execute(stmt)
        return list(result.scalars())

    async def _semantic_search(self, query: AlarmSearchQuery) -> list[int]:
        """Vector similarity search."""
        # Generate query embedding
        query_embedding = await self._embedding_service.embed_text(query.text)

        # Cosine similarity search
        stmt = (
            select(Alarm.id)
            .where(Alarm.altx_embedding.isnot(None))
            .order_by(Alarm.altx_embedding.cosine_distance(query_embedding))
            .limit(query.limit * 2)
        )

        result = await self._session.execute(stmt)
        return list(result.scalars())
```

**Step 4: Run test to verify it passes**

```bash
pytest tests/search/test_alarm_search.py -v
```
Expected: PASS

**Step 5: Commit**

```bash
git add . && git commit -m "feat(search): add AlarmSearcher with hybrid RRF"
```

---

## Phase 4: Synthetic Data Generation

### Task 4.1: Schema-Layer Alarm Generator

**Files:**
- Create: `scavenger/src/scavenger/generate/__init__.py`
- Create: `scavenger/src/scavenger/generate/schema_alarms.py`
- Create: `scavenger/tests/generate/__init__.py`
- Create: `scavenger/tests/generate/test_schema_alarms.py`

**Step 1: Write the failing test**

```python
# tests/generate/__init__.py
"""Generator tests."""

# tests/generate/test_schema_alarms.py
import pytest
from scavenger.generate.schema_alarms import SchemaAlarmGenerator
from scavenger.db.models.alarm import AlarmCategory, DataLayer


def test_generate_single_alarm():
    """Generator creates valid schema-layer alarm."""
    gen = SchemaAlarmGenerator(seed=42)
    alarm = gen.generate_one(alid=1001)

    assert alarm.alid == 1001
    assert alarm.alcd in list(AlarmCategory)
    assert alarm.altx != ""
    assert alarm.data_layer == DataLayer.SCHEMA_ONLY


def test_generate_batch():
    """Generator creates multiple unique alarms."""
    gen = SchemaAlarmGenerator(seed=42)
    alarms = gen.generate_batch(count=10, start_alid=1000)

    assert len(alarms) == 10
    alids = [a.alid for a in alarms]
    assert alids == list(range(1000, 1010))


def test_reproducible_with_seed():
    """Same seed produces same alarms."""
    gen1 = SchemaAlarmGenerator(seed=42)
    gen2 = SchemaAlarmGenerator(seed=42)

    alarm1 = gen1.generate_one(alid=1)
    alarm2 = gen2.generate_one(alid=1)

    assert alarm1.altx == alarm2.altx
    assert alarm1.alcd == alarm2.alcd
```

**Step 2: Run test to verify it fails**

```bash
pytest tests/generate/test_schema_alarms.py -v
```
Expected: FAIL

**Step 3: Write implementation**

```python
# src/scavenger/generate/__init__.py
"""Data generation package."""
from scavenger.generate.schema_alarms import SchemaAlarmGenerator

__all__ = ["SchemaAlarmGenerator"]
```

```python
# src/scavenger/generate/schema_alarms.py
"""Schema-layer alarm generator (SEMI E30 compliant)."""
import random
from scavenger.db.models.alarm import Alarm, AlarmCategory, DataLayer


class SchemaAlarmGenerator:
    """Generate schema-accurate alarms following SEMI E30."""

    MODULES = [
        "Chamber", "Robot", "Chuck", "Pump", "Valve",
        "MFC", "Heater", "Cooler", "Sensor", "Motor",
        "Loader", "Aligner", "Stage", "Shutter", "Lift",
    ]

    FAULT_TYPES = [
        "pressure low", "pressure high", "temperature high", "temperature low",
        "timeout", "communication error", "position error", "interlock",
        "sensor fault", "motor fault", "flow rate error", "vacuum loss",
        "power failure", "calibration error", "limit exceeded",
    ]

    SEVERITIES = ["warning", "alarm", "critical"]

    PROBABLE_CAUSES = {
        "pressure": ["Leak in chamber", "Pump malfunction", "Valve stuck"],
        "temperature": ["Heater failure", "Coolant flow blocked", "Thermocouple drift"],
        "timeout": ["Communication loss", "Controller busy", "Network congestion"],
        "position": ["Encoder error", "Mechanical obstruction", "Motor failure"],
        "default": ["Hardware malfunction", "Calibration drift", "External interference"],
    }

    def __init__(self, seed: int | None = None):
        self._rng = random.Random(seed)

    def generate_one(self, alid: int) -> Alarm:
        """Generate a single schema-layer alarm."""
        module = self._rng.choice(self.MODULES)
        fault_type = self._rng.choice(self.FAULT_TYPES)
        alcd = self._rng.choice(list(AlarmCategory))
        severity = self._rng.choice(self.SEVERITIES)

        altx = f"{module} {fault_type}"

        # Find probable causes based on fault type keywords
        causes_key = "default"
        for key in self.PROBABLE_CAUSES:
            if key in fault_type:
                causes_key = key
                break
        probable_causes = self.PROBABLE_CAUSES[causes_key]

        return Alarm(
            alid=alid,
            alcd=alcd,
            altx=altx,
            module_name=module,
            severity=severity,
            probable_causes=probable_causes,
            recommended_actions=[f"Check {module}", "Contact maintenance"],
            data_layer=DataLayer.SCHEMA_ONLY,
        )

    def generate_batch(self, count: int, start_alid: int = 1) -> list[Alarm]:
        """Generate multiple alarms with sequential ALIDs."""
        return [
            self.generate_one(alid=start_alid + i)
            for i in range(count)
        ]
```

**Step 4: Run test to verify it passes**

```bash
pytest tests/generate/test_schema_alarms.py -v
```
Expected: PASS

**Step 5: Commit**

```bash
git add . && git commit -m "feat(generate): add SchemaAlarmGenerator for SEMI E30 alarms"
```

---

### Task 4.2: CLI Generate Commands

**Files:**
- Create: `scavenger/src/scavenger/cli/generate.py`
- Modify: `scavenger/src/scavenger/cli/main.py`
- Create: `scavenger/tests/cli/test_generate.py`

**Step 1: Write the failing test**

```python
# tests/cli/test_generate.py
import pytest
from click.testing import CliRunner
from scavenger.cli.main import cli


def test_generate_group_exists():
    """generate command group exists."""
    runner = CliRunner()
    result = runner.invoke(cli, ["generate", "--help"])
    assert result.exit_code == 0
    assert "alarms" in result.output


def test_generate_alarms_dry_run():
    """generate alarms --dry-run shows preview."""
    runner = CliRunner()
    result = runner.invoke(cli, [
        "generate", "alarms",
        "--count", "5",
        "--layer", "schema",
        "--dry-run",
    ])
    assert result.exit_code == 0
    assert "ALID" in result.output or "alid" in result.output.lower()
```

**Step 2: Run test to verify it fails**

```bash
pytest tests/cli/test_generate.py -v
```
Expected: FAIL

**Step 3: Write implementation**

```python
# src/scavenger/cli/generate.py
"""Data generation CLI commands."""
import asyncio
import click

from scavenger.db.models.alarm import DataLayer


@click.group()
def generate() -> None:
    """Synthetic data generation commands."""
    pass


@generate.command()
@click.option("--count", "-n", default=100, help="Number of alarms to generate")
@click.option(
    "--layer",
    type=click.Choice(["schema", "vendor", "physics"]),
    default="schema",
    help="Data layer",
)
@click.option("--start-alid", default=1, help="Starting ALID number")
@click.option("--seed", type=int, help="Random seed for reproducibility")
@click.option("--dry-run", is_flag=True, help="Preview without saving to DB")
def alarms(
    count: int,
    layer: str,
    start_alid: int,
    seed: int | None,
    dry_run: bool,
) -> None:
    """Generate synthetic alarms."""
    from scavenger.generate.schema_alarms import SchemaAlarmGenerator

    if layer != "schema":
        click.echo(f"Layer '{layer}' not yet implemented. Using 'schema'.")

    gen = SchemaAlarmGenerator(seed=seed)
    alarms_list = gen.generate_batch(count=count, start_alid=start_alid)

    if dry_run:
        click.echo(f"Generated {len(alarms_list)} alarms (dry run):\n")
        for alarm in alarms_list[:10]:  # Show first 10
            click.echo(f"  ALID={alarm.alid} ALCD={alarm.alcd.value} [{alarm.severity}]")
            click.echo(f"    {alarm.altx}")
        if len(alarms_list) > 10:
            click.echo(f"  ... and {len(alarms_list) - 10} more")
        return

    # Save to database
    async def save_alarms():
        from scavenger.db.session import get_session
        from scavenger.db.models.provenance import Provenance, SourceType

        async with get_session() as session:
            # Create provenance record
            provenance = Provenance(
                source_type=SourceType.SYNTHETIC,
                generation_params={
                    "generator": "SchemaAlarmGenerator",
                    "seed": seed,
                    "count": count,
                    "start_alid": start_alid,
                },
            )
            session.add(provenance)
            await session.flush()

            # Link alarms to provenance
            for alarm in alarms_list:
                alarm.provenance_id = provenance.id
                session.add(alarm)

            await session.commit()

        click.echo(f"Saved {len(alarms_list)} alarms to database.")

    asyncio.run(save_alarms())
```

**Step 4: Update main.py**

Add `from scavenger.cli.generate import generate` and `cli.add_command(generate)`.

**Step 5: Run test to verify it passes**

```bash
pytest tests/cli/test_generate.py -v
```
Expected: PASS

**Step 6: Commit**

```bash
git add . && git commit -m "feat(cli): add generate alarms command"
```

---

## Phase 5: FastAPI Server

### Task 5.1: API Application Factory

**Files:**
- Create: `scavenger/src/scavenger/api/__init__.py`
- Create: `scavenger/src/scavenger/api/main.py`
- Create: `scavenger/tests/api/__init__.py`
- Create: `scavenger/tests/api/test_main.py`

**Step 1: Write the failing test**

```python
# tests/api/__init__.py
"""API tests."""

# tests/api/test_main.py
import pytest
from httpx import AsyncClient, ASGITransport
from scavenger.api.main import app


@pytest.mark.asyncio
async def test_health_endpoint():
    """Health endpoint returns ok."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_root_endpoint():
    """Root endpoint returns API info."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/")

    assert response.status_code == 200
    assert "Scavenger" in response.json()["name"]
```

**Step 2: Run test to verify it fails**

```bash
pytest tests/api/test_main.py -v
```
Expected: FAIL

**Step 3: Write implementation**

```python
# src/scavenger/api/__init__.py
"""API package."""
from scavenger.api.main import app

__all__ = ["app"]
```

```python
# src/scavenger/api/main.py
"""FastAPI application."""
from contextlib import asynccontextmanager

from fastapi import FastAPI

from scavenger import __version__
from scavenger.db.session import close_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    yield
    await close_db()


app = FastAPI(
    title="Scavenger API",
    description="Semiconductor equipment knowledge base with HSMS runtime",
    version=__version__,
    lifespan=lifespan,
)


@app.get("/")
async def root():
    """API root information."""
    return {
        "name": "Scavenger API",
        "version": __version__,
        "docs": "/docs",
    }


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "ok"}
```

**Step 4: Run test to verify it passes**

```bash
pytest tests/api/test_main.py -v
```
Expected: PASS

**Step 5: Commit**

```bash
git add . && git commit -m "feat(api): add FastAPI application with health endpoint"
```

---

### Task 5.2: Search API Router

**Files:**
- Create: `scavenger/src/scavenger/api/routers/__init__.py`
- Create: `scavenger/src/scavenger/api/routers/search.py`
- Create: `scavenger/src/scavenger/api/schemas/__init__.py`
- Create: `scavenger/src/scavenger/api/schemas/search.py`
- Modify: `scavenger/src/scavenger/api/main.py`
- Create: `scavenger/tests/api/test_search.py`

**Step 1: Write the failing test**

```python
# tests/api/test_search.py
import pytest
from httpx import AsyncClient, ASGITransport
from scavenger.api.main import app


@pytest.mark.asyncio
async def test_search_alarms_endpoint_exists():
    """POST /api/search/alarms endpoint exists."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/api/search/alarms",
            json={"query": "vacuum pressure"},
        )

    # Should not be 404
    assert response.status_code != 404
```

**Step 2: Run test to verify it fails**

```bash
pytest tests/api/test_search.py -v
```
Expected: FAIL

**Step 3: Write schemas**

```python
# src/scavenger/api/schemas/__init__.py
"""API schemas package."""
from scavenger.api.schemas.search import (
    AlarmSearchRequest,
    AlarmSearchResponse,
    AlarmResult,
)

__all__ = ["AlarmSearchRequest", "AlarmSearchResponse", "AlarmResult"]
```

```python
# src/scavenger/api/schemas/search.py
"""Search API schemas."""
from pydantic import BaseModel, Field


class RRFWeights(BaseModel):
    """RRF weight configuration."""

    keyword: float = Field(default=0.4, ge=0, le=1)
    semantic: float = Field(default=0.6, ge=0, le=1)


class AlarmSearchRequest(BaseModel):
    """Alarm search request."""

    query: str = Field(..., min_length=1, description="Search query text")
    vendor: str | None = Field(default=None, description="Filter by vendor")
    process_type: str | None = Field(default=None, description="Filter by process type")
    limit: int = Field(default=20, ge=1, le=100, description="Max results")
    rrf_weights: RRFWeights = Field(default_factory=RRFWeights)


class AlarmResult(BaseModel):
    """Single alarm result."""

    id: int
    alid: int
    alcd: int
    altx: str
    module_name: str | None
    severity: str | None
    probable_causes: list[str] | None
    rrf_score: float
    keyword_rank: int | None
    semantic_rank: int | None

    class Config:
        from_attributes = True


class AlarmSearchResponse(BaseModel):
    """Alarm search response."""

    results: list[AlarmResult]
    total: int
    query: str
```

**Step 4: Write router**

```python
# src/scavenger/api/routers/__init__.py
"""API routers package."""
from scavenger.api.routers.search import router as search_router

__all__ = ["search_router"]
```

```python
# src/scavenger/api/routers/search.py
"""Search API router."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from scavenger.api.schemas.search import (
    AlarmSearchRequest,
    AlarmSearchResponse,
    AlarmResult,
)
from scavenger.config import get_settings
from scavenger.db.session import get_session
from scavenger.search.alarm_search import AlarmSearcher, AlarmSearchQuery
from scavenger.search.embeddings import EmbeddingService

router = APIRouter(prefix="/search", tags=["search"])


async def get_db_session():
    """Dependency for database session."""
    async with get_session() as session:
        yield session


@router.post("/alarms", response_model=AlarmSearchResponse)
async def search_alarms(
    request: AlarmSearchRequest,
    session: AsyncSession = Depends(get_db_session),
):
    """Hybrid search for equipment alarms."""
    settings = get_settings()

    if not settings.openai_api_key.get_secret_value():
        raise HTTPException(
            status_code=503,
            detail="OpenAI API key not configured",
        )

    embedding_service = EmbeddingService(
        api_key=settings.openai_api_key.get_secret_value(),
        model=settings.embedding_model,
    )

    searcher = AlarmSearcher(session=session, embedding_service=embedding_service)

    query = AlarmSearchQuery(
        text=request.query,
        vendor=request.vendor,
        process_type=request.process_type,
        limit=request.limit,
        keyword_weight=request.rrf_weights.keyword,
        semantic_weight=request.rrf_weights.semantic,
    )

    results = await searcher.search(query)

    return AlarmSearchResponse(
        results=[
            AlarmResult(
                id=r.alarm.id,
                alid=r.alarm.alid,
                alcd=r.alarm.alcd.value,
                altx=r.alarm.altx,
                module_name=r.alarm.module_name,
                severity=r.alarm.severity,
                probable_causes=r.alarm.probable_causes,
                rrf_score=r.rrf_score,
                keyword_rank=r.keyword_rank,
                semantic_rank=r.semantic_rank,
            )
            for r in results
        ],
        total=len(results),
        query=request.query,
    )
```

**Step 5: Update main.py to include router**

```python
# src/scavenger/api/main.py
"""FastAPI application."""
from contextlib import asynccontextmanager

from fastapi import FastAPI

from scavenger import __version__
from scavenger.api.routers import search_router
from scavenger.db.session import close_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    yield
    await close_db()


app = FastAPI(
    title="Scavenger API",
    description="Semiconductor equipment knowledge base with HSMS runtime",
    version=__version__,
    lifespan=lifespan,
)

# Register routers
app.include_router(search_router, prefix="/api")


@app.get("/")
async def root():
    """API root information."""
    return {
        "name": "Scavenger API",
        "version": __version__,
        "docs": "/docs",
    }


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "ok"}
```

**Step 6: Run test to verify it passes**

```bash
pytest tests/api/test_search.py -v
```
Expected: PASS

**Step 7: Commit**

```bash
git add . && git commit -m "feat(api): add /api/search/alarms endpoint"
```

---

## Phase 6: HSMS Runtime (Foundation)

### Task 6.1: HSMS Connection Manager

**Files:**
- Create: `scavenger/src/scavenger/runtime/__init__.py`
- Create: `scavenger/src/scavenger/runtime/connection.py`
- Create: `scavenger/tests/runtime/__init__.py`
- Create: `scavenger/tests/runtime/test_connection.py`

**Step 1: Write the failing test**

```python
# tests/runtime/__init__.py
"""Runtime tests."""

# tests/runtime/test_connection.py
import pytest
from scavenger.runtime.connection import HsmsConnectionConfig, ConnectionState


def test_connection_config_defaults():
    """HsmsConnectionConfig has sensible defaults."""
    config = HsmsConnectionConfig(host="localhost", port=5000)

    assert config.host == "localhost"
    assert config.port == 5000
    assert config.mode == "passive"
    assert config.t3_timeout == 45.0


def test_connection_state_enum():
    """ConnectionState has expected values."""
    assert ConnectionState.NOT_CONNECTED.value == "not_connected"
    assert ConnectionState.CONNECTED.value == "connected"
    assert ConnectionState.SELECTED.value == "selected"
```

**Step 2: Run test to verify it fails**

```bash
pytest tests/runtime/test_connection.py -v
```
Expected: FAIL

**Step 3: Write implementation**

```python
# src/scavenger/runtime/__init__.py
"""HSMS runtime package."""
from scavenger.runtime.connection import HsmsConnectionConfig, ConnectionState

__all__ = ["HsmsConnectionConfig", "ConnectionState"]
```

```python
# src/scavenger/runtime/connection.py
"""HSMS connection configuration and state."""
from dataclasses import dataclass, field
from enum import Enum
from typing import Literal


class ConnectionState(str, Enum):
    """HSMS connection state machine states."""

    NOT_CONNECTED = "not_connected"
    CONNECTED = "connected"
    SELECTED = "selected"


@dataclass
class HsmsConnectionConfig:
    """HSMS connection configuration."""

    host: str
    port: int
    mode: Literal["active", "passive"] = "passive"
    device_id: int = 1

    # HSMS timeouts (seconds)
    t3_timeout: float = 45.0   # Reply timeout
    t5_timeout: float = 10.0   # Connect separation
    t6_timeout: float = 5.0    # Control timeout
    t7_timeout: float = 10.0   # Not selected timeout
    t8_timeout: float = 5.0    # Network intercharacter timeout
```

**Step 4: Run test to verify it passes**

```bash
pytest tests/runtime/test_connection.py -v
```
Expected: PASS

**Step 5: Commit**

```bash
git add . && git commit -m "feat(runtime): add HSMS connection config and state"
```

---

## Remaining Phases (Summary)

The following phases complete the implementation. Each follows the same TDD pattern:

### Phase 6 (continued): HSMS Runtime
- Task 6.2: Message codec (SML ↔ Python dict)
- Task 6.3: Equipment server (passive mode)
- Task 6.4: Host client (active mode)
- Task 6.5: Scenario runner

### Phase 7: Runtime API
- Task 7.1: Runtime status endpoint
- Task 7.2: Scenario execution endpoints
- Task 7.3: WebSocket event stream

### Phase 8: Integration
- Task 8.1: Embedding population job
- Task 8.2: Full-text tsvector triggers
- Task 8.3: Integration tests with testcontainers

### Phase 9: Final Polish
- Task 9.1: CLI serve command
- Task 9.2: Docker image build test
- Task 9.3: End-to-end test

---

## Quick Reference

**Run all tests:**
```bash
cd scavenger && pytest -v
```

**Start Docker stack:**
```bash
cd scavenger && docker compose up -d
```

**Generate test data:**
```bash
scavenger generate alarms --count 100 --layer schema --seed 42
```

**Run API server:**
```bash
uvicorn scavenger.api.main:app --reload
```

**Create migration:**
```bash
scavenger db migrate -m "initial schema"
scavenger db upgrade
```
