# Scavenger Design Document

**Date**: 2026-01-21
**Status**: Draft
**Codename**: Scavenger

## Overview

Scavenger is a Python-based knowledge acquisition and simulation system for semiconductor equipment. It combines a knowledge base (OnOKB) with an HSMS runtime in a bidirectional closed loop, designed for AI training data generation and domain expertise accumulation.

### Goals

1. **AI Training Data** - Build a high-quality corpus for fine-tuning models and powering RAG systems for equipment troubleshooting
2. **Expertise Accumulation** - Systematically collect and organize semiconductor equipment domain knowledge

### Non-Goals

- Production fab deployment
- Real equipment integration (simulation only)
- Proprietary documentation scraping

## System Architecture

```
┌─────────────────────────────────────────────────┐
│                    OnOKB                        │
│  (alarms, recipes, scenarios, execution logs)   │
└──────────────┬────────────────▲──────────────────┘
               │ scenarios      │ logs/traces
               ▼                │
┌─────────────────────────────────────────────────┐
│              HSMS Runtime                       │
│  (equipment sim, host client, scenario engine)  │
└─────────────────────────────────────────────────┘
```

The KB gets richer with every execution - training data grows organically.

### Subsystems

| Subsystem | Responsibility |
|-----------|----------------|
| **OnOKB** | PostgreSQL + pgvector knowledge base with hybrid RRF search |
| **HSMS Runtime** | Equipment server, host client, scenario engine |
| **CLI** | Data generation, import, DB migrations |
| **API** | FastAPI for search, runtime control, WebSocket events |

## Data Model

### Core Tables

```sql
-- Equipment hierarchy
equipment_vendors (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,  -- ASML, TEL, Lam, Nikon, Canon
    naming_convention_notes TEXT
);

equipment_models (
    id SERIAL PRIMARY KEY,
    vendor_id INTEGER REFERENCES equipment_vendors,
    model_name VARCHAR NOT NULL,
    equipment_type VARCHAR,  -- litho, etch, CVD, PVD
    module_names TEXT[]  -- Chamber, Robot, Chuck, Pump
);

-- Alarm knowledge (SEMI E30 compliant)
alarms (
    id SERIAL PRIMARY KEY,
    equipment_model_id INTEGER REFERENCES equipment_models,
    alid INTEGER NOT NULL,  -- Alarm ID
    alcd INTEGER NOT NULL,  -- Alarm Code (1-8 per E30)
    altx TEXT NOT NULL,  -- Alarm Text
    altx_tsv TSVECTOR,  -- Full-text search
    altx_embedding VECTOR(1536),  -- Semantic search
    module_name VARCHAR,
    severity VARCHAR,
    probable_causes TEXT[],
    recommended_actions TEXT[],
    physics_context JSONB,  -- process params, thresholds, units
    data_layer VARCHAR NOT NULL,  -- schema_only, vendor_flavored, physics_grounded
    provenance_id INTEGER REFERENCES provenance,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Golden recipes
recipes (
    id SERIAL PRIMARY KEY,
    equipment_model_id INTEGER REFERENCES equipment_models,
    recipe_name VARCHAR NOT NULL,
    process_type VARCHAR,
    parameters JSONB,  -- temp, pressure, gas flows, time
    description TEXT,
    description_embedding VECTOR(1536),
    is_golden BOOLEAN DEFAULT FALSE,
    provenance_id INTEGER REFERENCES provenance,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Execution scenarios
scenarios (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    description TEXT,
    steps JSONB,  -- [{sxfy, direction, data, delay_ms}...]
    expected_alarms INTEGER[],
    expected_ceids INTEGER[],
    provenance_id INTEGER REFERENCES provenance,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Provenance tracking
provenance (
    id SERIAL PRIMARY KEY,
    source_type VARCHAR NOT NULL,  -- synthetic, public_doc, semi_standard
    source_url TEXT,
    document_title TEXT,
    access_date DATE,
    generation_params JSONB,  -- model, prompt, seed
    license_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Execution Log Tables

```sql
execution_runs (
    id SERIAL PRIMARY KEY,
    scenario_id INTEGER REFERENCES scenarios,
    started_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ,
    status VARCHAR  -- running, completed, failed
);

execution_events (
    id SERIAL PRIMARY KEY,
    run_id INTEGER REFERENCES execution_runs,
    timestamp TIMESTAMPTZ NOT NULL,
    event_type VARCHAR,  -- sxfy, alarm, ceid
    direction VARCHAR,  -- H2E, E2H
    raw_sml TEXT,
    parsed_data JSONB,
    matched_alarm_id INTEGER REFERENCES alarms,
    matched_recipe_id INTEGER REFERENCES recipes
);
```

## Synthetic Data Generation

### Three-Layer Pipeline

```
┌─────────────────────────────────────────────────────────┐
│ Layer 1: Schema-Accurate (SEMI E30 Compliant)           │
├─────────────────────────────────────────────────────────┤
│ • ALID: sequential integers (1-9999)                    │
│ • ALCD: 1-8 per SEMI E30 (personal safety, equipment...)│
│ • ALTX: generic patterns ("Module X fault", "Param OOR")│
│ • Modules: generic names (Chamber, Arm, Chuck, Pump)    │
└─────────────────────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────┐
│ Layer 2: Vendor-Flavored                                │
├─────────────────────────────────────────────────────────┤
│ • ASML-style: "WAFER_STAGE_Z_LIMIT", numeric prefixes   │
│ • TEL-style: "PM1-GasBox-MFC1-Flow-Hi", module paths    │
│ • Lam-style: "RF_GEN_REFLECTED_POWER_HIGH"              │
│ • Naming patterns derived from public sources/papers    │
└─────────────────────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ Layer 3: Physics-Grounded                                   │
├─────────────────────────────────────────────────────────────┤
│ • Lithography: focus, dose, overlay, lens aberrations       │
│ • Etch: RF power, bias, selectivity, etch rate             │
│ • CVD/PVD: temperature, pressure, gas ratios, dep rate     │
│ • Realistic thresholds from process window knowledge        │
└─────────────────────────────────────────────────────────────┘
```

### CLI Commands

```bash
# Generate base schema-accurate alarms
scavenger generate alarms --count 500 --layer schema

# Add vendor flavor to existing alarms
scavenger generate alarms --layer vendor --vendor ASML --base-from schema

# Ground in physics (uses lithography-expert knowledge)
scavenger generate alarms --layer physics --process-type litho

# Generate golden recipes
scavenger generate recipes --equipment-type etch --count 50

# Generate scenarios from alarm/recipe combinations
scavenger generate scenarios --alarm-ids 100-200 --include-recovery
```

## HSMS Runtime

### Architecture

```
┌────────────────────────────────────────────────────────────┐
│                     HSMS Runtime                           │
├────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────┐               │
│  │ Equipment Server│    │   Host Client   │               │
│  │ (Passive Mode)  │◄──►│ (Active Mode)   │               │
│  │ Port 5000       │    │ Connects out    │               │
│  └────────┬────────┘    └────────┬────────┘               │
│           │                      │                        │
│           └──────────┬───────────┘                        │
│                      ▼                                    │
│           ┌─────────────────────┐                         │
│           │   Scenario Engine   │                         │
│           │ • Load from OnOKB   │                         │
│           │ • Execute steps     │                         │
│           │ • Inject alarms     │                         │
│           │ • Fire CEIDs        │                         │
│           └─────────────────────┘                         │
└────────────────────────────────────────────────────────────┘
```

### Components

| Component | Responsibility |
|-----------|----------------|
| `HsmsServer` | Passive TCP listener, handles T3/T6/T7 timers, connection state machine |
| `HsmsClient` | Active connector, reconnect logic, transaction management |
| `MessageCodec` | SML ↔ Python dict, SECS-II binary encoding/decoding |
| `ScenarioRunner` | Loads scenario from DB, executes steps with timing, handles branching |
| `AlarmManager` | Set/clear alarms (S5F1/S5F2), maintains alarm state, queries OnOKB for ALTX |
| `VariableManager` | SV/DV/ECV storage, handles S1F3/S1F11, links to recipe parameters |
| `EventLogger` | Writes every message to `execution_events`, links to KB matches |

### Supported Messages

| Stream/Function | Purpose |
|-----------------|---------|
| S1F1/S1F2 | Are You There |
| S1F3/S1F4 | Selected Equipment Status |
| S1F13/S1F14 | Establish Communication |
| S5F1/S5F2 | Alarm Report (ALID/ALCD/ALTX) |
| S6F11/S6F12 | Event Report (CEID) |
| S7F1-F6 | Process Program (recipe transfer) |
| S10F1/S10F2 | Terminal Request |

## API Design

### Endpoints

```
/api
├── /search
│   ├── POST /alarms       # Hybrid search (keyword + semantic)
│   ├── POST /recipes      # Search golden recipes
│   └── GET  /alarms/{id}  # Get alarm with related data
│
├── /runtime
│   ├── GET  /status              # Connection state, active scenario
│   ├── POST /scenarios/{id}/run  # Start scenario execution
│   ├── POST /stop                # Stop current execution
│   ├── POST /alarms/inject       # Manually trigger alarm
│   └── POST /connect             # Initiate HSMS connection
│
├── /generate
│   ├── POST /alarms      # Trigger alarm generation (async job)
│   ├── POST /recipes     # Trigger recipe generation
│   └── GET  /jobs/{id}   # Check generation job status
│
└── /ws
    └── /events           # WebSocket: live HSMS traffic stream
```

### Hybrid Search Request

```json
{
  "query": "wafer chuck vacuum loss",
  "vendor": "ASML",
  "process_type": "litho",
  "limit": 20,
  "rrf_weights": {
    "keyword": 0.4,
    "semantic": 0.6
  }
}
```

### WebSocket Events

```json
{"type": "hsms", "direction": "H2E", "sxfy": "S1F13", "ts": "..."}
{"type": "alarm", "alid": 1234, "altx": "Chuck vacuum low", "ts": "..."}
{"type": "ceid", "ceid": 100, "name": "ProcessComplete", "ts": "..."}
{"type": "scenario", "status": "step_complete", "step": 3, "ts": "..."}
```

## Deployment

### docker-compose.yml

```yaml
services:
  postgres:
    image: pgvector/pgvector:pg17
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    environment:
      POSTGRES_DB: onokb
      POSTGRES_USER: scavenger
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    healthcheck:
      test: ["CMD", "pg_isready", "-U", "scavenger", "-d", "onokb"]
      interval: 5s
      retries: 5

  scavenger:
    build: .
    depends_on:
      postgres:
        condition: service_healthy
    ports:
      - "8000:8000"   # FastAPI
      - "5000:5000"   # HSMS Equipment (passive)
    environment:
      DATABASE_URL: postgresql://scavenger:${DB_PASSWORD}@postgres:5432/onokb
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      HSMS_PORT: 5000
      HSMS_DEVICE_ID: 1
    volumes:
      - ./data:/app/data

volumes:
  pgdata:
```

### Project Structure

```
scavenger/
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── init.sql                    # Extensions: vector, pg_trgm
├── src/
│   └── scavenger/
│       ├── __init__.py
│       ├── cli/                # Click commands
│       ├── api/                # FastAPI routers
│       ├── runtime/            # HSMS server/client/engine
│       ├── db/                 # SQLAlchemy models, migrations
│       ├── generate/           # Synthetic data generators
│       └── search/             # RRF hybrid search logic
├── alembic/                    # DB migrations
├── tests/
└── pyproject.toml
```

## Technology Stack

### Python Dependencies

| Package | Purpose |
|---------|---------|
| `asyncio` | Async runtime for HSMS connections |
| `fastapi` + `uvicorn` | API server |
| `sqlalchemy[asyncio]` | Async ORM for PostgreSQL |
| `asyncpg` | Fast PostgreSQL driver |
| `pgvector` | Vector operations in SQLAlchemy |
| `alembic` | Database migrations |
| `click` | CLI framework |
| `openai` | Embeddings API |
| `pydantic` | Data validation, settings |
| `websockets` | Live event streaming |

### HSMS Implementation

**Recommended approach**: Wrap `secsgem` Python library for message codec and HSMS state machine, build custom scenario engine on top.

### Embedding Strategy

- Model: `text-embedding-3-small` (1536 dimensions)
- Cost: ~$0.02 per 1M tokens
- Batch embeddings on insert
- Re-embed only on ALTX/description changes

### Testing

| Tool | Purpose |
|------|---------|
| `pytest` + `pytest-asyncio` | Async test runner |
| `testcontainers` | PostgreSQL for integration tests |
| `httpx` | Async API test client |

## Decision Log

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Primary user | Developer (personal KB) | Optimizes for learning, not production |
| Data source | Primarily synthetic | Avoids legal complexity, full control |
| Data layers | 3-layer (schema/vendor/physics) | Comprehensive training data |
| KB ↔ Runtime | Bidirectional closed loop | Self-improving system |
| Deployment | Local Docker stack | Simple dev workflow |
| Interface | CLI + API | Admin tasks via CLI, runtime via API |
| Embeddings | OpenAI cloud | Quality over offline capability |
| HSMS base | Wrap secsgem | Mature library, extend as needed |

## Next Steps

1. Set up git worktree for isolated development
2. Create detailed implementation plan
3. Scaffold project structure
4. Implement core DB schema and migrations
5. Build synthetic data generators
6. Implement HSMS runtime
7. Add API layer
8. Integration testing
