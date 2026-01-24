# RAG Engine Design v2: LangGraph + LightRAG Architecture

**Date:** 2026-01-24
**Status:** Proposed
**Supersedes:** `2026-01-24-rag-engine-design.md`
**Author:** Architecture analysis session

## Overview

A **Process Engineering Assistant** with **real-time SECS/GEM equipment integration**, now powered by:

- **LangGraph** — Production-grade agent orchestration with state persistence, human-in-the-loop, and streaming
- **LightRAG** — Graph-enhanced knowledge retrieval capturing entity relationships (equipment ↔ phenomena ↔ parameters)
- **ACE Context Engineering** — Tiered context assembly with dynamic budget allocation (unchanged from v1)

## Key Decisions

| Decision | v1 Choice | v2 Choice | Rationale |
|----------|-----------|-----------|-----------|
| Agent orchestration | Custom ReAct loop | **LangGraph** | Built-in checkpointing, human-in-the-loop, 5 streaming modes |
| Knowledge retrieval | Flat pgvector + FTS | **LightRAG hybrid** | Graph traversal for multi-hop reasoning |
| Knowledge storage | Single `knowledge_chunks` table | **PGVectorStorage + PGGraphStorage** | Entities + relationships for lithography domain |
| State persistence | Redis manual | **LangGraph PostgresSaver** | Durable execution, thread-based memory |
| LLM backend | Claude API direct | **langchain-anthropic** | Required for LangGraph integration |
| Embeddings | Ollama local | Ollama local (unchanged) | Free, fast, 1024 dims |
| Equipment state | Redis streams | Redis streams (unchanged) | Real-time SECS/GEM events |

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Engineer Interface                               │
│                    (CLI / Web UI / Chat API)                            │
└────────────────────────────┬────────────────────────────────────────────┘
                             │ queries/confirmations
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        RAG Engine Service                                │
│                                                                          │
│  ┌────────────────────┐        ┌────────────────────────────────────┐   │
│  │  Context Assembler │        │  LangGraph Agent Orchestrator      │   │
│  │  (4-tier budgets)  │───────▶│  • create_react_agent()            │   │
│  │                    │        │  • PostgresSaver checkpointer      │   │
│  │  Tier 1: System    │        │  • interrupt() for CONFIRM actions │   │
│  │  Tier 2: Equipment │        │  • 5 streaming modes               │   │
│  │  Tier 3: Knowledge │        └───────────────┬────────────────────┘   │
│  │  Tier 4: History   │                        │                        │
│  └────────────────────┘                        │ tool calls             │
│                                                ▼                        │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    LightRAG Knowledge Layer                       │   │
│  │                                                                   │   │
│  │  ┌─────────────────────┐    ┌─────────────────────────────────┐  │   │
│  │  │  PGVectorStorage    │    │  PGGraphStorage                 │  │   │
│  │  │  • Entity embeddings│    │  • Entities (nodes)             │  │   │
│  │  │  • Chunk embeddings │    │  • Relationships (edges)        │  │   │
│  │  │  • HNSW index       │    │  • Community summaries          │  │   │
│  │  └─────────────────────┘    └─────────────────────────────────┘  │   │
│  │                                                                   │   │
│  │  Query Modes:                                                     │   │
│  │  • local  — Entity-focused (specific facts)                      │   │
│  │  • global — Theme extraction (broad patterns)                    │   │
│  │  • hybrid — Combined (RECOMMENDED)                               │   │
│  │  • mix    — Graph + vector + keyword                             │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                         Tool Registry                             │   │
│  │  @tool search_knowledge    → LightRAG.aquery(mode="hybrid")      │   │
│  │  @tool get_equipment_state → Redis HGETALL                       │   │
│  │  @tool analyze_alarm       → Pattern matching + graph lookup     │   │
│  │  @tool propose_action      → Queue for confirmation (interrupt)  │   │
│  │  @tool send_secs_command   → CONFIRM required → secsgem          │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└────────┬─────────────────────────────────┬──────────────────────────────┘
         │                                 │
    ┌────▼────┐                      ┌─────▼─────┐
    │PostgreSQL│                     │   Redis   │
    │ • LightRAG tables              │ • equipment:state:{tool}
    │ • LangGraph checkpoints        │ • session:{id}:history
    │ • Query logs                   │ • secs:events:{tool}
    └──────────┘                     └───────────┘
```

## Component Details

### 1. LangGraph Agent Orchestrator

Replaces the custom ReAct loop with LangGraph's production-grade orchestration.

```python
from langgraph.prebuilt import create_react_agent
from langgraph.checkpoint.postgres import AsyncPostgresSaver
from langchain_anthropic import ChatAnthropic
from langchain_core.tools import tool

# Initialize checkpointer for state persistence
async def create_checkpointer(pool: asyncpg.Pool) -> AsyncPostgresSaver:
    checkpointer = AsyncPostgresSaver(pool)
    await checkpointer.setup()  # Creates checkpoint tables
    return checkpointer

# Create agent with tools
def create_rag_agent(
    tools: list[Callable],
    checkpointer: AsyncPostgresSaver,
) -> CompiledGraph:
    llm = ChatAnthropic(
        model="claude-sonnet-4-20250514",
        temperature=0.1,
        max_tokens=4096,
    )
    
    return create_react_agent(
        llm,
        tools=tools,
        checkpointer=checkpointer,
    )

# Usage with thread-based memory
async def query(agent, question: str, session_id: str):
    config = {"configurable": {"thread_id": session_id}}
    
    async for mode, chunk in agent.astream(
        {"messages": [{"role": "user", "content": question}]},
        config=config,
        stream_mode=["messages", "updates"],
    ):
        if mode == "messages":
            yield chunk  # Token streaming to UI
```

#### Human-in-the-Loop for CONFIRM Actions

```python
from langgraph.types import interrupt

@tool
def propose_action(action_type: str, parameters: dict) -> str:
    """Propose an equipment-affecting action for engineer confirmation."""
    # Interrupt execution, save state, wait for human decision
    decision = interrupt({
        "action_type": action_type,
        "parameters": parameters,
        "requires": "engineer_confirmation",
    })
    
    if decision.get("approved"):
        return f"Action {action_type} approved, executing..."
    else:
        return f"Action {action_type} rejected by engineer."
```

### 2. LightRAG Knowledge Layer

Replaces flat `knowledge_chunks` with graph-enhanced retrieval.

#### Initialization

```python
from lightrag import LightRAG
from lightrag.llm.openai import openai_embed
from lightrag.kg.shared_storage import initialize_pipeline_status

async def create_knowledge_layer(settings: Settings) -> LightRAG:
    """Initialize LightRAG with PostgreSQL backends."""
    
    # Set PostgreSQL connection via environment
    os.environ["POSTGRES_HOST"] = settings.postgres_host
    os.environ["POSTGRES_PORT"] = str(settings.postgres_port)
    os.environ["POSTGRES_USER"] = settings.postgres_user
    os.environ["POSTGRES_PASSWORD"] = settings.postgres_password
    os.environ["POSTGRES_DATABASE"] = settings.postgres_database
    
    rag = LightRAG(
        working_dir="./lightrag_storage",
        
        # Storage backends - all PostgreSQL
        kv_storage="PGKVStorage",
        vector_storage="PGVectorStorage",
        graph_storage="PGGraphStorage",
        doc_status_storage="PGDocStatusStorage",
        
        # Models
        embedding_func=create_ollama_embedding(
            model=settings.embedding_model,
            host=settings.ollama_host,
        ),
        llm_model_func=create_claude_complete(
            api_key=settings.anthropic_api_key,
            model=settings.llm_model,
        ),
        
        # Chunking
        chunk_token_size=1200,
        chunk_overlap_token_size=100,
        
        # Performance
        llm_model_max_async=8,
        embedding_batch_num=32,
        
        # Workspace for multi-tenant isolation
        workspace="lithography",
    )
    
    await rag.initialize_storages()
    await initialize_pipeline_status()
    
    return rag
```

#### Entity Schema for Lithography Domain

LightRAG auto-extracts entities, but we can guide extraction with domain knowledge:

```python
# Expected entity types extracted from lithography knowledge
LITHOGRAPHY_ENTITIES = {
    "equipment": ["LITHO01", "LITHO02", "TRACK01", ...],
    "phenomenon": ["focus drift", "CD variation", "overlay error", ...],
    "parameter": ["focus offset", "dose", "exposure time", ...],
    "layer": ["contact", "metal", "via", ...],
    "metric": ["CDU", "overlay", "defect density", ...],
}

# Expected relationship types
LITHOGRAPHY_RELATIONS = {
    "causes": ("phenomenon", "phenomenon"),      # focus drift → causes → CD variation
    "affects": ("parameter", "metric"),          # dose → affects → CDU
    "measured_on": ("metric", "equipment"),      # overlay → measured_on → LITHO01
    "diagnosed_by": ("phenomenon", "tool"),      # focus drift → diagnosed_by → search_knowledge
}
```

#### Query Integration

```python
from lightrag import QueryParam

@tool
def search_knowledge(
    query: str,
    domain: str | None = None,
    mode: str = "hybrid",
) -> str:
    """Search lithography knowledge base for concepts, troubleshooting, or anomaly patterns.
    
    Args:
        query: Natural language search query
        domain: Optional filter (focus, dose, overlay, cdu, defect)
        mode: Search mode - 'local' for specific facts, 'global' for themes, 'hybrid' for both
    
    Returns:
        Retrieved knowledge with entity relationships
    """
    result = rag.query(
        query,
        param=QueryParam(
            mode=mode,
            top_k=60,  # LightRAG recommends 60+ for comprehensive retrieval
        ),
    )
    return result
```

### 3. Context Assembler (Unchanged from v1)

The 4-tier context assembly remains the same, but Tier 3 now uses LightRAG:

```python
async def _build_tier3(
    self,
    question: str,
    profile: QueryProfile,
    max_tokens: int,
) -> list[dict]:
    """Retrieve relevant knowledge from LightRAG."""
    
    # Determine query mode based on profile
    mode = "local" if profile.query_type == "troubleshooting" else "hybrid"
    
    result = await self.lightrag.aquery(
        question,
        param=QueryParam(
            mode=mode,
            top_k=60,
            only_need_context=True,  # Return raw context, not LLM-generated answer
        ),
    )
    
    # Parse and truncate to token budget
    return self._parse_lightrag_context(result, max_tokens)
```

### 4. Tool Registry

Tools are now LangChain-compatible with `@tool` decorator:

```python
from langchain_core.tools import tool
from typing import Literal

@tool
def search_knowledge(
    query: str,
    domain: Literal["focus", "dose", "overlay", "cdu", "defect"] | None = None,
) -> str:
    """Search the lithography knowledge base for concepts, Q&A, anomaly patterns, or process windows."""
    return lightrag.query(query, param=QueryParam(mode="hybrid"))

@tool
def get_equipment_state(tool_id: str) -> dict:
    """Fetch current equipment state from Redis (alarms, parameters, recipe)."""
    return redis.hgetall(f"equipment:state:{tool_id}")

@tool
def analyze_alarm(alarm_id: str, tool_id: str) -> str:
    """Match alarm to known anomaly patterns and suggest root causes."""
    # Combines equipment state with knowledge graph traversal
    alarm_data = redis.hgetall(f"alarm:{alarm_id}")
    patterns = lightrag.query(
        f"Anomaly pattern for {alarm_data['description']}",
        param=QueryParam(mode="local"),
    )
    return patterns

@tool
def propose_action(
    action_type: Literal["adjust_focus", "adjust_dose", "run_calibration"],
    parameters: dict,
) -> str:
    """Propose an equipment-affecting action. Requires engineer confirmation."""
    from langgraph.types import interrupt
    
    decision = interrupt({
        "action_type": action_type,
        "parameters": parameters,
        "message": f"Confirm {action_type} with params {parameters}?",
    })
    
    if decision.get("approved"):
        # Execute via SECS/GEM
        return execute_secs_command(action_type, parameters)
    return "Action rejected by engineer."
```

## Database Schema

### LightRAG Tables (Auto-Created)

LightRAG creates these tables automatically:

```sql
-- Entity storage
CREATE TABLE lightrag_entities (
    id UUID PRIMARY KEY,
    entity_name TEXT NOT NULL,
    entity_type TEXT,
    description TEXT,
    embedding vector(1024),
    workspace TEXT DEFAULT 'lithography'
);

-- Relationship storage
CREATE TABLE lightrag_relationships (
    id UUID PRIMARY KEY,
    src_entity_id UUID REFERENCES lightrag_entities(id),
    tgt_entity_id UUID REFERENCES lightrag_entities(id),
    description TEXT,
    keywords TEXT,
    weight FLOAT DEFAULT 1.0
);

-- Chunk storage with embeddings
CREATE TABLE lightrag_chunks (
    id UUID PRIMARY KEY,
    content TEXT NOT NULL,
    embedding vector(1024),
    doc_id TEXT,
    chunk_order INT
);

-- Key-value storage for LightRAG internals
CREATE TABLE lightrag_kv (
    key TEXT PRIMARY KEY,
    value JSONB
);
```

### LangGraph Checkpoint Tables (Auto-Created)

```sql
-- Thread checkpoints
CREATE TABLE checkpoints (
    thread_id TEXT NOT NULL,
    checkpoint_id TEXT NOT NULL,
    parent_checkpoint_id TEXT,
    type TEXT,
    checkpoint JSONB NOT NULL,
    metadata JSONB,
    PRIMARY KEY (thread_id, checkpoint_id)
);

-- Checkpoint writes (pending state)
CREATE TABLE checkpoint_writes (
    thread_id TEXT NOT NULL,
    checkpoint_id TEXT NOT NULL,
    task_id TEXT NOT NULL,
    idx INTEGER NOT NULL,
    channel TEXT NOT NULL,
    type TEXT,
    value JSONB,
    PRIMARY KEY (thread_id, checkpoint_id, task_id, idx)
);
```

### Application Tables

```sql
-- Query logs for analytics (unchanged from v1)
CREATE TABLE query_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(100) NOT NULL,
    thread_id VARCHAR(100),  -- NEW: LangGraph thread reference
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    tool_calls JSONB,  -- NEW: Record of tools invoked
    lightrag_mode VARCHAR(20),  -- NEW: Query mode used
    evidence_count INT DEFAULT 0,
    action_proposed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX query_log_session_idx ON query_logs (session_id, created_at);
CREATE INDEX query_log_thread_idx ON query_logs (thread_id);
```

## Redis Structure (Unchanged)

```
STREAMS (real-time event flow):
├── secs:events:{tool_id}        # Raw SECS/GEM messages
├── rag:insights:{tool_id}       # Enriched insights
└── rag:alerts:{tool_id}         # Alerts requiring attention

HASHES (current state):
├── equipment:state:{tool_id}    # Latest process params
└── session:{session_id}         # Conversation metadata

SORTED SETS (recent events):
├── recent:messages:{tool_id}    # Last N messages
└── recent:alarms:{tool_id}      # Recent alarms
```

## Tech Stack

```toml
[project]
name = "rag-engine"
version = "0.2.0"
description = "ACE Context Engineering + Agentic RAG with LangGraph + LightRAG"
requires-python = ">=3.12"

dependencies = [
    # Web framework
    "fastapi>=0.115.0",
    "uvicorn[standard]>=0.32.0",
    "pydantic>=2.10.0",
    "pydantic-settings>=2.6.0",
    
    # Database
    "asyncpg>=0.30.0",
    "psycopg[pool]>=3.2.0",  # For LangGraph PostgresSaver
    
    # LangGraph (orchestration)
    "langgraph>=1.0.6",
    "langchain-anthropic>=0.3.0",
    "langchain-core>=0.3.0",
    
    # LightRAG (knowledge layer)
    "lightrag-hku>=1.4.9",
    
    # Redis
    "redis>=5.2.0",
    
    # Embeddings (Ollama)
    "ollama>=0.4.0",
    
    # Utilities
    "httpx>=0.28.0",
    "structlog>=24.4.0",
]
```

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/query` | POST | Main question-answering (streams response) |
| `/query/{thread_id}/resume` | POST | Resume interrupted conversation |
| `/threads/{thread_id}/state` | GET | Get current agent state |
| `/threads/{thread_id}/interrupt` | POST | Respond to interrupt (approve/reject) |
| `/knowledge/insert` | POST | Add documents to LightRAG |
| `/knowledge/entities` | GET | Browse extracted entities |
| `/equipment/{tool}/state` | GET | Current equipment context |
| `/health/*` | GET | Health probes |

## Data Flow Example

```
1. POST /query {"question": "Why is CD trending +3nm?", "tool_id": "LITHO01", "session_id": "eng-123"}

2. Context Assembly:
   - Tier 1: System prompt + tool identity
   - Tier 2: Redis equipment:state:LITHO01 → {focus_offset: +6nm, dose: 15mJ}
   - Tier 3: LightRAG hybrid query → entities: [focus_drift, CD_variation], relations: [causes]
   - Tier 4: LangGraph checkpoint → previous conversation

3. LangGraph Orchestration:
   ┌─────────────────────────────────────────────────────────────────┐
   │ START → llm_call → tools_condition                              │
   │            │              │                                     │
   │            │         tool_calls?                                │
   │            │          ↙     ↘                                   │
   │            │        yes      no → END                           │
   │            │         ↓                                          │
   │            │    ToolNode                                        │
   │            │    [search_knowledge, get_equipment_state]         │
   │            │         ↓                                          │
   │            └─────── llm_call (with tool results) ◀──────────────┤
   │                          │                                      │
   │                     tool_calls?                                 │
   │                      ↙     ↘                                    │
   │                    yes      no                                  │
   │                     ↓        ↓                                  │
   │               ToolNode    propose_action detected?              │
   │          [propose_action]       ↙     ↘                         │
   │                 ↓             yes      no → END                 │
   │            interrupt()          ↓                               │
   │                 ↓          WAIT FOR HUMAN                       │
   └─────────────────────────────────────────────────────────────────┘

4. Tool Execution Log:
   - search_knowledge("CD variation causes") → LightRAG hybrid mode
   - get_equipment_state("LITHO01") → Redis HGETALL
   - LLM synthesis: "Focus offset +6nm correlates with ~3nm CD shift (sensitivity: 0.5nm CD per nm focus)"
   - propose_action("adjust_focus", {offset: -6}) → interrupt()

5. Response (streaming):
   {"type": "message", "content": "Focus drift detected..."}
   {"type": "message", "content": "Recommending focus adjustment..."}
   {"type": "interrupt", "action": "adjust_focus", "params": {offset: -6}}

6. POST /threads/{thread_id}/interrupt {"approved": true}
   → Resume execution → S2F41 sent to LITHO01
```

## Migration from v1 Plan

### Phase Changes

| Phase | v1 Tasks | v2 Updates |
|-------|----------|------------|
| **1.1** | Create project structure | Add LangGraph/LightRAG deps |
| **2.1** | Create `knowledge_chunks` table | Replace with LightRAG init |
| **2.2** | Create embedding service | Wrap for LightRAG compatibility |
| **2.3** | Create knowledge seeder | Use `rag.ainsert()` instead |
| **3.1** | Query classifier | Unchanged (determines LightRAG mode) |
| **3.2** | Context assembler | Update Tier 3 to use LightRAG |
| **4.1** | Tool interface | Use `@tool` decorator |
| **4.2** | Agent orchestrator | Replace with `create_react_agent()` |
| **4.3** | Action executor | Use LangGraph `interrupt()` |

### Breaking Changes

1. **Knowledge schema**: Flat table → Graph structure (requires re-seeding)
2. **Tool signatures**: Custom interface → LangChain `@tool`
3. **State management**: Redis manual → LangGraph checkpointer
4. **Streaming**: Custom SSE → LangGraph stream modes

## Next Steps

1. ✅ Design document approved
2. Update `2026-01-24-rag-engine-implementation.md` with v2 tasks
3. Implement Phase 1: Scaffolding with new dependencies
4. Implement Phase 2: LightRAG initialization + seeding
5. Implement Phase 3: Context assembler updates
6. Implement Phase 4: LangGraph orchestrator
7. Integration testing with SECS/GEM simulator

## References

- LangGraph Docs: https://docs.langchain.com/oss/python/langgraph/overview
- LightRAG Repo: https://github.com/HKUDS/LightRAG
- LightRAG Paper: https://arxiv.org/abs/2410.05779
- Original Design: `docs/plans/2026-01-24-rag-engine-design.md`
