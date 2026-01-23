# SECS/GEM Simulator Design Document

**Date**: 2026-01-23
**Status**: Approved
**Project**: Scavenger Extension - SECS/GEM Message Simulator + EAP Client

## Overview

A comprehensive SECS/GEM simulation platform extending Scavenger with full bidirectional HSMS communication, message recording, and deterministic replay capabilities.

### Goals

1. **Full Simulation** - Equipment simulator + EAP client for complete scenario testing
2. **Training Data** - Record all messages with full state for AI training corpus
3. **Deterministic Replay** - Replay recorded sessions for debugging and augmentation
4. **Flexible Scenarios** - Define via YAML, database, or Python DSL

### Non-Goals

- Production fab deployment
- Real equipment integration
- Proprietary protocol extensions

## System Architecture

```
                    ┌─────────────────┐
                    │  scenario-engine │
                    │  (orchestrator)  │
                    └────────┬─────────┘
                             │ gRPC/Redis
        ┌────────────────────┼────────────────────┐
        ▼                    ▼                    ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│ equipment-sim │◄──►│  eap-client   │    │msg-recorder   │
│ (passive:5000)│HSMS│ (active)      │    │(event sink)   │
└───────────────┘    └───────────────┘    └───────────────┘
                                                  │
        ┌─────────────────────────────────────────┤
        ▼                                         ▼
┌───────────────┐                         ┌───────────────┐
│replay-service │                         │   PostgreSQL  │
│(deterministic)│                         │   (OnOKB)     │
└───────────────┘                         └───────────────┘
```

**Key Principle**: Each service is stateless (state lives in PostgreSQL/Redis), enabling horizontal scaling and independent deployment.

## Microservices

### Service 1: equipment-sim

Simulates semiconductor equipment in HSMS passive mode.

| Aspect | Detail |
|--------|--------|
| **Port** | 5000 (HSMS), 8001 (gRPC control) |
| **Role** | HSMS passive, responds to host requests |
| **State** | SVs, DVs, ECVs, alarm set, process state |
| **Features** | Multi-equipment support, configurable delays, fault injection |

```protobuf
service EquipmentSimulator {
    rpc SpawnEquipment(EquipmentConfig) returns (EquipmentInstance);
    rpc InjectAlarm(AlarmRequest) returns (Empty);
    rpc SetVariable(VariableUpdate) returns (Empty);
    rpc GetState(EquipmentId) returns (EquipmentState);
    rpc TriggerEvent(EventRequest) returns (Empty);
}
```

### Service 2: eap-client

Host/EAP side connecting in HSMS active mode.

| Aspect | Detail |
|--------|--------|
| **Port** | 8002 (gRPC control) |
| **Role** | HSMS active, sends commands, receives events |
| **Features** | Connection pool, transaction management, automatic retry |

```protobuf
service EapClient {
    rpc Connect(ConnectionRequest) returns (ConnectionStatus);
    rpc SendMessage(SecsMessage) returns (SecsReply);
    rpc Subscribe(EventFilter) returns (stream SecsEvent);
    rpc UploadRecipe(RecipeData) returns (TransferResult);
    rpc DownloadRecipe(RecipeRequest) returns (RecipeData);
}
```

### Service 3: scenario-engine

Orchestrates multi-step scenarios across equipment and host.

| Aspect | Detail |
|--------|--------|
| **Port** | 8003 (gRPC), 8004 (HTTP for YAML upload) |
| **Role** | Load scenarios, execute steps, handle branching |
| **Sources** | YAML files, database scenarios, Python DSL |

### Service 4: msg-recorder

Central event sink for all HSMS traffic.

| Aspect | Detail |
|--------|--------|
| **Port** | 8005 (gRPC ingestion) |
| **Input** | Redis pub/sub or gRPC streaming from equipment/eap |
| **Output** | Writes to secs_messages, state_snapshots, message_analytics |
| **Features** | Batch inserts, back-pressure handling, transaction pairing |

### Service 5: replay-service

Deterministic replay of recorded sessions.

| Aspect | Detail |
|--------|--------|
| **Port** | 8006 (gRPC), 5001+ (spawned HSMS ports) |
| **Role** | Replay sessions at original or modified timing |
| **Features** | Speed control (0.1x-100x), pause/step, branch from snapshot |

## Database Schema Extensions

```sql
-- HSMS connection sessions
hsms_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id INTEGER REFERENCES equipment_models,
    session_type VARCHAR NOT NULL,  -- 'simulation', 'external', 'replay'
    local_role VARCHAR NOT NULL,    -- 'equipment', 'host'
    remote_address VARCHAR,
    local_port INTEGER,
    started_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ,
    connection_state VARCHAR,       -- 'not_connected', 'connected', 'selected'
    metadata JSONB                  -- T3/T5/T6/T7 timers, device_id
);

-- Every SECS-II message (raw + parsed)
secs_messages (
    id BIGSERIAL PRIMARY KEY,
    session_id UUID REFERENCES hsms_sessions,
    sequence_num BIGINT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    direction VARCHAR NOT NULL,     -- 'H2E', 'E2H'
    stream INTEGER NOT NULL,
    function INTEGER NOT NULL,
    wbit BOOLEAN NOT NULL,
    system_bytes BYTEA,
    raw_sml TEXT,
    raw_binary BYTEA,
    parsed_body JSONB,
    transaction_id INTEGER,
    latency_ms FLOAT
);

-- State snapshots for deterministic replay
state_snapshots (
    id BIGSERIAL PRIMARY KEY,
    session_id UUID REFERENCES hsms_sessions,
    after_message_id BIGINT REFERENCES secs_messages,
    snapshot_type VARCHAR,          -- 'periodic', 'checkpoint', 'scenario_step'
    equipment_state JSONB,
    pending_transactions JSONB,
    scenario_context JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics aggregates
message_analytics (
    id BIGSERIAL PRIMARY KEY,
    session_id UUID REFERENCES hsms_sessions,
    window_start TIMESTAMPTZ,
    window_minutes INTEGER,
    message_count INTEGER,
    avg_latency_ms FLOAT,
    error_count INTEGER,
    alarm_count INTEGER,
    messages_by_sf JSONB
);
```

## Scenario Definition Formats

### Format 1: YAML

```yaml
name: basic_comm_test
description: Establish communication and query status
equipment:
  model: generic_etch
  port: 5000

steps:
  - id: establish_comm
    from: host
    send: S1F13
    expect: S1F14
    timeout_ms: 5000

  - id: inject_alarm
    action: inject_alarm
    alid: 1001
    alcd: 2

on_failure: abort
```

### Format 2: Database (scenarios table)

```json
{
  "name": "wafer_processing_cycle",
  "steps": [
    {"id": "s1", "type": "send", "from": "host", "sf": "S1F13", "next": "s2"},
    {"id": "s2", "type": "expect", "sf": "S1F14", "timeout_ms": 5000, "next": "s3"},
    {"id": "s3", "type": "branch", "condition": "last_reply.ack == 0", "true": "s4", "false": "error"}
  ]
}
```

### Format 3: Python DSL

```python
from scavenger.scenarios import Scenario, Equipment, Host

async def alarm_recovery_test():
    scenario = Scenario("alarm_recovery")

    with scenario.equipment("etch_sim", port=5000) as eq:
        with scenario.host("eap") as host:
            await host.establish_comm()
            await eq.inject_alarm(alid=3001, alcd=3)
            alarm_report = await host.expect(S5F1, timeout=2.0)
            await host.send(S5F3, ALED=0x80, ALID=3001)

    return scenario.summary()
```

## Docker Compose

```yaml
services:
  postgres:
    image: pgvector/pgvector:pg17
    environment:
      POSTGRES_DB: onokb
      POSTGRES_USER: scavenger
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    healthcheck:
      test: ["CMD", "pg_isready", "-U", "scavenger", "-d", "onokb"]

  redis:
    image: redis:7-alpine
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]

  equipment-sim:
    build: { context: ., target: equipment-sim }
    ports: ["5000:5000", "8001:8001"]
    depends_on: [postgres, redis]

  eap-client:
    build: { context: ., target: eap-client }
    ports: ["8002:8002"]
    depends_on: [postgres, redis]

  scenario-engine:
    build: { context: ., target: scenario-engine }
    ports: ["8003:8003", "8004:8004"]
    depends_on: [equipment-sim, eap-client, msg-recorder]

  msg-recorder:
    build: { context: ., target: msg-recorder }
    ports: ["8005:8005"]
    depends_on: [postgres, redis]

  replay-service:
    build: { context: ., target: replay-service }
    ports: ["8006:8006", "5001-5010:5001-5010"]
    depends_on: [postgres]

  scavenger-api:
    build: { context: ., target: api }
    ports: ["8000:8000"]
    depends_on: [postgres]

volumes:
  pgdata:
  redisdata:
```

## Project Structure

```
scavenger/src/scavenger/
├── simulator/
│   ├── common/
│   │   ├── codec.py          # secsgem wrapper
│   │   ├── hsms.py           # Connection state machine
│   │   ├── messages.py       # Message dataclasses
│   │   └── timers.py         # T3/T5/T6/T7 timers
│   ├── equipment/
│   │   ├── server.py         # HSMS passive server
│   │   ├── handlers.py       # Message handlers
│   │   ├── state.py          # Equipment state
│   │   └── grpc_service.py
│   ├── eap/
│   │   ├── client.py         # HSMS active client
│   │   ├── connection_pool.py
│   │   ├── transactions.py
│   │   └── grpc_service.py
│   ├── scenario/
│   │   ├── engine.py         # Scenario executor
│   │   ├── loader.py         # YAML/DB/DSL loader
│   │   ├── dsl.py            # Python DSL
│   │   └── grpc_service.py
│   ├── recorder/
│   │   ├── service.py
│   │   ├── batch_writer.py
│   │   └── grpc_service.py
│   └── replay/
│       ├── service.py
│       ├── player.py
│       └── grpc_service.py
├── scenarios/
│   ├── base.py               # DSL base classes
│   └── examples/
└── db/models/
    ├── hsms_session.py
    ├── secs_message.py
    └── state_snapshot.py
```

## Technology Stack

| Component | Technology |
|-----------|------------|
| Protocol | secsgem (codec + HSMS) |
| Inter-service | gRPC + Protocol Buffers |
| Event streaming | Redis pub/sub |
| Database | PostgreSQL + pgvector |
| Async runtime | asyncio |
| Config | Pydantic Settings |

## Implementation Phases

| Phase | Focus |
|-------|-------|
| 1 | Foundation - DB schema, codec wrapper, HSMS base |
| 2 | Equipment Simulator - passive server, state, handlers |
| 3 | EAP Client - active client, transactions, pool |
| 4 | Message Recorder - Redis listener, batch writer |
| 5 | Scenario Engine - YAML/DB/DSL loader, step executors |
| 6 | Replay Service - playback, snapshots, forking |
| 7 | Extended Messages - GEM300 (S7, S14, S16) |
| 8 | Polish - CLI, API endpoints, documentation |

## Decision Log

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Integration | Extend Scavenger | Leverage existing DB, models, infrastructure |
| Roles | Both equipment + host | Full scenario testing capability |
| Messages | Comprehensive (GEM300) | Maximum training data coverage |
| Recording | Full trace + replay | Deterministic reproduction, debugging |
| Protocol lib | secsgem + custom | Mature codec, custom scenario control |
| Architecture | Microservices | Independent scaling, isolation |
| Scenarios | YAML + DB + DSL | Flexibility for different use cases |
