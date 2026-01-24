# RAG Engine Design: ACE Context Engineering + Agentic RAG

**Date:** 2026-01-24
**Status:** Approved
**Author:** Brainstorming session

## Overview

A **Process Engineering Assistant** with **real-time SECS/GEM equipment integration**. The system combines:

- **ACE Context Engineering** - Tiered context assembly with dynamic budget allocation
- **Agentic RAG** - ReAct-style orchestration with lithography domain tools
- **Semi-autonomous actions** - Auto-execute logging/alerts, confirm equipment commands

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Knowledge sources | Synthetic + live SECS/GEM | No proprietary docs dependency |
| Autonomy level | Semi-autonomous | Safe: auto-log, confirm equipment actions |
| Architecture | New microservice + sidecar | Loosely coupled, subscribes to Redis streams |
| LLM backend | Cloud (Claude API) | Maximum reasoning capability |
| Vector store | Hybrid: pgvector + Redis | Persistent knowledge + ephemeral session |
| Context strategy | Tiered hierarchy + dynamic budgets | Flex allocation by query type |
| Embeddings | Ollama local (snowflake-arctic-embed2) | Free, fast, 1024 dims |

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Engineer Interface                         │
│                 (CLI / Web UI / Chat API)                       │
└─────────────────────┬───────────────────────────────────────────┘
                      │ queries/confirmations
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                     RAG Engine Service                          │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐    │
│  │ Context      │  │ Agent        │  │ Action             │    │
│  │ Assembler    │  │ Orchestrator │  │ Executor           │    │
│  └──────────────┘  └──────────────┘  └────────────────────┘    │
└───────┬─────────────────┬─────────────────────┬─────────────────┘
        │                 │                     │
   ┌────▼────┐      ┌─────▼─────┐         ┌─────▼─────┐
   │ pgvector│      │   Redis   │         │ Simulator │
   │ (persist)│     │ (streams) │         │ (SECS/GEM)│
   └─────────┘      └───────────┘         └───────────┘
```

### Core Components

1. **Context Assembler** - Builds tiered context windows from pgvector (knowledge) + Redis (session/equipment state)
2. **Agent Orchestrator** - Routes queries to LLM, manages multi-step reasoning, decides action class
3. **Action Executor** - Auto-executes approved actions, queues others for confirmation

## Context Assembly: Tiered Budgeting

```
┌─────────────────────────────────────────────────────────────┐
│ TIER 1: System Instructions (fixed 10-15%)                  │
│ - Agent persona, capabilities, action constraints           │
│ - Lithography domain primer (synthetic contract)            │
│ - Current equipment identity (tool ID, layer type)          │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│ TIER 2: Equipment State (dynamic 15-30%)                    │
│ - Recent SECS/GEM messages from Redis (last N events)       │
│ - Active alarms, process parameters, recipe context         │
│ - Sensor readings relevant to current query                 │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│ TIER 3: Retrieved Knowledge (dynamic 30-50%)                │
│ - Semantic search results from pgvector                     │
│ - Matching Q&A pairs, anomaly patterns, process windows     │
│ - Evidence chains for similar past incidents                │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│ TIER 4: Conversation History (remainder 15-35%)             │
│ - Recent engineer exchanges, summarized if needed           │
│ - Pending confirmations, action outcomes                    │
└─────────────────────────────────────────────────────────────┘
```

**Budget flexes by query type:**
- Troubleshooting alarm → Tier 2 (equipment) expands to 30%
- "Explain focus sensitivity" → Tier 3 (knowledge) expands to 50%
- Multi-turn debugging → Tier 4 (history) expands to 35%

## Agent Orchestrator

ReAct-style loop with lithography-aware tools:

```
┌──────────────────────────────────────────────────────────────┐
│                    ORCHESTRATOR LOOP                          │
│                                                               │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐   │
│  │ REASON  │───▶│  ACT    │───▶│ OBSERVE │───▶│ DECIDE  │   │
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘   │
│       │                                             │        │
│       └─────────────── loop until done ─────────────┘        │
└──────────────────────────────────────────────────────────────┘
```

### Available Tools

| Tool | Purpose | Auto-execute? |
|------|---------|---------------|
| `search_knowledge` | Query pgvector for lithography concepts | Yes |
| `get_equipment_state` | Fetch current SECS/GEM context from Redis | Yes |
| `estimate_process_window` | Calculate focus/dose margins | Yes |
| `analyze_alarm` | Match alarm to known anomaly patterns | Yes |
| `log_insight` | Record finding to database | Yes |
| `publish_alert` | Push alert to Redis stream | Yes |
| `propose_action` | Queue equipment command for confirmation | No - queues |
| `send_secs_command` | Execute SECS/GEM message | No - requires confirm |

## Knowledge Base Schema (pgvector)

```sql
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Core knowledge chunks with embeddings
CREATE TABLE knowledge_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    embedding vector(1024),  -- snowflake-arctic-embed2

    -- Metadata for filtered search
    chunk_type VARCHAR(50) NOT NULL,  -- 'concept', 'qa', 'anomaly', 'process_window'
    domain VARCHAR(50),               -- 'focus', 'dose', 'overlay', 'cdu', 'defect'
    layer_type VARCHAR(50),           -- 'contact', 'metal', 'via', 'generic'
    wavelength VARCHAR(20),           -- 'euv', 'duv_arf', 'duv_krf'
    difficulty VARCHAR(20),           -- 'conceptual', 'troubleshooting', 'expert'

    -- Full-text search
    content_tsv TSVECTOR GENERATED ALWAYS AS (to_tsvector('english', content)) STORED,

    -- Provenance
    source VARCHAR(100) DEFAULT 'lithography-expert-skill',
    synthetic BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- HNSW index for semantic search (cosine distance)
CREATE INDEX knowledge_embedding_idx ON knowledge_chunks
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- GIN index for full-text search
CREATE INDEX knowledge_content_tsv_idx ON knowledge_chunks USING GIN (content_tsv);

-- Composite index for filtered queries
CREATE INDEX knowledge_filter_idx ON knowledge_chunks (chunk_type, domain, layer_type);
```

## Redis Structure (Ephemeral Context)

```
STREAMS (real-time event flow):
├── secs:events:{tool_id}        # Raw SECS/GEM messages from equipment
├── rag:insights:{tool_id}       # Enriched insights published by RAG engine
└── rag:alerts:{tool_id}         # Alerts requiring attention

HASHES (current state snapshots):
├── equipment:state:{tool_id}    # Latest process params, recipe, alarms
└── session:{session_id}         # Engineer conversation context

SORTED SETS (recent events for context window):
├── recent:messages:{tool_id}    # Last N messages, scored by timestamp
└── recent:alarms:{tool_id}      # Recent alarms for pattern matching

TTLs:
├── session:* → 4 hours
├── recent:* → 1 hour
└── equipment:state:* → none (persistent)
```

## Action Executor

```python
class ActionClass(Enum):
    AUTO = "auto"           # Execute immediately
    CONFIRM = "confirm"     # Queue for engineer approval

ACTION_REGISTRY = {
    # Auto-execute (safe, observational)
    "log_insight":        ActionClass.AUTO,
    "publish_alert":      ActionClass.AUTO,
    "search_knowledge":   ActionClass.AUTO,
    "get_equipment_state": ActionClass.AUTO,

    # Require confirmation (affects equipment/process)
    "send_s2f41":         ActionClass.CONFIRM,  # Host Command Send
    "send_s2f15":         ActionClass.CONFIRM,  # New Equipment Constant
    "adjust_parameter":   ActionClass.CONFIRM,
}
```

### SECS/GEM Command Templates

```python
SECS_COMMANDS = {
    "adjust_focus": {
        "stream": 2, "function": 41,  # S2F41 Host Command Send
        "build_item": lambda offset: L(
            A("PP-SELECT"),
            L(L(A("FOCUS_OFFSET"), F4(offset)))
        )
    },
    "request_status": {
        "stream": 1, "function": 3,   # S1F3 Selected Equipment Status
        "build_item": lambda svids: L(*[U4(svid) for svid in svids])
    },
}
```

## Embedding & LLM Strategy

| Component | Choice | Rationale |
|-----------|--------|-----------|
| Embeddings | `snowflake-arctic-embed2` local | Free, 67.5 MTEB, 1024 dims |
| Query classification | Rules or small local model | Low latency |
| Main reasoning | Claude Sonnet/Opus cloud | Best tool use |
| Fallback | `deepseek-v3.2:cloud` | Cost-effective |

## Docker Compose Services

```yaml
services:
  postgres:
    image: pgvector/pgvector:pg17
    # ... existing config

  redis:
    image: redis:7-alpine
    # ... existing config

  ollama:
    image: ollama/ollama:latest
    volumes:
      - ollama_data:/root/.ollama
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]

  rag-engine:
    build: ./rag-engine
    environment:
      - POSTGRES_URL=postgresql://...
      - REDIS_URL=redis://redis:6379
      - OLLAMA_HOST=http://ollama:11434
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    ports:
      - "8001:8001"
    depends_on:
      postgres: { condition: service_healthy }
      redis: { condition: service_healthy }
      ollama: { condition: service_healthy }
```

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/query` | POST | Main question-answering |
| `/actions/{id}/decide` | POST | Approve/reject pending actions |
| `/sessions/{id}` | GET/DELETE | Session management |
| `/equipment/{tool}/state` | GET | Current equipment context |
| `/equipment/{tool}/events` | GET | Recent SECS/GEM events |
| `/health/live` | GET | Liveness probe |
| `/health/ready` | GET | Readiness probe |
| `/health/startup` | GET | Startup probe |

## Project Structure

```
rag-engine/
├── Dockerfile
├── pyproject.toml
├── app/
│   ├── main.py                    # FastAPI app, lifespan
│   ├── config.py                  # Settings
│   ├── routers/                   # API endpoints
│   ├── core/                      # Context, orchestrator, executor
│   ├── tools/                     # Agent tools
│   ├── services/                  # External clients
│   ├── models/                    # Schemas, DB, exceptions
│   └── seed/                      # Knowledge generation
├── tests/
└── scripts/
```

## Data Flow Example

```
1. POST /query {"question": "Why is CD trending +3nm?", "tool_id": "LITHO01"}

2. Context Assembly:
   - Tier 1: System + tool identity
   - Tier 2: Redis equipment:state:LITHO01 → focus_offset: +6nm
   - Tier 3: pgvector search "CD trending" → focus sensitivity docs
   - Tier 4: Session history

3. Orchestrator Loop:
   - REASON: Focus drift could cause CD trend
   - ACT: search_knowledge("focus sensitivity CD")
   - OBSERVE: 5nm CD per 10nm focus
   - ACT: get_equipment_state → focus_offset: +6nm
   - REASON: 6nm offset × 0.5 = 3nm CD shift. Match!
   - ACT: propose_action("adjust_focus", -6nm) → QUEUED

4. Response with pending action for confirmation

5. POST /actions/{id}/decide {"approved": true}
   → S2F41 sent to LITHO01
```

## Next Steps

1. Create git worktree for isolated development
2. Write detailed implementation plan
3. Implement in phases:
   - Phase 1: Project scaffolding, Docker setup
   - Phase 2: Knowledge schema + seeding
   - Phase 3: Context assembler
   - Phase 4: Agent orchestrator + tools
   - Phase 5: Action executor + SECS/GEM integration
   - Phase 6: API endpoints
   - Phase 7: Testing + integration
