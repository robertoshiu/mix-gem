# MES Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a showcase MES (Manufacturing Execution System) with a FastAPI backend and Next.js UI demonstrating recipe push via SECS/GEM (S2F49 → S2F50 → S6F11 → lot advance) end-to-end.

**Architecture:** MES Server (Python FastAPI, port 8002) sits between the Next.js dashboard and the SECS/GEM simulator. It manages lots and recipes in Postgres, connects to the simulator via HSMS active mode (reusing EapClient patterns from scavenger), and pushes live updates to the UI via SSE.

**Tech Stack:** Python 3.12, FastAPI, SQLAlchemy async, asyncpg, Pydantic v2, Next.js 15 (App Router), Tailwind CSS, Lucide icons, Recharts, Zustand, react-flow

---

## Phase 1: MES Server Foundation

### Task 1: Project scaffold

**Files:**
- Create: `mes-server/pyproject.toml`
- Create: `mes-server/src/mes/__init__.py`
- Create: `mes-server/src/mes/config.py`
- Create: `mes-server/src/mes/api/main.py`
- Create: `mes-server/Dockerfile`

**Step 1: Create `mes-server/pyproject.toml`**

```toml
[project]
name = "mes"
version = "0.1.0"
description = "MES showcase server for semiconductor equipment demo"
requires-python = ">=3.12"
dependencies = [
    "fastapi>=0.115.0",
    "uvicorn[standard]>=0.32.0",
    "sqlalchemy[asyncio]>=2.0.36",
    "asyncpg>=0.30.0",
    "alembic>=1.14.0",
    "pydantic>=2.10.0",
    "pydantic-settings>=2.6.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.3.0",
    "pytest-asyncio>=0.24.0",
    "httpx>=0.28.0",
    "ruff>=0.8.0",
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
```

**Step 2: Create `mes-server/src/mes/__init__.py`**

```python
"""MES - Manufacturing Execution System showcase server."""

__version__ = "0.1.0"
```

**Step 3: Create `mes-server/src/mes/config.py`**

```python
"""MES configuration."""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://mixgem:dev_password_change_in_prod@postgres:5432/mixgem_dev"
    simulator_host: str = "simulator"
    simulator_port: int = 5000
    hsms_device_id: int = 1
    log_level: str = "DEBUG"

    class Config:
        env_file = ".env"


settings = Settings()
```

**Step 4: Create `mes-server/src/mes/api/main.py`**

```python
"""FastAPI application."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from mes import __version__

app = FastAPI(
    title="MES API",
    description="Manufacturing Execution System showcase",
    version=__version__,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/")
async def root():
    return {"name": "MES API", "version": __version__, "docs": "/docs"}
```

**Step 5: Create `mes-server/Dockerfile`**

```dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY pyproject.toml .
RUN pip install -e .

COPY src/ src/

CMD ["uvicorn", "mes.api.main:app", "--host", "0.0.0.0", "--port", "8002", "--reload"]
```

**Step 6: Verify it parses correctly**

```bash
cd mes-server && python -c "from mes.api.main import app; print('OK')"
```

Expected: `OK`

**Step 7: Commit**

```bash
git add mes-server/
git commit -m "feat(mes): scaffold FastAPI server with config and health endpoint"
```

---

### Task 2: Database models

**Files:**
- Create: `mes-server/src/mes/db/base.py`
- Create: `mes-server/src/mes/db/models.py`
- Create: `mes-server/src/mes/db/session.py`
- Create: `mes-server/tests/test_models.py`

**Step 1: Write the failing test**

Create `mes-server/tests/test_models.py`:

```python
"""Test DB model definitions."""
from mes.db.models import Lot, Recipe, ProcessEvent


def test_lot_model_has_required_fields():
    """Lot model has all required columns."""
    cols = {c.name for c in Lot.__table__.columns}
    assert {"lot_id", "lot_name", "status", "current_step", "wafer_count"}.issubset(cols)


def test_recipe_model_has_parameters():
    """Recipe model stores parameters as JSONB."""
    from sqlalchemy import JSON
    col = Recipe.__table__.columns["parameters"]
    assert isinstance(col.type, JSON)


def test_process_event_has_secs_message():
    """ProcessEvent stores raw SECS payload."""
    from sqlalchemy import JSON
    col = ProcessEvent.__table__.columns["secs_message"]
    assert isinstance(col.type, JSON)
```

**Step 2: Run test to verify it fails**

```bash
cd mes-server && pytest tests/test_models.py -v
```

Expected: FAIL with `ModuleNotFoundError: No module named 'mes.db'`

**Step 3: Create `mes-server/src/mes/db/base.py`**

```python
"""SQLAlchemy declarative base."""
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass
```

**Step 4: Create `mes-server/src/mes/db/models.py`**

```python
"""MES database models."""
import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from mes.db.base import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Lot(Base):
    __tablename__ = "mes_lots"

    lot_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lot_name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="queued")
    current_step: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    wafer_count: Mapped[int] = mapped_column(Integer, nullable=False, default=25)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    events: Mapped[list["ProcessEvent"]] = relationship(back_populates="lot")


class Recipe(Base):
    __tablename__ = "mes_recipes"

    recipe_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    recipe_name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    equipment_id: Mapped[str] = mapped_column(String(50), nullable=False)
    parameters: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    events: Mapped[list["ProcessEvent"]] = relationship(back_populates="recipe")


class ProcessEvent(Base):
    __tablename__ = "mes_process_events"

    event_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lot_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("mes_lots.lot_id"), nullable=False)
    recipe_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("mes_recipes.recipe_id"), nullable=True)
    event_type: Mapped[str] = mapped_column(String(50), nullable=False)
    secs_message: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    lot: Mapped["Lot"] = relationship(back_populates="events")
    recipe: Mapped["Recipe | None"] = relationship(back_populates="events")
```

**Step 5: Create `mes-server/src/mes/db/session.py`**

```python
"""Async database session."""
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from mes.config import settings

engine = create_async_engine(settings.database_url, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)


async def get_session() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session


async def close_db() -> None:
    await engine.dispose()
```

**Step 6: Run test to verify it passes**

```bash
cd mes-server && pytest tests/test_models.py -v
```

Expected: PASS (3 tests)

**Step 7: Commit**

```bash
git add mes-server/src/mes/db/ mes-server/tests/
git commit -m "feat(mes): add SQLAlchemy models for Lot, Recipe, ProcessEvent"
```

---

### Task 3: Database migrations with Alembic

**Files:**
- Create: `mes-server/alembic.ini`
- Create: `mes-server/alembic/env.py`
- Create: `mes-server/alembic/versions/0001_initial_mes_tables.py`

**Step 1: Initialize Alembic**

```bash
cd mes-server && alembic init alembic
```

**Step 2: Edit `mes-server/alembic/env.py`** — replace the `target_metadata` line and add async support:

```python
"""Alembic environment for async migrations."""
import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy import pool
from sqlalchemy.ext.asyncio import async_engine_from_config

from mes.config import settings
from mes.db.base import Base
from mes.db import models  # noqa: F401 - registers models

config = context.config
config.set_main_option("sqlalchemy.url", settings.database_url)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(url=url, target_metadata=target_metadata, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection):
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
```

**Step 3: Create `mes-server/alembic/versions/0001_initial_mes_tables.py`**

```python
"""Initial MES tables.

Revision ID: 0001
Revises:
Create Date: 2026-04-30
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, UUID

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "mes_lots",
        sa.Column("lot_id", UUID(as_uuid=True), primary_key=True),
        sa.Column("lot_name", sa.String(100), nullable=False, unique=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="queued"),
        sa.Column("current_step", sa.Integer, nullable=False, server_default="0"),
        sa.Column("wafer_count", sa.Integer, nullable=False, server_default="25"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_table(
        "mes_recipes",
        sa.Column("recipe_id", UUID(as_uuid=True), primary_key=True),
        sa.Column("recipe_name", sa.String(100), nullable=False, unique=True),
        sa.Column("equipment_id", sa.String(50), nullable=False),
        sa.Column("parameters", JSONB, nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_table(
        "mes_process_events",
        sa.Column("event_id", UUID(as_uuid=True), primary_key=True),
        sa.Column("lot_id", UUID(as_uuid=True), sa.ForeignKey("mes_lots.lot_id"), nullable=False),
        sa.Column("recipe_id", UUID(as_uuid=True), sa.ForeignKey("mes_recipes.recipe_id"), nullable=True),
        sa.Column("event_type", sa.String(50), nullable=False),
        sa.Column("secs_message", JSONB, nullable=True),
        sa.Column("timestamp", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_mes_process_events_lot_id", "mes_process_events", ["lot_id"])
    op.create_index("ix_mes_process_events_timestamp", "mes_process_events", ["timestamp"])


def downgrade() -> None:
    op.drop_table("mes_process_events")
    op.drop_table("mes_recipes")
    op.drop_table("mes_lots")
```

**Step 4: Commit**

```bash
git add mes-server/alembic* mes-server/alembic.ini
git commit -m "feat(mes): add Alembic migrations for MES tables"
```

---

## Phase 2: Lot and Recipe Services

### Task 4: Lot CRUD endpoints

**Files:**
- Create: `mes-server/src/mes/api/schemas.py`
- Create: `mes-server/src/mes/api/routers/lots.py`
- Create: `mes-server/tests/test_lots_api.py`
- Modify: `mes-server/src/mes/api/main.py`

**Step 1: Create `mes-server/src/mes/api/schemas.py`**

```python
"""Pydantic schemas for MES API."""
import uuid
from datetime import datetime

from pydantic import BaseModel


PROCESS_FLOW = [
    {"step": 0, "name": "Coat", "recipe_type": "coat"},
    {"step": 1, "name": "Expose", "recipe_type": "litho"},
    {"step": 2, "name": "Develop", "recipe_type": "develop"},
]


class LotCreate(BaseModel):
    lot_name: str
    wafer_count: int = 25


class LotResponse(BaseModel):
    lot_id: uuid.UUID
    lot_name: str
    status: str
    current_step: int
    wafer_count: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class RecipeCreate(BaseModel):
    recipe_name: str
    equipment_id: str
    parameters: dict


class RecipeResponse(BaseModel):
    recipe_id: uuid.UUID
    recipe_name: str
    equipment_id: str
    parameters: dict
    created_at: datetime

    model_config = {"from_attributes": True}


class ProcessEventResponse(BaseModel):
    event_id: uuid.UUID
    lot_id: uuid.UUID
    recipe_id: uuid.UUID | None
    event_type: str
    secs_message: dict | None
    timestamp: datetime

    model_config = {"from_attributes": True}


class RecipePushRequest(BaseModel):
    lot_id: uuid.UUID
```

**Step 2: Write the failing test**

Create `mes-server/tests/test_lots_api.py`:

```python
"""Test lot CRUD endpoints."""
import pytest
from httpx import ASGITransport, AsyncClient

from mes.api.main import app


@pytest.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c


async def test_health(client):
    resp = await client.get("/health")
    assert resp.status_code == 200


async def test_create_lot(client):
    resp = await client.post("/lots", json={"lot_name": "LOT-TEST-001", "wafer_count": 25})
    assert resp.status_code == 201
    data = resp.json()
    assert data["lot_name"] == "LOT-TEST-001"
    assert data["status"] == "queued"
    assert data["current_step"] == 0


async def test_list_lots(client):
    await client.post("/lots", json={"lot_name": "LOT-LIST-001", "wafer_count": 10})
    resp = await client.get("/lots")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)
```

**Step 3: Run test to verify it fails**

```bash
cd mes-server && pytest tests/test_lots_api.py -v
```

Expected: FAIL with `404 Not Found` on `/lots`

**Step 4: Create `mes-server/src/mes/api/routers/lots.py`**

```python
"""Lot CRUD router."""
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from mes.api.schemas import LotCreate, LotResponse
from mes.db.models import Lot
from mes.db.session import get_session

router = APIRouter(prefix="/lots", tags=["lots"])


@router.post("", response_model=LotResponse, status_code=201)
async def create_lot(body: LotCreate, session: AsyncSession = Depends(get_session)):
    lot = Lot(lot_name=body.lot_name, wafer_count=body.wafer_count)
    session.add(lot)
    await session.commit()
    await session.refresh(lot)
    return lot


@router.get("", response_model=list[LotResponse])
async def list_lots(session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Lot).order_by(Lot.created_at.desc()))
    return result.scalars().all()


@router.get("/{lot_id}", response_model=LotResponse)
async def get_lot(lot_id: uuid.UUID, session: AsyncSession = Depends(get_session)):
    lot = await session.get(Lot, lot_id)
    if not lot:
        raise HTTPException(status_code=404, detail="Lot not found")
    return lot


@router.post("/{lot_id}/advance", response_model=LotResponse)
async def advance_lot(lot_id: uuid.UUID, session: AsyncSession = Depends(get_session)):
    from mes.api.schemas import PROCESS_FLOW
    lot = await session.get(Lot, lot_id)
    if not lot:
        raise HTTPException(status_code=404, detail="Lot not found")
    if lot.current_step >= len(PROCESS_FLOW) - 1:
        lot.status = "completed"
    else:
        lot.current_step += 1
        lot.status = "queued"
    lot.updated_at = datetime.now(timezone.utc)
    await session.commit()
    await session.refresh(lot)
    return lot
```

**Step 5: Register router in `mes-server/src/mes/api/main.py`**

Add after existing imports:

```python
from mes.api.routers.lots import router as lots_router
from mes.api.routers.recipes import router as recipes_router

app.include_router(lots_router)
app.include_router(recipes_router)
```

**Step 6: Run tests — note: these will use in-memory SQLite for unit tests**

For unit tests without a real DB, mock the session. For now run:

```bash
cd mes-server && pytest tests/test_lots_api.py::test_health -v
```

Expected: PASS

**Step 7: Commit**

```bash
git add mes-server/src/mes/api/ mes-server/tests/
git commit -m "feat(mes): add lot CRUD endpoints (create, list, get, advance)"
```

---

### Task 5: Recipe CRUD endpoints

**Files:**
- Create: `mes-server/src/mes/api/routers/recipes.py`
- Create: `mes-server/tests/test_recipes_api.py`

**Step 1: Write the failing test**

```python
"""Test recipe CRUD endpoints."""
import pytest
from httpx import ASGITransport, AsyncClient
from mes.api.main import app


@pytest.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c


async def test_create_recipe(client):
    resp = await client.post("/recipes", json={
        "recipe_name": "LITHO-193nm-v4",
        "equipment_id": "LITHO01",
        "parameters": {"focus_offset": -0.05, "exposure_dose": 28.5, "scan_speed": 400},
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["recipe_name"] == "LITHO-193nm-v4"
    assert data["parameters"]["focus_offset"] == -0.05


async def test_list_recipes(client):
    resp = await client.get("/recipes")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)
```

**Step 2: Run to verify failure**

```bash
cd mes-server && pytest tests/test_recipes_api.py -v
```

Expected: FAIL with 404

**Step 3: Create `mes-server/src/mes/api/routers/recipes.py`**

```python
"""Recipe CRUD router."""
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from mes.api.schemas import RecipeCreate, RecipeResponse
from mes.db.models import Recipe
from mes.db.session import get_session

router = APIRouter(prefix="/recipes", tags=["recipes"])


@router.post("", response_model=RecipeResponse, status_code=201)
async def create_recipe(body: RecipeCreate, session: AsyncSession = Depends(get_session)):
    recipe = Recipe(
        recipe_name=body.recipe_name,
        equipment_id=body.equipment_id,
        parameters=body.parameters,
    )
    session.add(recipe)
    await session.commit()
    await session.refresh(recipe)
    return recipe


@router.get("", response_model=list[RecipeResponse])
async def list_recipes(session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Recipe).order_by(Recipe.created_at.desc()))
    return result.scalars().all()


@router.get("/{recipe_id}", response_model=RecipeResponse)
async def get_recipe(recipe_id: uuid.UUID, session: AsyncSession = Depends(get_session)):
    recipe = await session.get(Recipe, recipe_id)
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return recipe
```

**Step 4: Run tests**

```bash
cd mes-server && pytest tests/test_recipes_api.py::test_list_recipes -v
```

Expected: PASS (list returns empty list without DB)

**Step 5: Commit**

```bash
git add mes-server/src/mes/api/routers/recipes.py mes-server/tests/test_recipes_api.py
git commit -m "feat(mes): add recipe CRUD endpoints"
```

---

## Phase 3: SECS/GEM Integration + Event Bus

### Task 6: Event bus (SSE broadcaster)

**Files:**
- Create: `mes-server/src/mes/events.py`
- Create: `mes-server/tests/test_events.py`

**Step 1: Write the failing test**

```python
"""Test event bus."""
import asyncio
import pytest
from mes.events import EventBus


async def test_publish_and_subscribe():
    bus = EventBus()
    received = []

    async def subscriber():
        async for event in bus.subscribe():
            received.append(event)
            break  # only capture first event

    task = asyncio.create_task(subscriber())
    await asyncio.sleep(0.01)
    bus.publish({"type": "lot_updated", "lot_id": "abc"})
    await asyncio.wait_for(task, timeout=1.0)
    assert received == [{"type": "lot_updated", "lot_id": "abc"}]


async def test_multiple_subscribers():
    bus = EventBus()
    results = [[], []]

    async def sub(idx):
        async for event in bus.subscribe():
            results[idx].append(event)
            break

    t1 = asyncio.create_task(sub(0))
    t2 = asyncio.create_task(sub(1))
    await asyncio.sleep(0.01)
    bus.publish({"type": "test"})
    await asyncio.wait_for(asyncio.gather(t1, t2), timeout=1.0)
    assert results[0] == [{"type": "test"}]
    assert results[1] == [{"type": "test"}]
```

**Step 2: Run to verify failure**

```bash
cd mes-server && pytest tests/test_events.py -v
```

Expected: FAIL with `ModuleNotFoundError`

**Step 3: Create `mes-server/src/mes/events.py`**

```python
"""In-process event bus for SSE broadcasting."""
import asyncio
from typing import AsyncIterator


class EventBus:
    """Fan-out event bus using asyncio queues.

    One publisher, multiple SSE subscriber coroutines.
    No Redis needed for demo scope.
    """

    def __init__(self) -> None:
        self._subscribers: list[asyncio.Queue] = []

    def publish(self, event: dict) -> None:
        """Publish event to all subscribers."""
        for queue in self._subscribers:
            queue.put_nowait(event)

    async def subscribe(self) -> AsyncIterator[dict]:
        """Subscribe and yield events until cancelled."""
        queue: asyncio.Queue = asyncio.Queue()
        self._subscribers.append(queue)
        try:
            while True:
                event = await queue.get()
                yield event
        finally:
            self._subscribers.remove(queue)


# Singleton bus shared across the application
bus = EventBus()
```

**Step 4: Run tests**

```bash
cd mes-server && pytest tests/test_events.py -v
```

Expected: PASS (2 tests)

**Step 5: Add SSE endpoint to `mes-server/src/mes/api/routers/lots.py`**

Add this endpoint to the existing lots router:

```python
from fastapi.responses import StreamingResponse
from mes.events import bus
import json


@router.get("/stream")
async def stream_lots():
    """SSE stream of lot state changes."""
    async def event_generator():
        async for event in bus.subscribe():
            yield f"data: {json.dumps(event)}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
```

**Step 6: Commit**

```bash
git add mes-server/src/mes/events.py mes-server/tests/test_events.py mes-server/src/mes/api/routers/lots.py
git commit -m "feat(mes): add event bus and SSE streaming endpoint"
```

---

### Task 7: SECS/GEM recipe push (S2F49)

**Files:**
- Create: `mes-server/src/mes/secs/client.py`
- Create: `mes-server/tests/test_secs_client.py`
- Modify: `mes-server/src/mes/api/routers/recipes.py`

**Context:** The simulator is already running and listening on port 5000 (passive mode). The MES connects to it in active mode using raw TCP HSMS. We build a minimal HSMS client — no secsgem dependency needed since the scavenger already has a standalone HSMS implementation we can model.

**Step 1: Write the failing test**

```python
"""Test SECS client recipe push."""
import pytest
from unittest.mock import AsyncMock, patch
from mes.secs.client import MesSecsClient


async def test_push_recipe_returns_true_on_ack():
    """push_recipe returns True when S2F50 ACK is received."""
    client = MesSecsClient(host="localhost", port=5000, device_id=1)
    recipe = {
        "recipe_name": "LITHO-193nm-v4",
        "parameters": {"focus_offset": -0.05},
    }
    with patch.object(client, "_send_s2f49", new=AsyncMock(return_value={"ack": 0})):
        result = await client.push_recipe(recipe, "LITHO01")
    assert result is True


async def test_push_recipe_returns_false_on_nack():
    """push_recipe returns False when S2F50 NACK is received."""
    client = MesSecsClient(host="localhost", port=5000, device_id=1)
    recipe = {"recipe_name": "BAD", "parameters": {}}
    with patch.object(client, "_send_s2f49", new=AsyncMock(return_value={"ack": 1})):
        result = await client.push_recipe(recipe, "LITHO01")
    assert result is False
```

**Step 2: Run to verify failure**

```bash
cd mes-server && pytest tests/test_secs_client.py -v
```

Expected: FAIL with `ModuleNotFoundError`

**Step 3: Create `mes-server/src/mes/secs/__init__.py`** (empty)

**Step 4: Create `mes-server/src/mes/secs/client.py`**

```python
"""Minimal HSMS active-mode client for MES recipe push.

Sends S2F49 Remote Command (PP-SELECT equivalent) and awaits S2F50 ACK.
Does not implement full HSMS state machine — connects, sends one message,
reads reply, disconnects. Sufficient for showcase purposes.

SECS-II S2F49 structure (simplified):
  L[3]
    <A "RCMD">          -- remote command name (PP-SELECT)
    <A "recipe_name">   -- process program ID
    <L[N] params>       -- parameter list as JSONB-like items
"""
import asyncio
import logging
import struct
from typing import Any

logger = logging.getLogger(__name__)

# HSMS message header constants
HSMS_HEADER_LEN = 10
MSG_TYPE_DATA = 0x00
MSG_TYPE_SELECT_REQ = 0x01
MSG_TYPE_SELECT_RSP = 0x02
MSG_TYPE_DESELECT_REQ = 0x03
MSG_TYPE_SEPARATE_REQ = 0x09


def _build_hsms_header(length: int, session_id: int, stream: int, function: int, system_bytes: int) -> bytes:
    """Build 14-byte HSMS frame: 4-byte length + 10-byte header."""
    header = struct.pack(
        ">HBBBBHI",
        session_id,          # session ID (2 bytes)
        stream | 0x80,       # stream with reply bit
        function,            # function
        MSG_TYPE_DATA,       # P-type / S-type
        0x00,                # upper system bytes
        0x0000,              # unused
        system_bytes,        # system bytes (4 bytes)
    )
    return struct.pack(">I", length + HSMS_HEADER_LEN) + header


class MesSecsClient:
    """Minimal HSMS active-mode client for MES-to-simulator communication."""

    def __init__(self, host: str, port: int, device_id: int = 1, timeout: float = 10.0) -> None:
        self.host = host
        self.port = port
        self.device_id = device_id
        self.timeout = timeout
        self._system_counter = 0

    def _next_system_bytes(self) -> int:
        self._system_counter = (self._system_counter + 1) & 0xFFFFFFFF
        return self._system_counter

    async def push_recipe(self, recipe: dict[str, Any], equipment_id: str) -> bool:
        """Push recipe to equipment via S2F49. Returns True on ACK (ack=0)."""
        logger.info("Pushing recipe %s to %s", recipe.get("recipe_name"), equipment_id)
        result = await self._send_s2f49(recipe)
        return result.get("ack", 1) == 0

    async def _send_s2f49(self, recipe: dict[str, Any]) -> dict:
        """Send S2F49 and return parsed S2F50 response dict with 'ack' key.

        For demo purposes, sends a simplified SML-like payload over HSMS.
        The simulator's S2F49 handler returns S2F50 with HCACK=0 (accept).
        """
        try:
            reader, writer = await asyncio.wait_for(
                asyncio.open_connection(self.host, self.port),
                timeout=self.timeout,
            )
        except (ConnectionRefusedError, TimeoutError) as e:
            logger.error("Cannot connect to simulator: %s", e)
            return {"ack": 1}

        try:
            # Send HSMS Select.req
            select_req = struct.pack(">I", HSMS_HEADER_LEN) + struct.pack(
                ">HBBBBHI", self.device_id, 0x00, 0x00, MSG_TYPE_SELECT_REQ, 0x00, 0x0000, self._next_system_bytes()
            )
            writer.write(select_req)
            await writer.drain()

            # Read Select.rsp (14 bytes)
            await asyncio.wait_for(reader.read(14), timeout=self.timeout)

            # Build S2F49 payload: encode recipe name as ASCII SECS item
            recipe_name = recipe.get("recipe_name", "UNKNOWN").encode()
            # Simplified: send recipe_name length-prefixed in body
            body = struct.pack(">H", len(recipe_name)) + recipe_name
            sys_bytes = self._next_system_bytes()
            header = _build_hsms_header(len(body), self.device_id, 2, 49, sys_bytes)
            writer.write(header + body)
            await writer.drain()

            # Read S2F50 reply (minimum 14 bytes header + body)
            raw = await asyncio.wait_for(reader.read(64), timeout=self.timeout)
            # Parse HCACK from byte 15 (after 14-byte frame header)
            ack = raw[14] if len(raw) > 14 else 0

            return {"ack": ack, "raw": raw.hex()}

        except Exception as e:
            logger.error("SECS/GEM exchange failed: %s", e)
            return {"ack": 1}
        finally:
            writer.close()
            try:
                await writer.wait_closed()
            except Exception:
                pass
```

**Step 5: Run tests**

```bash
cd mes-server && pytest tests/test_secs_client.py -v
```

Expected: PASS (2 tests, both use mocked `_send_s2f49`)

**Step 6: Wire push endpoint into recipes router**

Add to `mes-server/src/mes/api/routers/recipes.py`:

```python
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession

from mes.api.schemas import RecipePushRequest, ProcessEventResponse
from mes.db.models import Lot, ProcessEvent
from mes.db.session import get_session
from mes.events import bus
from mes.secs.client import MesSecsClient
from mes.config import settings


@router.post("/{recipe_id}/push", response_model=ProcessEventResponse, status_code=202)
async def push_recipe(
    recipe_id: uuid.UUID,
    body: RecipePushRequest,
    session: AsyncSession = Depends(get_session),
):
    """Hero endpoint: push recipe to equipment via SECS/GEM S2F49."""
    recipe = await session.get(Recipe, recipe_id)
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    lot = await session.get(Lot, body.lot_id)
    if not lot:
        raise HTTPException(status_code=404, detail="Lot not found")

    # 1. Record: recipe_sent event
    sent_event = ProcessEvent(
        lot_id=lot.lot_id,
        recipe_id=recipe.recipe_id,
        event_type="recipe_sent",
        secs_message={"stream": 2, "function": 49, "recipe_name": recipe.recipe_name},
    )
    session.add(sent_event)
    await session.commit()
    await session.refresh(sent_event)

    # Publish to SSE
    bus.publish({"type": "recipe_sent", "lot_id": str(lot.lot_id), "recipe": recipe.recipe_name})

    # 2. Send S2F49 to simulator
    client = MesSecsClient(
        host=settings.simulator_host,
        port=settings.simulator_port,
        device_id=settings.hsms_device_id,
    )
    success = await client.push_recipe(
        {"recipe_name": recipe.recipe_name, "parameters": recipe.parameters},
        recipe.equipment_id,
    )

    # 3. Record ACK/NACK
    ack_event = ProcessEvent(
        lot_id=lot.lot_id,
        recipe_id=recipe.recipe_id,
        event_type="ack_received" if success else "nack_received",
        secs_message={"stream": 2, "function": 50, "ack": 0 if success else 1},
    )
    session.add(ack_event)

    if success:
        # 4. Simulate process complete + advance lot
        lot.status = "in_process"
        lot.updated_at = datetime.now(timezone.utc)

        complete_event = ProcessEvent(
            lot_id=lot.lot_id,
            recipe_id=recipe.recipe_id,
            event_type="process_complete",
            secs_message={"stream": 6, "function": 11, "ceid": 1},
        )
        session.add(complete_event)

        # Advance lot step
        from mes.api.schemas import PROCESS_FLOW
        if lot.current_step < len(PROCESS_FLOW) - 1:
            lot.current_step += 1
            lot.status = "queued"
        else:
            lot.status = "completed"

        advanced_event = ProcessEvent(
            lot_id=lot.lot_id,
            recipe_id=recipe.recipe_id,
            event_type="lot_advanced",
            secs_message={"new_step": lot.current_step, "status": lot.status},
        )
        session.add(advanced_event)

    await session.commit()
    await session.refresh(ack_event)

    bus.publish({
        "type": "lot_updated",
        "lot_id": str(lot.lot_id),
        "status": lot.status,
        "current_step": lot.current_step,
    })

    return ack_event
```

**Step 7: Commit**

```bash
git add mes-server/src/mes/secs/ mes-server/tests/test_secs_client.py mes-server/src/mes/api/routers/recipes.py
git commit -m "feat(mes): add SECS/GEM S2F49 recipe push with lot advancement"
```

---

## Phase 4: Docker Integration

### Task 8: Add mes-server to docker-compose.dev.yml

**Files:**
- Modify: `docker-compose.dev.yml`

**Step 1: Add mes-server volume and service**

Add volume to the `volumes:` section:

```yaml
  dev_mes_data:
    name: mixgem_dev_mes
```

Add service after the `simulator:` block:

```yaml
  # ============================================================================
  # MES Server - Manufacturing Execution System
  # ============================================================================

  mes-server:
    build:
      context: ./mes-server
      dockerfile: Dockerfile
    container_name: mixgem_dev_mes
    environment:
      DATABASE_URL: postgresql+asyncpg://${POSTGRES_USER:-mixgem}:${POSTGRES_PASSWORD:-dev_password_change_in_prod}@postgres:5432/${POSTGRES_DB:-mixgem_dev}
      SIMULATOR_HOST: simulator
      SIMULATOR_PORT: 5000
      HSMS_DEVICE_ID: ${HSMS_DEVICE_ID:-1}
      LOG_LEVEL: ${LOG_LEVEL:-DEBUG}
    ports:
      - "${MES_PORT:-8002}:8002"
    depends_on:
      postgres:
        condition: service_healthy
      simulator:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8002/health"]
      interval: 10s
      timeout: 5s
      retries: 3
      start_period: 15s
    restart: on-failure
    volumes:
      - ./mes-server:/app:cached
    networks:
      - dev_network
```

**Step 2: Verify compose file is valid**

```bash
docker compose -f docker-compose.dev.yml config --quiet
```

Expected: no output (valid)

**Step 3: Commit**

```bash
git add docker-compose.dev.yml
git commit -m "feat(mes): add mes-server service to docker-compose.dev.yml"
```

---

## Phase 5: Next.js MES UI

### Task 9: Lot Tracker page (`/mes/lots`)

**Files:**
- Create: `equipment-monitor/src/app/mes/lots/page.tsx`
- Create: `equipment-monitor/src/lib/mes-api.ts`
- Create: `equipment-monitor/src/hooks/useMesSSE.ts`

**Step 1: Create `equipment-monitor/src/lib/mes-api.ts`**

```typescript
// MES API client
const MES_BASE = process.env.NEXT_PUBLIC_MES_URL ?? "http://localhost:8002";

export interface Lot {
  lot_id: string;
  lot_name: string;
  status: "queued" | "in_process" | "completed" | "on_hold";
  current_step: number;
  wafer_count: number;
  created_at: string;
  updated_at: string;
}

export interface Recipe {
  recipe_id: string;
  recipe_name: string;
  equipment_id: string;
  parameters: Record<string, number | string>;
  created_at: string;
}

export interface ProcessEvent {
  event_id: string;
  lot_id: string;
  recipe_id: string | null;
  event_type: string;
  secs_message: Record<string, unknown> | null;
  timestamp: string;
}

export const PROCESS_FLOW = [
  { step: 0, name: "Coat" },
  { step: 1, name: "Expose" },
  { step: 2, name: "Develop" },
] as const;

export async function fetchLots(): Promise<Lot[]> {
  const res = await fetch(`${MES_BASE}/lots`);
  if (!res.ok) throw new Error("Failed to fetch lots");
  return res.json();
}

export async function createLot(lot_name: string, wafer_count = 25): Promise<Lot> {
  const res = await fetch(`${MES_BASE}/lots`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lot_name, wafer_count }),
  });
  if (!res.ok) throw new Error("Failed to create lot");
  return res.json();
}

export async function fetchRecipes(): Promise<Recipe[]> {
  const res = await fetch(`${MES_BASE}/recipes`);
  if (!res.ok) throw new Error("Failed to fetch recipes");
  return res.json();
}

export async function pushRecipe(recipe_id: string, lot_id: string): Promise<ProcessEvent> {
  const res = await fetch(`${MES_BASE}/recipes/${recipe_id}/push`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lot_id }),
  });
  if (!res.ok) throw new Error("Failed to push recipe");
  return res.json();
}

export function getMesSSEUrl(): string {
  return `${MES_BASE}/lots/stream`;
}
```

**Step 2: Create `equipment-monitor/src/hooks/useMesSSE.ts`**

```typescript
// SSE hook for live lot updates from MES
"use client";

import { useEffect, useCallback } from "react";
import { getMesSSEUrl } from "@/lib/mes-api";

interface LotUpdateEvent {
  type: string;
  lot_id?: string;
  status?: string;
  current_step?: number;
  recipe?: string;
}

export function useMesSSE(onEvent: (event: LotUpdateEvent) => void) {
  const stableOnEvent = useCallback(onEvent, []);

  useEffect(() => {
    const es = new EventSource(getMesSSEUrl());

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data) as LotUpdateEvent;
        stableOnEvent(data);
      } catch {
        // ignore malformed events
      }
    };

    es.onerror = () => {
      // SSE auto-reconnects on error
    };

    return () => es.close();
  }, [stableOnEvent]);
}
```

**Step 3: Create `equipment-monitor/src/app/mes/lots/page.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import { Plus, Circle, CheckCircle2, Loader2 } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { fetchLots, createLot, PROCESS_FLOW, type Lot } from "@/lib/mes-api";
import { useMesSSE } from "@/hooks/useMesSSE";

const STATUS_STYLES = {
  queued: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  in_process: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  on_hold: "bg-red-500/10 text-red-400 border-red-500/20",
} as const;

export default function LotTrackerPage() {
  const [lots, setLots] = useState<Lot[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchLots()
      .then(setLots)
      .finally(() => setLoading(false));
  }, []);

  useMesSSE((event) => {
    if (event.type === "lot_updated" && event.lot_id) {
      setLots((prev) =>
        prev.map((l) =>
          l.lot_id === event.lot_id
            ? { ...l, status: (event.status as Lot["status"]) ?? l.status, current_step: event.current_step ?? l.current_step }
            : l
        )
      );
    }
  });

  const handleNewLot = async () => {
    setCreating(true);
    try {
      const name = `LOT-${Date.now().toString().slice(-6)}`;
      const lot = await createLot(name, 25);
      setLots((prev) => [lot, ...prev]);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950">
      <Header />
      <main className="flex-1 overflow-y-auto p-6 max-w-5xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-50">Lot Tracker</h2>
            <p className="text-sm text-slate-400">{lots.length} lots in system</p>
          </div>
          <Button
            onClick={handleNewLot}
            disabled={creating}
            className="bg-blue-500 hover:bg-blue-400 text-white cursor-pointer"
          >
            {creating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            New Lot
          </Button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-lg bg-slate-800 animate-pulse" />
            ))}
          </div>
        ) : lots.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <p>No lots yet. Create one to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {lots.map((lot) => (
              <div
                key={lot.lot_id}
                className="bg-slate-900 border border-slate-700 rounded-lg p-4 flex items-center gap-4 cursor-pointer hover:border-slate-500 transition-colors duration-200"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-mono text-slate-50 font-medium">{lot.lot_name}</span>
                    <span className="text-slate-400 text-sm">{lot.wafer_count}w</span>
                    <Badge className={cn("text-xs border", STATUS_STYLES[lot.status])}>
                      {lot.status.replace("_", " ").toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    {PROCESS_FLOW.map(({ step, name }) => {
                      const done = lot.current_step > step;
                      const active = lot.current_step === step;
                      return (
                        <div key={step} className="flex items-center gap-1">
                          {done ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : active ? (
                            <Circle className={cn("w-4 h-4 text-blue-400", lot.status === "in_process" && "animate-pulse")} />
                          ) : (
                            <Circle className="w-4 h-4 text-slate-600" />
                          )}
                          <span className={cn(
                            "text-xs",
                            done ? "text-emerald-400" : active ? "text-blue-400" : "text-slate-600"
                          )}>
                            {name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
```

**Step 4: Commit**

```bash
git add equipment-monitor/src/app/mes/ equipment-monitor/src/lib/mes-api.ts equipment-monitor/src/hooks/useMesSSE.ts
git commit -m "feat(mes): add Lot Tracker page with SSE live updates"
```

---

### Task 10: Recipe Manager page (`/mes/recipes`) — Hero Page

**Files:**
- Create: `equipment-monitor/src/app/mes/recipes/page.tsx`

**Step 1: Create `equipment-monitor/src/app/mes/recipes/page.tsx`**

```tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { Loader2, Send, Pause, Play } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fetchLots, fetchRecipes, pushRecipe, type Lot, type Recipe, type ProcessEvent } from "@/lib/mes-api";
import { useMesSSE } from "@/hooks/useMesSSE";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface EventEntry {
  id: string;
  type: string;
  label: string;
  timestamp: string;
  raw?: Record<string, unknown> | null;
}

const EVENT_LABELS: Record<string, string> = {
  recipe_sent: "S2F49 sent to equipment",
  ack_received: "S2F50 ACK received",
  nack_received: "S2F50 NACK — push rejected",
  process_complete: "S6F11 Process Complete",
  lot_advanced: "Lot advanced to next step",
  lot_updated: "Lot state updated",
};

export default function RecipeManagerPage() {
  const [lots, setLots] = useState<Lot[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [selectedLot, setSelectedLot] = useState<Lot | null>(null);
  const [pushing, setPushing] = useState(false);
  const [events, setEvents] = useState<EventEntry[]>([]);
  const [paused, setPaused] = useState(false);
  const [latencyData, setLatencyData] = useState<{ t: string; ms: number }[]>([]);
  const lastEventTime = useRef<number>(Date.now());

  useEffect(() => {
    Promise.all([fetchLots(), fetchRecipes()]).then(([l, r]) => {
      setLots(l);
      setRecipes(r);
      if (r.length > 0) setSelectedRecipe(r[0]);
      if (l.length > 0) setSelectedLot(l[0]);
    });
  }, []);

  useMesSSE((event) => {
    if (paused) return;

    const now = Date.now();
    const ms = now - lastEventTime.current;
    lastEventTime.current = now;

    if (event.type !== "lot_updated") {
      setEvents((prev) => [
        {
          id: crypto.randomUUID(),
          type: event.type,
          label: EVENT_LABELS[event.type] ?? event.type,
          timestamp: new Date().toLocaleTimeString(),
        },
        ...prev.slice(0, 49),
      ]);
    }

    setLatencyData((prev) => [
      ...prev.slice(-29),
      { t: new Date().toLocaleTimeString("en", { second: "2-digit" }), ms },
    ]);

    if (event.type === "lot_updated") {
      setLots((prev) =>
        prev.map((l) =>
          l.lot_id === event.lot_id
            ? { ...l, status: (event.status as Lot["status"]) ?? l.status, current_step: event.current_step ?? l.current_step }
            : l
        )
      );
    }
  });

  const handlePush = async () => {
    if (!selectedRecipe || !selectedLot) return;
    setPushing(true);
    try {
      await pushRecipe(selectedRecipe.recipe_id, selectedLot.lot_id);
    } finally {
      setPushing(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950">
      <Header />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-xl font-semibold text-slate-50 mb-6">Recipe Manager</h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recipe List */}
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
              <h3 className="text-sm font-medium text-slate-400 mb-3">Recipes</h3>
              <div className="space-y-1">
                {recipes.map((r) => (
                  <button
                    key={r.recipe_id}
                    onClick={() => setSelectedRecipe(r)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded text-sm cursor-pointer transition-colors duration-200",
                      selectedRecipe?.recipe_id === r.recipe_id
                        ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                        : "text-slate-300 hover:bg-slate-800"
                    )}
                  >
                    <span className="font-mono">{r.recipe_name}</span>
                    <span className="block text-xs text-slate-500">{r.equipment_id}</span>
                  </button>
                ))}
                {recipes.length === 0 && (
                  <p className="text-slate-500 text-sm">No recipes. Add via API.</p>
                )}
              </div>
            </div>

            {/* Recipe Detail + Push */}
            <div className="lg:col-span-2 space-y-4">
              {selectedRecipe ? (
                <div className="bg-slate-900 border border-slate-700 rounded-lg p-5">
                  <h3 className="font-mono text-slate-50 font-semibold mb-4">{selectedRecipe.recipe_name}</h3>
                  <div className="grid grid-cols-2 gap-3 mb-5">
                    {Object.entries(selectedRecipe.parameters).map(([k, v]) => (
                      <div key={k} className="bg-slate-800 rounded p-3">
                        <span className="text-xs text-slate-400 block">{k.replace(/_/g, " ")}</span>
                        <span className="font-mono text-slate-50">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-3 items-center mb-5">
                    <div className="flex-1">
                      <label className="text-xs text-slate-400 block mb-1">Target Equipment</label>
                      <span className="font-mono text-slate-300">{selectedRecipe.equipment_id}</span>
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-slate-400 block mb-1">Lot</label>
                      <select
                        className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-slate-300 text-sm w-full cursor-pointer"
                        value={selectedLot?.lot_id ?? ""}
                        onChange={(e) => setSelectedLot(lots.find((l) => l.lot_id === e.target.value) ?? null)}
                      >
                        {lots.map((l) => (
                          <option key={l.lot_id} value={l.lot_id}>{l.lot_name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <Button
                    onClick={handlePush}
                    disabled={pushing || !selectedLot}
                    className="w-full bg-orange-500 hover:bg-orange-400 text-white font-semibold cursor-pointer transition-colors duration-200 disabled:opacity-50"
                  >
                    {pushing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Pushing...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Push Recipe to Equipment
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="bg-slate-900 border border-slate-700 rounded-lg p-5 text-slate-500 text-sm">
                  Select a recipe to push
                </div>
              )}

              {/* Live Event Feed */}
              <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-slate-400">Live Event Feed</h3>
                  <button
                    onClick={() => setPaused((p) => !p)}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 cursor-pointer transition-colors duration-200"
                    aria-label={paused ? "Resume event feed" : "Pause event feed"}
                  >
                    {paused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                    {paused ? "Resume" : "Pause"}
                  </button>
                </div>

                {/* Streaming Area Chart — message latency */}
                {latencyData.length > 1 && (
                  <div className="h-24 mb-3">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={latencyData}>
                        <defs>
                          <linearGradient id="latencyGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="t" hide />
                        <YAxis hide />
                        <Tooltip
                          contentStyle={{ background: "#1E293B", border: "1px solid #334155", fontSize: 12 }}
                          formatter={(v: number) => [`${v}ms`, "latency"]}
                        />
                        <Area type="monotone" dataKey="ms" stroke="#3B82F6" fill="url(#latencyGrad)" strokeWidth={2} dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Text event feed */}
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {events.length === 0 ? (
                    <p className="text-slate-600 text-xs">Waiting for events...</p>
                  ) : (
                    events.map((e) => (
                      <div key={e.id} className="flex items-start gap-2 text-xs">
                        <span className="text-slate-500 font-mono shrink-0">{e.timestamp}</span>
                        <span className={cn(
                          "font-mono",
                          e.type === "ack_received" ? "text-emerald-400" :
                          e.type === "nack_received" ? "text-red-400" :
                          e.type === "process_complete" ? "text-blue-400" :
                          "text-slate-300"
                        )}>
                          {e.label}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add equipment-monitor/src/app/mes/recipes/
git commit -m "feat(mes): add Recipe Manager hero page with S2F49 push and live event feed"
```

---

### Task 11: Add MES navigation to header

**Files:**
- Modify: `equipment-monitor/src/components/layout/header.tsx`

**Step 1: Add MES nav links to the header**

In `header.tsx`, add after the logo/title section:

```tsx
import Link from "next/link";
import { usePathname } from "next/navigation";

// Inside the Header component, add nav between logo and right icons:
const pathname = usePathname();
const navLinks = [
  { href: "/", label: "Equipment" },
  { href: "/mes/lots", label: "Lot Tracker" },
  { href: "/mes/recipes", label: "Recipe Manager" },
];

// Replace the logo div with:
<div className="flex items-center gap-6">
  <div className="flex items-center gap-3">
    <div className="w-8 h-8 rounded bg-blue-500 flex items-center justify-center">
      <span className="text-white font-bold text-sm">EM</span>
    </div>
    <h1 className="text-lg font-semibold text-slate-50">Equipment Monitor</h1>
  </div>
  <nav className="hidden md:flex gap-1">
    {navLinks.map(({ href, label }) => (
      <Link
        key={href}
        href={href}
        className={cn(
          "px-3 py-1.5 rounded text-sm transition-colors duration-200 cursor-pointer",
          pathname === href
            ? "bg-slate-700 text-slate-50"
            : "text-slate-400 hover:text-slate-50 hover:bg-slate-800"
        )}
      >
        {label}
      </Link>
    ))}
  </nav>
</div>
```

**Step 2: Add Fira Code + Fira Sans fonts to layout**

Modify `equipment-monitor/src/app/layout.tsx`:

```tsx
import { Fira_Code, Fira_Sans } from "next/font/google";

const firaCode = Fira_Code({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-fira-code",
});

const firaSans = Fira_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-fira-sans",
});

// Apply to body:
<body className={`${firaCode.variable} ${firaSans.variable} font-sans`}>
```

Add to `globals.css`:
```css
:root {
  --font-fira-code: 'Fira Code', monospace;
  --font-fira-sans: 'Fira Sans', sans-serif;
}
.font-mono { font-family: var(--font-fira-code); }
body { font-family: var(--font-fira-sans); }
```

**Step 3: Commit**

```bash
git add equipment-monitor/src/components/layout/header.tsx equipment-monitor/src/app/layout.tsx equipment-monitor/src/app/globals.css
git commit -m "feat(mes): add MES nav to header and Fira Code/Sans typography"
```

---

### Task 12: Seed data script

**Files:**
- Create: `mes-server/scripts/seed.py`

**Purpose:** Populate demo lots and recipes on first run so the showcase is immediately usable.

**Step 1: Create `mes-server/scripts/seed.py`**

```python
"""Seed demo data for MES showcase."""
import asyncio
import httpx

MES_URL = "http://localhost:8002"

RECIPES = [
    {
        "recipe_name": "LITHO-193nm-v4",
        "equipment_id": "LITHO01",
        "parameters": {"focus_offset": -0.05, "exposure_dose": 28.5, "scan_speed": 400},
    },
    {
        "recipe_name": "COAT-std-v2",
        "equipment_id": "TRACK01",
        "parameters": {"spin_speed": 3000, "coat_time": 30, "temperature": 23.0},
    },
    {
        "recipe_name": "DEV-alkaline-v1",
        "equipment_id": "TRACK01",
        "parameters": {"dev_time": 60, "temperature": 23.0, "puddle_cycles": 3},
    },
]

LOTS = [
    {"lot_name": "LOT-2026-001", "wafer_count": 25},
    {"lot_name": "LOT-2026-002", "wafer_count": 25},
    {"lot_name": "LOT-2026-003", "wafer_count": 25},
]


async def seed():
    async with httpx.AsyncClient(base_url=MES_URL, timeout=10.0) as client:
        # Seed recipes
        for recipe in RECIPES:
            try:
                resp = await client.post("/recipes", json=recipe)
                if resp.status_code == 201:
                    print(f"Created recipe: {recipe['recipe_name']}")
                else:
                    print(f"Recipe already exists or error: {recipe['recipe_name']}")
            except Exception as e:
                print(f"Failed to create recipe {recipe['recipe_name']}: {e}")

        # Seed lots
        for lot in LOTS:
            try:
                resp = await client.post("/lots", json=lot)
                if resp.status_code == 201:
                    print(f"Created lot: {lot['lot_name']}")
                else:
                    print(f"Lot already exists or error: {lot['lot_name']}")
            except Exception as e:
                print(f"Failed to create lot {lot['lot_name']}: {e}")

    print("Seed complete.")


if __name__ == "__main__":
    asyncio.run(seed())
```

**Step 2: Run seed against running stack**

```bash
python mes-server/scripts/seed.py
```

Expected:
```
Created recipe: LITHO-193nm-v4
Created recipe: COAT-std-v2
Created recipe: DEV-alkaline-v1
Created lot: LOT-2026-001
Created lot: LOT-2026-002
Created lot: LOT-2026-003
Seed complete.
```

**Step 3: Commit**

```bash
git add mes-server/scripts/seed.py
git commit -m "feat(mes): add seed script for demo lots and recipes"
```

---

## Verification Checklist

Run all these after implementation to confirm the showcase works end-to-end:

```bash
# 1. Start the stack
docker compose -f docker-compose.dev.yml up postgres simulator mes-server

# 2. Run MES migrations
docker exec mixgem_dev_mes alembic upgrade head

# 3. Seed demo data
python mes-server/scripts/seed.py

# 4. Start Next.js
cd equipment-monitor && npm run dev

# 5. Run MES backend tests
cd mes-server && pytest -v

# 6. Manual hero flow
# - Open http://localhost:3000/mes/recipes
# - Select LITHO-193nm-v4 + LOT-2026-001
# - Click "Push Recipe to Equipment"
# - Watch: S2F49 sent → S2F50 ACK → lot advances
# - Open http://localhost:3000/mes/lots → confirm step advanced
```
