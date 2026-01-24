# SECS/GEM Simulator

A comprehensive SECS/GEM equipment simulator for testing host applications.

## Features

- **Equipment Simulation**: HSMS passive server that responds to host connections
- **Scenario Engine**: Run predefined test scenarios (YAML or Python DSL)
- **Message Recording**: Capture all SECS-II messages for analysis
- **Session Replay**: Replay recorded sessions with speed control
- **REST API**: Control simulator via HTTP endpoints

## Quick Start

### Start the Simulator

```bash
# Using CLI
scavenger simulator start --port 5000 --equipment-id SIM001

# Using Docker
docker-compose up -d simulator
```

### Connect Your Host

Point your host application to `localhost:5000` with device ID 1.

### Run a Scenario

```bash
# YAML scenario
scavenger simulator scenario run basic_communication.yaml

# Python DSL scenario
scavenger simulator scenario run wafer_flow.py:WaferFlowScenario
```

## CLI Commands

```bash
# Simulator control
scavenger simulator start       # Start the simulator
scavenger simulator status      # Show current status

# Scenario management
scavenger simulator scenario list              # List available scenarios
scavenger simulator scenario run <name>        # Run a scenario
scavenger simulator scenario validate <file>   # Validate scenario syntax

# Replay control
scavenger simulator replay list                 # List replay sessions
scavenger simulator replay start <session_id>  # Start replay
scavenger simulator replay pause               # Pause playback
scavenger simulator replay resume              # Resume playback
scavenger simulator replay stop                # Stop playback

# Recording
scavenger simulator record sessions            # List recorded sessions
scavenger simulator record export <id>         # Export session data
```

## API Endpoints

### Simulator Status

```http
GET /api/simulator/status
```

### Replay Management

```http
POST /api/simulator/replay               # Create replay session
GET  /api/simulator/replay               # List sessions
GET  /api/simulator/replay/{id}          # Get session status
POST /api/simulator/replay/{id}/play     # Start playback
POST /api/simulator/replay/{id}/pause    # Pause playback
POST /api/simulator/replay/{id}/stop     # Stop playback
POST /api/simulator/replay/{id}/seek     # Seek to position
PUT  /api/simulator/replay/{id}/speed    # Set playback speed
```

### Scenarios

```http
GET  /api/simulator/scenarios            # List available scenarios
POST /api/simulator/scenarios/run        # Run a scenario
GET  /api/simulator/scenarios/status     # Get execution status
POST /api/simulator/scenarios/stop       # Stop current scenario
```

### Snapshots

```http
GET  /api/simulator/replay/{id}/snapshots              # List snapshots
POST /api/simulator/replay/{id}/snapshots              # Create snapshot
POST /api/simulator/replay/{id}/snapshots/{sid}/seek   # Seek to snapshot
POST /api/simulator/replay/{id}/snapshots/{sid}/fork   # Fork from snapshot
```

## Scenario Formats

### YAML Format

```yaml
name: my_scenario
description: Test scenario

initial_state:
  sv:
    1: "IDLE"
  ecv:
    100: 25.0

steps:
  - action: wait
    params:
      seconds: 1.0

  - action: set_sv
    params:
      sv_id: 1
      value: "PROCESSING"

  - action: trigger_event
    params:
      ceid: 10
```

### Python DSL Format

```python
from scavenger.simulator.scenario.dsl import (
    DSLScenario, wait, set_sv, trigger_event
)

class MyScenario(DSLScenario):
    name = "my_scenario"
    description = "Test scenario"

    initial_state = {
        "sv": {1: "IDLE"},
        "ecv": {100: 25.0},
    }

    steps = [
        wait(seconds=1.0),
        set_sv(sv_id=1, value="PROCESSING"),
        trigger_event(ceid=10),
    ]
```

## Available Actions

| Action | Description | Parameters |
|--------|-------------|------------|
| `wait` | Pause execution | `seconds` |
| `set_sv` | Set status variable | `sv_id`, `value` |
| `set_ecv` | Set equipment constant | `ecv_id`, `value` |
| `set_alarm` | Set alarm | `alarm_id`, `text` |
| `clear_alarm` | Clear alarm | `alarm_id` |
| `trigger_event` | Trigger collection event | `ceid`, `report_ids`, `dvs` |
| `send_message` | Send SECS-II message | `stream`, `function`, `body` |
| `expect_message` | Wait for message | `stream`, `function`, `timeout` |
| `log` | Log message | `message` |
| `repeat` | Repeat steps | `count`, `steps` |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `HSMS_PASSIVE_PORT` | 5000 | HSMS passive mode port |
| `HSMS_DEVICE_ID` | 1 | SECS device ID |
| `EQUIPMENT_ID` | SIM001 | Equipment identifier |
| `DATABASE_URL` | - | PostgreSQL connection URL |
| `REDIS_URL` | - | Redis connection URL |
| `LOG_LEVEL` | INFO | Logging level |

## Docker Services

```yaml
# Start all services
docker-compose up -d

# Start specific services
docker-compose up -d postgres redis simulator

# View logs
docker-compose logs -f simulator
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Host Application                      │
└─────────────────────┬───────────────────────────────────┘
                      │ HSMS/TCP
                      ▼
┌─────────────────────────────────────────────────────────┐
│                    Simulator                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ HSMS Server  │  │ Scenario     │  │ Message      │  │
│  │              │  │ Engine       │  │ Handler      │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                 │                 │          │
│  ┌──────▼─────────────────▼─────────────────▼───────┐  │
│  │               Equipment State                     │  │
│  │    (Status Variables, Alarms, Collection Events)  │  │
│  └──────────────────────┬───────────────────────────┘  │
└─────────────────────────┼───────────────────────────────┘
                          │ Redis Pub/Sub
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    Recorder Service                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Redis        │  │ Batch        │  │ PostgreSQL   │  │
│  │ Listener     │→ │ Writer       │→ │              │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Development

```bash
# Install with dev dependencies
pip install -e ".[dev,simulator]"

# Run tests
pytest tests/simulator/ -v

# Run specific test module
pytest tests/simulator/replay/ -v
pytest tests/simulator/scenario/ -v
```
