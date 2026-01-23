# SECS/GEM Simulator Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a comprehensive SECS/GEM simulation platform with equipment simulator, EAP client, scenario engine, message recorder, and replay service as Docker microservices.

**Architecture:** Microservices extending Scavenger - each service (equipment-sim, eap-client, scenario-engine, msg-recorder, replay-service) runs in its own container, communicating via gRPC and Redis pub/sub, with PostgreSQL for persistence.

**Tech Stack:** Python 3.12, secsgem (HSMS/SECS-II), grpcio, Redis, PostgreSQL+pgvector, FastAPI, SQLAlchemy async, Docker Compose

---

## Phase 1: Foundation (Core Protocol Layer)

### Task 1.1: Add Simulator Dependencies to pyproject.toml

**Files:**
- Modify: `scavenger/pyproject.toml`

**Step 1: Add simulator dependencies**

Add these dependencies to the `[project.optional-dependencies]` section:

```toml
simulator = [
    "grpcio>=1.60.0",
    "grpcio-tools>=1.60.0",
    "grpcio-reflection>=1.60.0",
    "redis>=5.0.0",
    "hiredis>=2.3.0",
]

all = [
    "scavenger[dev,simulator]",
]
```

**Step 2: Verify installation works**

Run: `cd scavenger && pip install -e ".[simulator]"`
Expected: Successfully installed grpcio, redis, etc.

**Step 3: Commit**

```bash
git add scavenger/pyproject.toml
git commit -m "feat: add simulator dependencies (grpcio, redis)"
```

---

### Task 1.2: Create HsmsSession Database Model

**Files:**
- Create: `scavenger/src/scavenger/db/models/hsms_session.py`
- Modify: `scavenger/src/scavenger/db/models/__init__.py`
- Create: `scavenger/tests/db/test_hsms_session.py`

**Step 1: Write the failing test**

```python
# scavenger/tests/db/test_hsms_session.py
import uuid
from datetime import datetime, timezone

import pytest

from scavenger.db.models.hsms_session import (
    HsmsSession,
    SessionType,
    LocalRole,
)


def test_hsms_session_model_attributes():
    """HsmsSession model has required fields."""
    session = HsmsSession(
        id=uuid.uuid4(),
        session_type=SessionType.SIMULATION,
        local_role=LocalRole.EQUIPMENT,
        local_port=5000,
        started_at=datetime.now(timezone.utc),
    )

    assert session.session_type == SessionType.SIMULATION
    assert session.local_role == LocalRole.EQUIPMENT
    assert session.local_port == 5000


def test_session_type_enum():
    """SessionType enum has expected values."""
    assert SessionType.SIMULATION.value == "simulation"
    assert SessionType.EXTERNAL.value == "external"
    assert SessionType.REPLAY.value == "replay"


def test_local_role_enum():
    """LocalRole enum has expected values."""
    assert LocalRole.EQUIPMENT.value == "equipment"
    assert LocalRole.HOST.value == "host"
```

**Step 2: Run test to verify it fails**

Run: `cd scavenger && pytest tests/db/test_hsms_session.py -v`
Expected: FAIL with "ModuleNotFoundError: No module named 'scavenger.db.models.hsms_session'"

**Step 3: Write the model implementation**

```python
# scavenger/src/scavenger/db/models/hsms_session.py
"""HSMS session tracking for simulator."""
import uuid
from datetime import datetime
from enum import Enum

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from scavenger.db.base import Base


class SessionType(str, Enum):
    """Type of HSMS session."""

    SIMULATION = "simulation"
    EXTERNAL = "external"
    REPLAY = "replay"


class LocalRole(str, Enum):
    """Local side role in HSMS connection."""

    EQUIPMENT = "equipment"
    HOST = "host"


class ConnectionState(str, Enum):
    """HSMS connection state."""

    NOT_CONNECTED = "not_connected"
    CONNECTED = "connected"
    SELECTED = "selected"


class HsmsSession(Base):
    """HSMS connection session record."""

    __tablename__ = "hsms_sessions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    equipment_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("equipment_models.id")
    )
    session_type: Mapped[SessionType] = mapped_column(String(20), nullable=False)
    local_role: Mapped[LocalRole] = mapped_column(String(20), nullable=False)
    remote_address: Mapped[str | None] = mapped_column(String(255))
    local_port: Mapped[int | None] = mapped_column(Integer)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    connection_state: Mapped[ConnectionState | None] = mapped_column(String(20))
    metadata_: Mapped[dict | None] = mapped_column("metadata", JSONB)
```

**Step 4: Update models __init__.py**

Add to `scavenger/src/scavenger/db/models/__init__.py`:

```python
from scavenger.db.models.hsms_session import (
    ConnectionState,
    HsmsSession,
    LocalRole,
    SessionType,
)
```

And add to `__all__`:

```python
    "HsmsSession",
    "SessionType",
    "LocalRole",
    "ConnectionState",
```

**Step 5: Run test to verify it passes**

Run: `cd scavenger && pytest tests/db/test_hsms_session.py -v`
Expected: PASS (3 tests)

**Step 6: Commit**

```bash
git add scavenger/src/scavenger/db/models/hsms_session.py \
        scavenger/src/scavenger/db/models/__init__.py \
        scavenger/tests/db/test_hsms_session.py
git commit -m "feat(db): add HsmsSession model for connection tracking"
```

---

### Task 1.3: Create SecsMessage Database Model

**Files:**
- Create: `scavenger/src/scavenger/db/models/secs_message.py`
- Modify: `scavenger/src/scavenger/db/models/__init__.py`
- Create: `scavenger/tests/db/test_secs_message.py`

**Step 1: Write the failing test**

```python
# scavenger/tests/db/test_secs_message.py
import uuid
from datetime import datetime, timezone

import pytest

from scavenger.db.models.secs_message import Direction, SecsMessage


def test_secs_message_model_attributes():
    """SecsMessage model has required fields."""
    msg = SecsMessage(
        session_id=uuid.uuid4(),
        sequence_num=1,
        timestamp=datetime.now(timezone.utc),
        direction=Direction.H2E,
        stream=1,
        function=13,
        wbit=True,
        raw_sml="S1F13 W",
    )

    assert msg.direction == Direction.H2E
    assert msg.stream == 1
    assert msg.function == 13
    assert msg.wbit is True


def test_direction_enum():
    """Direction enum has expected values."""
    assert Direction.H2E.value == "H2E"
    assert Direction.E2H.value == "E2H"
```

**Step 2: Run test to verify it fails**

Run: `cd scavenger && pytest tests/db/test_secs_message.py -v`
Expected: FAIL with "ModuleNotFoundError"

**Step 3: Write the model implementation**

```python
# scavenger/src/scavenger/db/models/secs_message.py
"""SECS-II message storage for recording and replay."""
import uuid
from datetime import datetime
from enum import Enum

from sqlalchemy import (
    BigInteger,
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    LargeBinary,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from scavenger.db.base import Base


class Direction(str, Enum):
    """Message direction."""

    H2E = "H2E"  # Host to Equipment
    E2H = "E2H"  # Equipment to Host


class SecsMessage(Base):
    """Recorded SECS-II message."""

    __tablename__ = "secs_messages"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("hsms_sessions.id"), nullable=False
    )
    sequence_num: Mapped[int] = mapped_column(BigInteger, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    direction: Mapped[Direction] = mapped_column(String(5), nullable=False)
    stream: Mapped[int] = mapped_column(Integer, nullable=False)
    function: Mapped[int] = mapped_column(Integer, nullable=False)
    wbit: Mapped[bool] = mapped_column(Boolean, nullable=False)
    system_bytes: Mapped[bytes | None] = mapped_column(LargeBinary)
    raw_sml: Mapped[str | None] = mapped_column(Text)
    raw_binary: Mapped[bytes | None] = mapped_column(LargeBinary)
    parsed_body: Mapped[dict | None] = mapped_column(JSONB)
    transaction_id: Mapped[int | None] = mapped_column(Integer)
    latency_ms: Mapped[float | None] = mapped_column(Float)

    __table_args__ = (
        Index("idx_secs_messages_session_seq", "session_id", "sequence_num"),
        Index("idx_secs_messages_stream_function", "stream", "function"),
        Index("idx_secs_messages_timestamp", "timestamp"),
    )
```

**Step 4: Update models __init__.py**

Add imports and exports for `SecsMessage` and `Direction`.

**Step 5: Run test to verify it passes**

Run: `cd scavenger && pytest tests/db/test_secs_message.py -v`
Expected: PASS (2 tests)

**Step 6: Commit**

```bash
git add scavenger/src/scavenger/db/models/secs_message.py \
        scavenger/src/scavenger/db/models/__init__.py \
        scavenger/tests/db/test_secs_message.py
git commit -m "feat(db): add SecsMessage model for message recording"
```

---

### Task 1.4: Create StateSnapshot Database Model

**Files:**
- Create: `scavenger/src/scavenger/db/models/state_snapshot.py`
- Modify: `scavenger/src/scavenger/db/models/__init__.py`
- Create: `scavenger/tests/db/test_state_snapshot.py`

**Step 1: Write the failing test**

```python
# scavenger/tests/db/test_state_snapshot.py
import uuid
from datetime import datetime, timezone

import pytest

from scavenger.db.models.state_snapshot import SnapshotType, StateSnapshot


def test_state_snapshot_model_attributes():
    """StateSnapshot model has required fields."""
    snap = StateSnapshot(
        session_id=uuid.uuid4(),
        snapshot_type=SnapshotType.CHECKPOINT,
        equipment_state={"svs": {"SV1": 100}, "alarms": []},
    )

    assert snap.snapshot_type == SnapshotType.CHECKPOINT
    assert snap.equipment_state["svs"]["SV1"] == 100


def test_snapshot_type_enum():
    """SnapshotType enum has expected values."""
    assert SnapshotType.PERIODIC.value == "periodic"
    assert SnapshotType.CHECKPOINT.value == "checkpoint"
    assert SnapshotType.SCENARIO_STEP.value == "scenario_step"
```

**Step 2: Run test to verify it fails**

Run: `cd scavenger && pytest tests/db/test_state_snapshot.py -v`
Expected: FAIL

**Step 3: Write the model implementation**

```python
# scavenger/src/scavenger/db/models/state_snapshot.py
"""State snapshots for deterministic replay."""
import uuid
from datetime import datetime
from enum import Enum

from sqlalchemy import BigInteger, DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from scavenger.db.base import Base


class SnapshotType(str, Enum):
    """Type of state snapshot."""

    PERIODIC = "periodic"
    CHECKPOINT = "checkpoint"
    SCENARIO_STEP = "scenario_step"


class StateSnapshot(Base):
    """Equipment state snapshot for replay."""

    __tablename__ = "state_snapshots"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("hsms_sessions.id"), nullable=False
    )
    after_message_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("secs_messages.id")
    )
    snapshot_type: Mapped[SnapshotType | None] = mapped_column(String(20))
    equipment_state: Mapped[dict | None] = mapped_column(JSONB)
    pending_transactions: Mapped[dict | None] = mapped_column(JSONB)
    scenario_context: Mapped[dict | None] = mapped_column(JSONB)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
```

**Step 4: Update models __init__.py**

Add imports and exports for `StateSnapshot` and `SnapshotType`.

**Step 5: Run test to verify it passes**

Run: `cd scavenger && pytest tests/db/test_state_snapshot.py -v`
Expected: PASS (2 tests)

**Step 6: Commit**

```bash
git add scavenger/src/scavenger/db/models/state_snapshot.py \
        scavenger/src/scavenger/db/models/__init__.py \
        scavenger/tests/db/test_state_snapshot.py
git commit -m "feat(db): add StateSnapshot model for replay capability"
```

---

### Task 1.5: Create Alembic Migration for Simulator Tables

**Files:**
- Create: `scavenger/alembic/versions/002_add_simulator_tables.py`

**Step 1: Generate migration stub**

Run: `cd scavenger && alembic revision -m "add simulator tables"`

**Step 2: Write migration content**

```python
# scavenger/alembic/versions/002_add_simulator_tables.py
"""Add simulator tables.

Revision ID: 002
Revises: 001
Create Date: 2026-01-23
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "hsms_sessions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("equipment_id", sa.Integer(), sa.ForeignKey("equipment_models.id")),
        sa.Column("session_type", sa.String(20), nullable=False),
        sa.Column("local_role", sa.String(20), nullable=False),
        sa.Column("remote_address", sa.String(255)),
        sa.Column("local_port", sa.Integer()),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("ended_at", sa.DateTime(timezone=True)),
        sa.Column("connection_state", sa.String(20)),
        sa.Column("metadata", postgresql.JSONB()),
    )

    op.create_table(
        "secs_messages",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column(
            "session_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("hsms_sessions.id"),
            nullable=False,
        ),
        sa.Column("sequence_num", sa.BigInteger(), nullable=False),
        sa.Column("timestamp", sa.DateTime(timezone=True), nullable=False),
        sa.Column("direction", sa.String(5), nullable=False),
        sa.Column("stream", sa.Integer(), nullable=False),
        sa.Column("function", sa.Integer(), nullable=False),
        sa.Column("wbit", sa.Boolean(), nullable=False),
        sa.Column("system_bytes", sa.LargeBinary()),
        sa.Column("raw_sml", sa.Text()),
        sa.Column("raw_binary", sa.LargeBinary()),
        sa.Column("parsed_body", postgresql.JSONB()),
        sa.Column("transaction_id", sa.Integer()),
        sa.Column("latency_ms", sa.Float()),
    )

    op.create_index(
        "idx_secs_messages_session_seq", "secs_messages", ["session_id", "sequence_num"]
    )
    op.create_index(
        "idx_secs_messages_stream_function", "secs_messages", ["stream", "function"]
    )
    op.create_index("idx_secs_messages_timestamp", "secs_messages", ["timestamp"])

    op.create_table(
        "state_snapshots",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column(
            "session_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("hsms_sessions.id"),
            nullable=False,
        ),
        sa.Column(
            "after_message_id", sa.BigInteger(), sa.ForeignKey("secs_messages.id")
        ),
        sa.Column("snapshot_type", sa.String(20)),
        sa.Column("equipment_state", postgresql.JSONB()),
        sa.Column("pending_transactions", postgresql.JSONB()),
        sa.Column("scenario_context", postgresql.JSONB()),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_table("state_snapshots")
    op.drop_index("idx_secs_messages_timestamp")
    op.drop_index("idx_secs_messages_stream_function")
    op.drop_index("idx_secs_messages_session_seq")
    op.drop_table("secs_messages")
    op.drop_table("hsms_sessions")
```

**Step 3: Commit**

```bash
git add scavenger/alembic/versions/002_add_simulator_tables.py
git commit -m "feat(db): add migration for simulator tables"
```

---

### Task 1.6: Create SECS-II Codec Wrapper

**Files:**
- Create: `scavenger/src/scavenger/simulator/__init__.py`
- Create: `scavenger/src/scavenger/simulator/common/__init__.py`
- Create: `scavenger/src/scavenger/simulator/common/codec.py`
- Create: `scavenger/tests/simulator/__init__.py`
- Create: `scavenger/tests/simulator/common/__init__.py`
- Create: `scavenger/tests/simulator/common/test_codec.py`

**Step 1: Write the failing test**

```python
# scavenger/tests/simulator/common/test_codec.py
"""Tests for SECS-II codec wrapper."""
import pytest

from scavenger.simulator.common.codec import SecsCodec


def test_codec_init():
    """SecsCodec initializes without error."""
    codec = SecsCodec()
    assert codec is not None


def test_encode_s1f1():
    """Encode S1F1 (Are You There) request."""
    codec = SecsCodec()
    result = codec.encode(stream=1, function=1, wbit=True, body=None)

    assert result.stream == 1
    assert result.function == 1
    assert result.wbit is True


def test_decode_s1f1():
    """Decode S1F1 binary to structured data."""
    codec = SecsCodec()

    # Encode first
    encoded = codec.encode(stream=1, function=1, wbit=True, body=None)

    # Decode back
    decoded = codec.decode(encoded.binary)

    assert decoded.stream == 1
    assert decoded.function == 1


def test_to_sml_s1f13():
    """Generate SML string for S1F13."""
    codec = SecsCodec()
    sml = codec.to_sml(stream=1, function=13, wbit=True, body={"MDLN": "TestEquip", "SOFTREV": "1.0"})

    assert "S1F13" in sml
    assert "W" in sml  # Wait bit


def test_encode_s1f3_with_list():
    """Encode S1F3 with list of SVIDs."""
    codec = SecsCodec()
    result = codec.encode(
        stream=1,
        function=3,
        wbit=True,
        body=[1, 2, 3],  # List of SVIDs
    )

    assert result.stream == 1
    assert result.function == 3
```

**Step 2: Run test to verify it fails**

Run: `cd scavenger && pytest tests/simulator/common/test_codec.py -v`
Expected: FAIL with "ModuleNotFoundError"

**Step 3: Create package __init__.py files**

```python
# scavenger/src/scavenger/simulator/__init__.py
"""SECS/GEM Simulator package."""

# scavenger/src/scavenger/simulator/common/__init__.py
"""Common simulator utilities."""

# scavenger/tests/simulator/__init__.py
# (empty)

# scavenger/tests/simulator/common/__init__.py
# (empty)
```

**Step 4: Write the codec implementation**

```python
# scavenger/src/scavenger/simulator/common/codec.py
"""SECS-II codec wrapper around secsgem."""
from dataclasses import dataclass
from typing import Any

import secsgem.common
import secsgem.secs


@dataclass
class EncodedMessage:
    """Result of encoding a SECS-II message."""

    stream: int
    function: int
    wbit: bool
    binary: bytes
    sml: str


@dataclass
class DecodedMessage:
    """Result of decoding a SECS-II message."""

    stream: int
    function: int
    wbit: bool
    body: Any


class SecsCodec:
    """Wrapper around secsgem for SECS-II encode/decode with JSON interop."""

    def encode(
        self,
        stream: int,
        function: int,
        wbit: bool,
        body: Any,
    ) -> EncodedMessage:
        """Encode a SECS-II message to binary format.

        Args:
            stream: SECS stream number
            function: SECS function number
            wbit: Wait bit (True for request expecting reply)
            body: Message body (dict, list, or primitive)

        Returns:
            EncodedMessage with binary and SML representation
        """
        # Convert Python types to secsgem data items
        secs_data = self._python_to_secs(body) if body is not None else None

        # Build the message
        msg = secsgem.secs.SecsMessage(stream, function, wbit, secs_data)
        binary = msg.encode()

        return EncodedMessage(
            stream=stream,
            function=function,
            wbit=wbit,
            binary=binary,
            sml=self.to_sml(stream, function, wbit, body),
        )

    def decode(self, data: bytes) -> DecodedMessage:
        """Decode binary SECS-II message.

        Args:
            data: Raw binary message

        Returns:
            DecodedMessage with parsed body
        """
        msg = secsgem.secs.SecsMessage.decode(data)
        body = self._secs_to_python(msg.data) if msg.data is not None else None

        return DecodedMessage(
            stream=msg.stream,
            function=msg.function,
            wbit=msg.wbit,
            body=body,
        )

    def to_sml(
        self,
        stream: int,
        function: int,
        wbit: bool,
        body: Any,
    ) -> str:
        """Generate human-readable SML representation.

        Args:
            stream: SECS stream number
            function: SECS function number
            wbit: Wait bit
            body: Message body

        Returns:
            SML string
        """
        w_str = " W" if wbit else ""
        header = f"S{stream}F{function}{w_str}"

        if body is None:
            return f"{header} ."

        body_sml = self._body_to_sml(body)
        return f"{header}\n{body_sml}\n."

    def _python_to_secs(self, value: Any) -> Any:
        """Convert Python type to secsgem data item."""
        if isinstance(value, list):
            return secsgem.secs.data_items.Array(
                [self._python_to_secs(v) for v in value]
            )
        elif isinstance(value, dict):
            # Convert dict to list of items for SECS-II
            items = []
            for k, v in value.items():
                items.append(secsgem.secs.data_items.A(str(k)))
                items.append(self._python_to_secs(v))
            return secsgem.secs.data_items.Array(items)
        elif isinstance(value, str):
            return secsgem.secs.data_items.A(value)
        elif isinstance(value, int):
            if value < 0:
                return secsgem.secs.data_items.I4(value)
            elif value <= 255:
                return secsgem.secs.data_items.U1(value)
            elif value <= 65535:
                return secsgem.secs.data_items.U2(value)
            else:
                return secsgem.secs.data_items.U4(value)
        elif isinstance(value, float):
            return secsgem.secs.data_items.F4(value)
        elif isinstance(value, bool):
            return secsgem.secs.data_items.Boolean(value)
        elif isinstance(value, bytes):
            return secsgem.secs.data_items.Binary(value)
        else:
            return secsgem.secs.data_items.A(str(value))

    def _secs_to_python(self, data: Any) -> Any:
        """Convert secsgem data item to Python type."""
        if hasattr(data, "__iter__") and not isinstance(data, (str, bytes)):
            return [self._secs_to_python(item) for item in data]
        elif hasattr(data, "get"):
            return data.get()
        else:
            return data

    def _body_to_sml(self, value: Any, indent: int = 2) -> str:
        """Convert body to SML format string."""
        prefix = " " * indent
        if isinstance(value, list):
            if not value:
                return f"{prefix}<L>"
            items = "\n".join(self._body_to_sml(v, indent + 2) for v in value)
            return f"{prefix}<L\n{items}\n{prefix}>"
        elif isinstance(value, dict):
            items = []
            for k, v in value.items():
                items.append(f'{" " * (indent + 2)}<A "{k}">')
                items.append(self._body_to_sml(v, indent + 2))
            return f"{prefix}<L\n" + "\n".join(items) + f"\n{prefix}>"
        elif isinstance(value, str):
            return f'{prefix}<A "{value}">'
        elif isinstance(value, int):
            return f"{prefix}<U4 {value}>"
        elif isinstance(value, float):
            return f"{prefix}<F4 {value}>"
        elif isinstance(value, bool):
            return f"{prefix}<BOOLEAN {value}>"
        else:
            return f'{prefix}<A "{value}">'
```

**Step 5: Run test to verify it passes**

Run: `cd scavenger && pytest tests/simulator/common/test_codec.py -v`
Expected: PASS (5 tests)

**Step 6: Commit**

```bash
git add scavenger/src/scavenger/simulator/ \
        scavenger/tests/simulator/
git commit -m "feat(simulator): add SECS-II codec wrapper around secsgem"
```

---

### Task 1.7: Create Message Dataclasses

**Files:**
- Create: `scavenger/src/scavenger/simulator/common/messages.py`
- Create: `scavenger/tests/simulator/common/test_messages.py`

**Step 1: Write the failing test**

```python
# scavenger/tests/simulator/common/test_messages.py
"""Tests for message dataclasses."""
import uuid
from datetime import datetime, timezone

import pytest

from scavenger.simulator.common.messages import (
    HsmsMessage,
    HsmsMessageType,
    SecsMessageData,
)


def test_hsms_message_type_enum():
    """HsmsMessageType enum has all HSMS message types."""
    assert HsmsMessageType.DATA_MESSAGE.value == 0
    assert HsmsMessageType.SELECT_REQ.value == 1
    assert HsmsMessageType.SELECT_RSP.value == 2
    assert HsmsMessageType.LINKTEST_REQ.value == 5
    assert HsmsMessageType.LINKTEST_RSP.value == 6
    assert HsmsMessageType.SEPARATE_REQ.value == 9


def test_secs_message_data():
    """SecsMessageData holds SECS-II message info."""
    msg = SecsMessageData(
        stream=1,
        function=13,
        wbit=True,
        system_bytes=b"\x00\x00\x00\x01",
        body={"MDLN": "Test", "SOFTREV": "1.0"},
    )

    assert msg.stream == 1
    assert msg.function == 13
    assert msg.sf == "S1F13"


def test_hsms_message():
    """HsmsMessage wraps SECS data with session context."""
    secs_data = SecsMessageData(stream=1, function=1, wbit=True)
    hsms = HsmsMessage(
        session_id=uuid.uuid4(),
        timestamp=datetime.now(timezone.utc),
        direction="H2E",
        message_type=HsmsMessageType.DATA_MESSAGE,
        data=secs_data,
    )

    assert hsms.direction == "H2E"
    assert hsms.data.stream == 1
```

**Step 2: Run test to verify it fails**

Run: `cd scavenger && pytest tests/simulator/common/test_messages.py -v`
Expected: FAIL

**Step 3: Write the implementation**

```python
# scavenger/src/scavenger/simulator/common/messages.py
"""Message dataclasses for simulator."""
import uuid
from dataclasses import dataclass, field
from datetime import datetime
from enum import IntEnum
from typing import Any, Literal


class HsmsMessageType(IntEnum):
    """HSMS message types (SType)."""

    DATA_MESSAGE = 0
    SELECT_REQ = 1
    SELECT_RSP = 2
    DESELECT_REQ = 3
    DESELECT_RSP = 4
    LINKTEST_REQ = 5
    LINKTEST_RSP = 6
    REJECT_REQ = 7
    SEPARATE_REQ = 9


@dataclass
class SecsMessageData:
    """SECS-II message data."""

    stream: int
    function: int
    wbit: bool = False
    system_bytes: bytes | None = None
    body: Any = None
    raw_sml: str | None = None
    raw_binary: bytes | None = None

    @property
    def sf(self) -> str:
        """Stream/function string (e.g., 'S1F13')."""
        return f"S{self.stream}F{self.function}"


@dataclass
class HsmsMessage:
    """HSMS message with session context."""

    session_id: uuid.UUID
    timestamp: datetime
    direction: Literal["H2E", "E2H"]
    message_type: HsmsMessageType
    data: SecsMessageData | None = None
    sequence_num: int = 0
    transaction_id: int | None = None


@dataclass
class TransactionContext:
    """Tracks a request/reply transaction."""

    transaction_id: int
    request: HsmsMessage
    sent_at: datetime
    reply: HsmsMessage | None = None
    received_at: datetime | None = None

    @property
    def latency_ms(self) -> float | None:
        """Calculate latency if reply received."""
        if self.received_at is None:
            return None
        delta = self.received_at - self.sent_at
        return delta.total_seconds() * 1000
```

**Step 4: Run test to verify it passes**

Run: `cd scavenger && pytest tests/simulator/common/test_messages.py -v`
Expected: PASS (3 tests)

**Step 5: Commit**

```bash
git add scavenger/src/scavenger/simulator/common/messages.py \
        scavenger/tests/simulator/common/test_messages.py
git commit -m "feat(simulator): add message dataclasses for HSMS/SECS-II"
```

---

### Task 1.8: Create HSMS Timer Manager

**Files:**
- Create: `scavenger/src/scavenger/simulator/common/timers.py`
- Create: `scavenger/tests/simulator/common/test_timers.py`

**Step 1: Write the failing test**

```python
# scavenger/tests/simulator/common/test_timers.py
"""Tests for HSMS timer management."""
import asyncio

import pytest

from scavenger.simulator.common.timers import HsmsTimers, TimerType


def test_timer_type_enum():
    """TimerType enum has all HSMS timers."""
    assert TimerType.T3.value == "T3"
    assert TimerType.T5.value == "T5"
    assert TimerType.T6.value == "T6"
    assert TimerType.T7.value == "T7"
    assert TimerType.T8.value == "T8"


def test_hsms_timers_default_values():
    """HsmsTimers has sensible defaults per SEMI E37."""
    timers = HsmsTimers()

    assert timers.t3 == 45.0  # Reply timeout
    assert timers.t5 == 10.0  # Connect separation
    assert timers.t6 == 5.0   # Control timeout
    assert timers.t7 == 10.0  # Not selected
    assert timers.t8 == 5.0   # Network interchar


def test_hsms_timers_custom_values():
    """HsmsTimers accepts custom timeout values."""
    timers = HsmsTimers(t3=60.0, t6=10.0)

    assert timers.t3 == 60.0
    assert timers.t6 == 10.0


@pytest.mark.asyncio
async def test_timer_start_and_cancel():
    """Timer can be started and cancelled."""
    timers = HsmsTimers(t3=0.1)
    callback_called = False

    async def on_timeout():
        nonlocal callback_called
        callback_called = True

    timers.start_timer(TimerType.T3, on_timeout)
    assert timers.is_active(TimerType.T3)

    timers.cancel_timer(TimerType.T3)
    assert not timers.is_active(TimerType.T3)

    await asyncio.sleep(0.15)
    assert not callback_called


@pytest.mark.asyncio
async def test_timer_fires_callback():
    """Timer fires callback on expiration."""
    timers = HsmsTimers(t3=0.05)
    callback_called = False

    async def on_timeout():
        nonlocal callback_called
        callback_called = True

    timers.start_timer(TimerType.T3, on_timeout)
    await asyncio.sleep(0.1)

    assert callback_called
```

**Step 2: Run test to verify it fails**

Run: `cd scavenger && pytest tests/simulator/common/test_timers.py -v`
Expected: FAIL

**Step 3: Write the implementation**

```python
# scavenger/src/scavenger/simulator/common/timers.py
"""HSMS timer management per SEMI E37."""
import asyncio
from dataclasses import dataclass, field
from enum import Enum
from typing import Awaitable, Callable


class TimerType(str, Enum):
    """HSMS timer types per SEMI E37."""

    T3 = "T3"  # Reply timeout
    T5 = "T5"  # Connect separation timeout
    T6 = "T6"  # Control transaction timeout
    T7 = "T7"  # Not selected timeout
    T8 = "T8"  # Network intercharacter timeout


@dataclass
class HsmsTimers:
    """HSMS timer configuration and management.

    Default values per SEMI E37 recommendations.
    """

    t3: float = 45.0  # Reply timeout (1-120s, default 45s)
    t5: float = 10.0  # Connect separation (1-240s, default 10s)
    t6: float = 5.0   # Control transaction (1-240s, default 5s)
    t7: float = 10.0  # Not selected (1-240s, default 10s)
    t8: float = 5.0   # Network intercharacter (1-120s, default 5s)

    _active_timers: dict[TimerType, asyncio.Task] = field(
        default_factory=dict, repr=False
    )

    def get_timeout(self, timer_type: TimerType) -> float:
        """Get timeout value for timer type."""
        return {
            TimerType.T3: self.t3,
            TimerType.T5: self.t5,
            TimerType.T6: self.t6,
            TimerType.T7: self.t7,
            TimerType.T8: self.t8,
        }[timer_type]

    def start_timer(
        self,
        timer_type: TimerType,
        callback: Callable[[], Awaitable[None]],
    ) -> None:
        """Start a timer with callback on expiration.

        Args:
            timer_type: Which timer to start
            callback: Async function to call on timeout
        """
        self.cancel_timer(timer_type)

        timeout = self.get_timeout(timer_type)

        async def timer_task():
            await asyncio.sleep(timeout)
            if timer_type in self._active_timers:
                del self._active_timers[timer_type]
                await callback()

        self._active_timers[timer_type] = asyncio.create_task(timer_task())

    def cancel_timer(self, timer_type: TimerType) -> None:
        """Cancel an active timer."""
        if timer_type in self._active_timers:
            self._active_timers[timer_type].cancel()
            del self._active_timers[timer_type]

    def cancel_all(self) -> None:
        """Cancel all active timers."""
        for timer_type in list(self._active_timers.keys()):
            self.cancel_timer(timer_type)

    def is_active(self, timer_type: TimerType) -> bool:
        """Check if timer is currently active."""
        return timer_type in self._active_timers

    def reset_timer(
        self,
        timer_type: TimerType,
        callback: Callable[[], Awaitable[None]],
    ) -> None:
        """Reset (restart) a timer."""
        self.start_timer(timer_type, callback)
```

**Step 4: Run test to verify it passes**

Run: `cd scavenger && pytest tests/simulator/common/test_timers.py -v`
Expected: PASS (5 tests)

**Step 5: Commit**

```bash
git add scavenger/src/scavenger/simulator/common/timers.py \
        scavenger/tests/simulator/common/test_timers.py
git commit -m "feat(simulator): add HSMS timer manager per SEMI E37"
```

---

### Task 1.9: Update Config with Simulator Settings

**Files:**
- Modify: `scavenger/src/scavenger/config.py`
- Create: `scavenger/tests/test_config_simulator.py`

**Step 1: Write the failing test**

```python
# scavenger/tests/test_config_simulator.py
"""Tests for simulator configuration."""
import pytest

from scavenger.config import Settings


def test_settings_has_redis_url():
    """Settings includes Redis URL for simulator."""
    settings = Settings()
    assert hasattr(settings, "redis_url")
    assert "redis://" in settings.redis_url


def test_settings_has_grpc_ports():
    """Settings includes gRPC ports for services."""
    settings = Settings()

    assert settings.equipment_sim_grpc_port == 8001
    assert settings.eap_client_grpc_port == 8002
    assert settings.scenario_engine_grpc_port == 8003
    assert settings.msg_recorder_grpc_port == 8005
    assert settings.replay_service_grpc_port == 8006


def test_settings_has_recorder_config():
    """Settings includes message recorder configuration."""
    settings = Settings()

    assert settings.recorder_batch_size == 100
    assert settings.recorder_flush_interval_ms == 500
```

**Step 2: Run test to verify it fails**

Run: `cd scavenger && pytest tests/test_config_simulator.py -v`
Expected: FAIL with "AttributeError"

**Step 3: Update config.py with simulator settings**

Add these fields to the Settings class in `scavenger/src/scavenger/config.py`:

```python
    # Redis (for simulator message streaming)
    redis_url: str = Field(
        default="redis://localhost:6379",
        description="Redis connection URL for pub/sub",
    )

    # Simulator gRPC Ports
    equipment_sim_grpc_port: int = Field(default=8001, description="Equipment sim gRPC port")
    eap_client_grpc_port: int = Field(default=8002, description="EAP client gRPC port")
    scenario_engine_grpc_port: int = Field(default=8003, description="Scenario engine gRPC port")
    scenario_engine_http_port: int = Field(default=8004, description="Scenario engine HTTP port")
    msg_recorder_grpc_port: int = Field(default=8005, description="Message recorder gRPC port")
    replay_service_grpc_port: int = Field(default=8006, description="Replay service gRPC port")

    # Message Recorder
    recorder_batch_size: int = Field(default=100, description="Batch size for DB inserts")
    recorder_flush_interval_ms: int = Field(default=500, description="Flush interval in ms")

    # Replay Service
    replay_port_range_start: int = Field(default=5001, description="Start of HSMS replay port range")
    replay_port_range_end: int = Field(default=5010, description="End of HSMS replay port range")
```

**Step 4: Run test to verify it passes**

Run: `cd scavenger && pytest tests/test_config_simulator.py -v`
Expected: PASS (3 tests)

**Step 5: Commit**

```bash
git add scavenger/src/scavenger/config.py \
        scavenger/tests/test_config_simulator.py
git commit -m "feat(config): add simulator settings for Redis, gRPC ports, recorder"
```

---

## Phase 1 Complete Checkpoint

At this point, you should have:
- ✅ Simulator dependencies added to pyproject.toml
- ✅ HsmsSession, SecsMessage, StateSnapshot database models
- ✅ Alembic migration for simulator tables
- ✅ SecsCodec wrapper around secsgem
- ✅ Message dataclasses (HsmsMessage, SecsMessageData)
- ✅ HSMS timer manager
- ✅ Config extended with simulator settings

**Verify all tests pass:**

Run: `cd scavenger && pytest tests/ -v --ignore=tests/integration`
Expected: All tests PASS

**Commit checkpoint:**

```bash
git add -A
git commit -m "checkpoint: Phase 1 complete - simulator foundation"
```

---

## Phase 2: Equipment Simulator

### Task 2.1: Create Equipment State Manager

**Files:**
- Create: `scavenger/src/scavenger/simulator/equipment/__init__.py`
- Create: `scavenger/src/scavenger/simulator/equipment/state.py`
- Create: `scavenger/tests/simulator/equipment/__init__.py`
- Create: `scavenger/tests/simulator/equipment/test_state.py`

**Step 1: Write the failing test**

```python
# scavenger/tests/simulator/equipment/test_state.py
"""Tests for equipment state manager."""
import pytest

from scavenger.simulator.equipment.state import (
    AlarmState,
    EquipmentState,
    ProcessState,
    VariableType,
)


def test_equipment_state_init():
    """EquipmentState initializes with defaults."""
    state = EquipmentState(equipment_id=1)

    assert state.equipment_id == 1
    assert state.process_state == ProcessState.IDLE
    assert state.control_state == "OFFLINE"


def test_equipment_state_set_sv():
    """Can set and get status variables."""
    state = EquipmentState(equipment_id=1)

    state.set_variable(VariableType.SV, 1, 100)
    assert state.get_variable(VariableType.SV, 1) == 100


def test_equipment_state_set_alarm():
    """Can set alarms with ALID/ALCD/ALTX."""
    state = EquipmentState(equipment_id=1)

    state.set_alarm(alid=1001, alcd=2, altx="Chuck vacuum low")

    alarm = state.get_alarm(1001)
    assert alarm is not None
    assert alarm.alcd == 2
    assert alarm.altx == "Chuck vacuum low"
    assert alarm.is_set is True


def test_equipment_state_clear_alarm():
    """Can clear an alarm."""
    state = EquipmentState(equipment_id=1)

    state.set_alarm(alid=1001, alcd=2, altx="Test alarm")
    state.clear_alarm(1001)

    alarm = state.get_alarm(1001)
    assert alarm.is_set is False


def test_equipment_state_get_all_alarms():
    """Can get all set alarms."""
    state = EquipmentState(equipment_id=1)

    state.set_alarm(1001, 2, "Alarm 1")
    state.set_alarm(1002, 3, "Alarm 2")

    alarms = state.get_set_alarms()
    assert len(alarms) == 2


def test_equipment_state_to_dict():
    """Can serialize state to dict for snapshots."""
    state = EquipmentState(equipment_id=1)
    state.set_variable(VariableType.SV, 1, 100)
    state.set_alarm(1001, 2, "Test")

    snapshot = state.to_dict()

    assert "svs" in snapshot
    assert "alarms" in snapshot
    assert snapshot["svs"][1] == 100
```

**Step 2: Run test to verify it fails**

Run: `cd scavenger && pytest tests/simulator/equipment/test_state.py -v`
Expected: FAIL

**Step 3: Create __init__.py files**

```python
# scavenger/src/scavenger/simulator/equipment/__init__.py
"""Equipment simulator package."""

# scavenger/tests/simulator/equipment/__init__.py
# (empty)
```

**Step 4: Write the implementation**

```python
# scavenger/src/scavenger/simulator/equipment/state.py
"""Equipment state management."""
from dataclasses import dataclass, field
from enum import Enum
from typing import Any


class ProcessState(str, Enum):
    """Equipment process state."""

    IDLE = "IDLE"
    SETUP = "SETUP"
    READY = "READY"
    EXECUTING = "EXECUTING"
    PAUSED = "PAUSED"


class VariableType(str, Enum):
    """SECS-II variable types."""

    SV = "SV"    # Status Variable
    DV = "DV"    # Data Variable
    ECV = "ECV"  # Equipment Constant Variable


@dataclass
class AlarmState:
    """State of a single alarm."""

    alid: int
    alcd: int
    altx: str
    is_set: bool = False


@dataclass
class EquipmentState:
    """Complete equipment state for simulation."""

    equipment_id: int
    process_state: ProcessState = ProcessState.IDLE
    control_state: str = "OFFLINE"

    # Variables: {vid: value}
    _svs: dict[int, Any] = field(default_factory=dict)
    _dvs: dict[int, Any] = field(default_factory=dict)
    _ecvs: dict[int, Any] = field(default_factory=dict)

    # Alarms: {alid: AlarmState}
    _alarms: dict[int, AlarmState] = field(default_factory=dict)

    # Collection events enabled: {ceid: bool}
    _ceids_enabled: dict[int, bool] = field(default_factory=dict)

    def set_variable(self, var_type: VariableType, vid: int, value: Any) -> None:
        """Set a variable value."""
        store = self._get_variable_store(var_type)
        store[vid] = value

    def get_variable(self, var_type: VariableType, vid: int) -> Any:
        """Get a variable value, returns None if not set."""
        store = self._get_variable_store(var_type)
        return store.get(vid)

    def get_variables(self, var_type: VariableType, vids: list[int]) -> list[Any]:
        """Get multiple variable values."""
        return [self.get_variable(var_type, vid) for vid in vids]

    def _get_variable_store(self, var_type: VariableType) -> dict[int, Any]:
        """Get the storage dict for a variable type."""
        return {
            VariableType.SV: self._svs,
            VariableType.DV: self._dvs,
            VariableType.ECV: self._ecvs,
        }[var_type]

    def set_alarm(self, alid: int, alcd: int, altx: str) -> None:
        """Set (raise) an alarm."""
        self._alarms[alid] = AlarmState(alid=alid, alcd=alcd, altx=altx, is_set=True)

    def clear_alarm(self, alid: int) -> None:
        """Clear an alarm."""
        if alid in self._alarms:
            self._alarms[alid].is_set = False

    def get_alarm(self, alid: int) -> AlarmState | None:
        """Get alarm state by ALID."""
        return self._alarms.get(alid)

    def get_set_alarms(self) -> list[AlarmState]:
        """Get all currently set alarms."""
        return [a for a in self._alarms.values() if a.is_set]

    def enable_ceid(self, ceid: int, enabled: bool = True) -> None:
        """Enable or disable a collection event."""
        self._ceids_enabled[ceid] = enabled

    def is_ceid_enabled(self, ceid: int) -> bool:
        """Check if a collection event is enabled."""
        return self._ceids_enabled.get(ceid, True)  # Default enabled

    def to_dict(self) -> dict[str, Any]:
        """Serialize state for snapshots."""
        return {
            "equipment_id": self.equipment_id,
            "process_state": self.process_state.value,
            "control_state": self.control_state,
            "svs": dict(self._svs),
            "dvs": dict(self._dvs),
            "ecvs": dict(self._ecvs),
            "alarms": {
                alid: {
                    "alid": a.alid,
                    "alcd": a.alcd,
                    "altx": a.altx,
                    "is_set": a.is_set,
                }
                for alid, a in self._alarms.items()
            },
            "ceids_enabled": dict(self._ceids_enabled),
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "EquipmentState":
        """Restore state from snapshot dict."""
        state = cls(equipment_id=data["equipment_id"])
        state.process_state = ProcessState(data["process_state"])
        state.control_state = data["control_state"]
        state._svs = data.get("svs", {})
        state._dvs = data.get("dvs", {})
        state._ecvs = data.get("ecvs", {})
        state._ceids_enabled = data.get("ceids_enabled", {})

        for alid, alarm_data in data.get("alarms", {}).items():
            state._alarms[int(alid)] = AlarmState(
                alid=alarm_data["alid"],
                alcd=alarm_data["alcd"],
                altx=alarm_data["altx"],
                is_set=alarm_data["is_set"],
            )

        return state
```

**Step 5: Run test to verify it passes**

Run: `cd scavenger && pytest tests/simulator/equipment/test_state.py -v`
Expected: PASS (7 tests)

**Step 6: Commit**

```bash
git add scavenger/src/scavenger/simulator/equipment/ \
        scavenger/tests/simulator/equipment/
git commit -m "feat(simulator): add equipment state manager"
```

---

### Task 2.2: Create Message Handlers

**Files:**
- Create: `scavenger/src/scavenger/simulator/equipment/handlers.py`
- Create: `scavenger/tests/simulator/equipment/test_handlers.py`

**Step 1: Write the failing test**

```python
# scavenger/tests/simulator/equipment/test_handlers.py
"""Tests for SECS message handlers."""
import pytest

from scavenger.simulator.common.messages import SecsMessageData
from scavenger.simulator.equipment.handlers import MessageHandlerRegistry, handler
from scavenger.simulator.equipment.state import EquipmentState


def test_handler_registry_registers():
    """@handler decorator registers functions."""
    registry = MessageHandlerRegistry()

    @registry.handler(1, 1)
    async def handle_s1f1(state, msg):
        return SecsMessageData(stream=1, function=2, body=None)

    assert registry.has_handler(1, 1)
    assert not registry.has_handler(1, 3)


@pytest.mark.asyncio
async def test_handler_s1f1_returns_s1f2():
    """S1F1 handler returns S1F2."""
    from scavenger.simulator.equipment.handlers import default_handlers

    state = EquipmentState(equipment_id=1)
    request = SecsMessageData(stream=1, function=1, wbit=True)

    reply = await default_handlers.dispatch(state, request)

    assert reply is not None
    assert reply.stream == 1
    assert reply.function == 2


@pytest.mark.asyncio
async def test_handler_s1f13_returns_s1f14():
    """S1F13 (Establish Comm) returns S1F14."""
    from scavenger.simulator.equipment.handlers import default_handlers

    state = EquipmentState(equipment_id=1)
    request = SecsMessageData(
        stream=1, function=13, wbit=True,
        body={"MDLN": "TestHost", "SOFTREV": "1.0"}
    )

    reply = await default_handlers.dispatch(state, request)

    assert reply is not None
    assert reply.stream == 1
    assert reply.function == 14


@pytest.mark.asyncio
async def test_handler_s1f3_returns_svs():
    """S1F3 (Selected Equipment Status) returns SV values."""
    from scavenger.simulator.equipment.handlers import default_handlers

    state = EquipmentState(equipment_id=1)
    state.set_variable(state.VariableType.SV, 1, 100)
    state.set_variable(state.VariableType.SV, 2, 200)

    request = SecsMessageData(stream=1, function=3, wbit=True, body=[1, 2])

    reply = await default_handlers.dispatch(state, request)

    assert reply.stream == 1
    assert reply.function == 4
    assert reply.body == [100, 200]
```

**Step 2: Run test to verify it fails**

Run: `cd scavenger && pytest tests/simulator/equipment/test_handlers.py -v`
Expected: FAIL

**Step 3: Write the implementation**

```python
# scavenger/src/scavenger/simulator/equipment/handlers.py
"""SECS message handlers for equipment simulator."""
from typing import Any, Awaitable, Callable

from scavenger.simulator.common.messages import SecsMessageData
from scavenger.simulator.equipment.state import EquipmentState, VariableType


HandlerFunc = Callable[[EquipmentState, SecsMessageData], Awaitable[SecsMessageData | None]]


class MessageHandlerRegistry:
    """Registry of SECS message handlers."""

    def __init__(self) -> None:
        self._handlers: dict[tuple[int, int], HandlerFunc] = {}

    def handler(self, stream: int, function: int) -> Callable[[HandlerFunc], HandlerFunc]:
        """Decorator to register a handler for stream/function."""
        def decorator(func: HandlerFunc) -> HandlerFunc:
            self._handlers[(stream, function)] = func
            return func
        return decorator

    def has_handler(self, stream: int, function: int) -> bool:
        """Check if handler exists for stream/function."""
        return (stream, function) in self._handlers

    async def dispatch(
        self,
        state: EquipmentState,
        request: SecsMessageData,
    ) -> SecsMessageData | None:
        """Dispatch message to appropriate handler.

        Returns reply message or None if no reply needed.
        """
        handler = self._handlers.get((request.stream, request.function))
        if handler is None:
            # Unknown message - return S9F7 (Illegal Data)
            return SecsMessageData(stream=9, function=7, body=request.sf)

        return await handler(state, request)


# Default handlers for common GEM messages
default_handlers = MessageHandlerRegistry()


@default_handlers.handler(1, 1)
async def handle_s1f1(state: EquipmentState, request: SecsMessageData) -> SecsMessageData:
    """S1F1 Are You There - reply S1F2."""
    return SecsMessageData(stream=1, function=2, body=None)


@default_handlers.handler(1, 13)
async def handle_s1f13(state: EquipmentState, request: SecsMessageData) -> SecsMessageData:
    """S1F13 Establish Communication - reply S1F14."""
    # COMMACK = 0 (accepted)
    # MDLN, SOFTREV from equipment
    return SecsMessageData(
        stream=1,
        function=14,
        body={
            "COMMACK": 0,
            "MDLN": f"SimEquip-{state.equipment_id}",
            "SOFTREV": "1.0.0",
        },
    )


@default_handlers.handler(1, 3)
async def handle_s1f3(state: EquipmentState, request: SecsMessageData) -> SecsMessageData:
    """S1F3 Selected Equipment Status Request - reply S1F4 with SV values."""
    svids = request.body if isinstance(request.body, list) else []
    values = state.get_variables(VariableType.SV, svids)
    return SecsMessageData(stream=1, function=4, body=values)


@default_handlers.handler(1, 11)
async def handle_s1f11(state: EquipmentState, request: SecsMessageData) -> SecsMessageData:
    """S1F11 Status Variable Namelist Request - reply S1F12."""
    # Return list of SV definitions
    svids = request.body if isinstance(request.body, list) else []
    # For each SVID, return [SVID, SVNAME, UNITS]
    sv_info = []
    for svid in svids:
        sv_info.append([svid, f"SV{svid}", ""])
    return SecsMessageData(stream=1, function=12, body=sv_info)


@default_handlers.handler(2, 13)
async def handle_s2f13(state: EquipmentState, request: SecsMessageData) -> SecsMessageData:
    """S2F13 Equipment Constant Request - reply S2F14 with ECV values."""
    ecids = request.body if isinstance(request.body, list) else []
    values = state.get_variables(VariableType.ECV, ecids)
    return SecsMessageData(stream=2, function=14, body=values)


@default_handlers.handler(2, 15)
async def handle_s2f15(state: EquipmentState, request: SecsMessageData) -> SecsMessageData:
    """S2F15 New Equipment Constant Send - reply S2F16."""
    # request.body = [[ECID, ECV], ...]
    if isinstance(request.body, list):
        for item in request.body:
            if isinstance(item, list) and len(item) >= 2:
                ecid, ecv = item[0], item[1]
                state.set_variable(VariableType.ECV, ecid, ecv)
    # EAC = 0 (accepted)
    return SecsMessageData(stream=2, function=16, body=0)


@default_handlers.handler(5, 3)
async def handle_s5f3(state: EquipmentState, request: SecsMessageData) -> SecsMessageData:
    """S5F3 Enable/Disable Alarm Send - reply S5F4."""
    # request.body = {ALED, ALID}
    # ALED bit 7: 0=disable, 1=enable
    body = request.body if isinstance(request.body, dict) else {}
    aled = body.get("ALED", 0)
    alid = body.get("ALID", 0)

    # ALED bit 7 indicates enable/disable
    enabled = bool(aled & 0x80)

    if alid == 0:
        # All alarms
        pass  # Would enable/disable all
    else:
        if not enabled:
            state.clear_alarm(alid)

    # ACKC5 = 0 (accepted)
    return SecsMessageData(stream=5, function=4, body=0)


# Add state.VariableType reference for tests
EquipmentState.VariableType = VariableType
```

**Step 4: Run test to verify it passes**

Run: `cd scavenger && pytest tests/simulator/equipment/test_handlers.py -v`
Expected: PASS (4 tests)

**Step 5: Commit**

```bash
git add scavenger/src/scavenger/simulator/equipment/handlers.py \
        scavenger/tests/simulator/equipment/test_handlers.py
git commit -m "feat(simulator): add SECS message handlers for equipment"
```

---

### Task 2.3: Create HSMS Passive Server

**Files:**
- Create: `scavenger/src/scavenger/simulator/equipment/server.py`
- Create: `scavenger/tests/simulator/equipment/test_server.py`

**Step 1: Write the failing test**

```python
# scavenger/tests/simulator/equipment/test_server.py
"""Tests for HSMS passive server."""
import asyncio

import pytest

from scavenger.simulator.equipment.server import EquipmentServer


def test_equipment_server_init():
    """EquipmentServer initializes with config."""
    server = EquipmentServer(
        equipment_id=1,
        host="0.0.0.0",
        port=5000,
        device_id=1,
    )

    assert server.equipment_id == 1
    assert server.port == 5000
    assert server.is_running is False


@pytest.mark.asyncio
async def test_equipment_server_start_stop():
    """EquipmentServer can start and stop."""
    server = EquipmentServer(
        equipment_id=1,
        host="127.0.0.1",
        port=15000,  # Use high port for tests
        device_id=1,
    )

    await server.start()
    assert server.is_running is True

    await server.stop()
    assert server.is_running is False


@pytest.mark.asyncio
async def test_equipment_server_get_state():
    """EquipmentServer provides equipment state."""
    server = EquipmentServer(
        equipment_id=1,
        host="127.0.0.1",
        port=15001,
        device_id=1,
    )

    state = server.get_state()
    assert state.equipment_id == 1


@pytest.mark.asyncio
async def test_equipment_server_inject_alarm():
    """Can inject alarm into running server."""
    server = EquipmentServer(
        equipment_id=1,
        host="127.0.0.1",
        port=15002,
        device_id=1,
    )

    await server.start()
    try:
        await server.inject_alarm(alid=1001, alcd=2, altx="Test alarm")
        alarm = server.get_state().get_alarm(1001)
        assert alarm is not None
        assert alarm.is_set is True
    finally:
        await server.stop()
```

**Step 2: Run test to verify it fails**

Run: `cd scavenger && pytest tests/simulator/equipment/test_server.py -v`
Expected: FAIL

**Step 3: Write the implementation**

```python
# scavenger/src/scavenger/simulator/equipment/server.py
"""HSMS passive server for equipment simulation."""
import asyncio
import logging
import uuid
from datetime import datetime, timezone
from typing import Any

from scavenger.simulator.common.messages import (
    HsmsMessage,
    HsmsMessageType,
    SecsMessageData,
)
from scavenger.simulator.common.timers import HsmsTimers, TimerType
from scavenger.simulator.equipment.handlers import default_handlers
from scavenger.simulator.equipment.state import EquipmentState

logger = logging.getLogger(__name__)


class EquipmentServer:
    """HSMS passive mode equipment simulator.

    Listens for host connections and responds to SECS messages.
    """

    def __init__(
        self,
        equipment_id: int,
        host: str = "0.0.0.0",
        port: int = 5000,
        device_id: int = 1,
        t3: float = 45.0,
        t6: float = 5.0,
        t7: float = 10.0,
    ) -> None:
        """Initialize equipment server.

        Args:
            equipment_id: Equipment identifier for state tracking
            host: Interface to bind to
            port: TCP port for HSMS passive mode
            device_id: SECS device ID
            t3: Reply timeout
            t6: Control timeout
            t7: Not selected timeout
        """
        self.equipment_id = equipment_id
        self.host = host
        self.port = port
        self.device_id = device_id

        self._state = EquipmentState(equipment_id=equipment_id)
        self._timers = HsmsTimers(t3=t3, t6=t6, t7=t7)

        self._server: asyncio.Server | None = None
        self._clients: dict[str, asyncio.StreamWriter] = {}
        self._session_id: uuid.UUID | None = None
        self._selected: bool = False
        self._sequence_num: int = 0

        # Message queue for outbound messages (alarms, events)
        self._outbound_queue: asyncio.Queue[HsmsMessage] = asyncio.Queue()

        # Callbacks for message recording
        self._on_message_callbacks: list[Any] = []

    @property
    def is_running(self) -> bool:
        """Check if server is running."""
        return self._server is not None and self._server.is_serving()

    def get_state(self) -> EquipmentState:
        """Get current equipment state."""
        return self._state

    async def start(self) -> None:
        """Start the HSMS server."""
        self._server = await asyncio.start_server(
            self._handle_client,
            self.host,
            self.port,
        )
        self._session_id = uuid.uuid4()
        logger.info(f"Equipment server started on {self.host}:{self.port}")

    async def stop(self) -> None:
        """Stop the HSMS server."""
        if self._server:
            self._server.close()
            await self._server.wait_closed()
            self._server = None

        # Close all client connections
        for writer in self._clients.values():
            writer.close()
            await writer.wait_closed()
        self._clients.clear()

        self._timers.cancel_all()
        logger.info("Equipment server stopped")

    async def inject_alarm(self, alid: int, alcd: int, altx: str) -> None:
        """Inject an alarm and send S5F1 to connected hosts.

        Args:
            alid: Alarm ID
            alcd: Alarm code (1-8 per SEMI E30)
            altx: Alarm text
        """
        self._state.set_alarm(alid, alcd, altx)

        # Create S5F1 alarm report
        alarm_msg = SecsMessageData(
            stream=5,
            function=1,
            wbit=True,
            body={"ALCD": alcd, "ALID": alid, "ALTX": altx},
        )

        # Queue for sending to connected hosts
        hsms_msg = HsmsMessage(
            session_id=self._session_id or uuid.uuid4(),
            timestamp=datetime.now(timezone.utc),
            direction="E2H",
            message_type=HsmsMessageType.DATA_MESSAGE,
            data=alarm_msg,
            sequence_num=self._next_sequence(),
        )

        await self._outbound_queue.put(hsms_msg)

    async def trigger_event(self, ceid: int, dvs: dict[int, Any] | None = None) -> None:
        """Trigger a collection event and send S6F11.

        Args:
            ceid: Collection event ID
            dvs: Data values to report
        """
        if not self._state.is_ceid_enabled(ceid):
            return

        event_msg = SecsMessageData(
            stream=6,
            function=11,
            wbit=True,
            body={"DATAID": 0, "CEID": ceid, "RPT": dvs or {}},
        )

        hsms_msg = HsmsMessage(
            session_id=self._session_id or uuid.uuid4(),
            timestamp=datetime.now(timezone.utc),
            direction="E2H",
            message_type=HsmsMessageType.DATA_MESSAGE,
            data=event_msg,
            sequence_num=self._next_sequence(),
        )

        await self._outbound_queue.put(hsms_msg)

    def _next_sequence(self) -> int:
        """Get next sequence number."""
        self._sequence_num += 1
        return self._sequence_num

    async def _handle_client(
        self,
        reader: asyncio.StreamReader,
        writer: asyncio.StreamWriter,
    ) -> None:
        """Handle a connected HSMS client."""
        addr = writer.get_extra_info("peername")
        client_id = f"{addr[0]}:{addr[1]}"
        self._clients[client_id] = writer

        logger.info(f"Client connected: {client_id}")

        try:
            # Start T7 timer (not selected timeout)
            self._timers.start_timer(TimerType.T7, self._on_t7_timeout)

            # Start outbound message sender
            sender_task = asyncio.create_task(self._send_outbound(writer))

            while True:
                # Read HSMS header (10 bytes minimum)
                header = await reader.read(10)
                if not header:
                    break

                # Parse and handle message
                await self._handle_message(header, reader, writer)

            sender_task.cancel()

        except asyncio.CancelledError:
            pass
        except Exception as e:
            logger.error(f"Error handling client {client_id}: {e}")
        finally:
            self._clients.pop(client_id, None)
            writer.close()
            await writer.wait_closed()
            logger.info(f"Client disconnected: {client_id}")

    async def _handle_message(
        self,
        header: bytes,
        reader: asyncio.StreamReader,
        writer: asyncio.StreamWriter,
    ) -> None:
        """Parse and handle an incoming HSMS message."""
        # Simplified - real implementation needs full HSMS parsing
        # For now, dispatch to handlers based on stream/function

        # This is a placeholder - full implementation would:
        # 1. Parse HSMS header to get message length, type
        # 2. Read message body
        # 3. For DATA_MESSAGE, dispatch to SECS handlers
        # 4. For control messages (SELECT, LINKTEST), handle directly

        pass

    async def _send_outbound(self, writer: asyncio.StreamWriter) -> None:
        """Send queued outbound messages to client."""
        while True:
            msg = await self._outbound_queue.get()
            # Encode and send
            # writer.write(encoded_msg)
            # await writer.drain()
            for callback in self._on_message_callbacks:
                await callback(msg)

    async def _on_t7_timeout(self) -> None:
        """Handle T7 (not selected) timeout."""
        logger.warning("T7 timeout - closing unselected connection")
        # Close connections that haven't been selected
```

**Step 4: Run test to verify it passes**

Run: `cd scavenger && pytest tests/simulator/equipment/test_server.py -v`
Expected: PASS (4 tests)

**Step 5: Commit**

```bash
git add scavenger/src/scavenger/simulator/equipment/server.py \
        scavenger/tests/simulator/equipment/test_server.py
git commit -m "feat(simulator): add HSMS passive server skeleton"
```

---

## Remaining Phases Summary

Due to length constraints, the remaining phases follow the same pattern:

### Phase 3: EAP Client (Tasks 3.1-3.4)
- Create `simulator/eap/client.py` - HSMS active client
- Create `simulator/eap/connection_pool.py` - Multi-equipment pool
- Create `simulator/eap/transactions.py` - Request/reply tracking
- Integration test: EAP connects to Equipment

### Phase 4: Message Recorder (Tasks 4.1-4.3)
- Create `simulator/recorder/service.py` - Main recording service
- Create `simulator/recorder/batch_writer.py` - Buffered DB inserts
- Create Redis pub/sub listener for message streaming

### Phase 5: Scenario Engine (Tasks 5.1-5.5)
- Create `simulator/scenario/loader.py` - YAML/DB/DSL loader
- Create `simulator/scenario/engine.py` - Step executor
- Create `simulator/scenario/dsl.py` - Python DSL classes
- Create `scenarios/base.py` - DSL base classes

### Phase 6: Replay Service (Tasks 6.1-6.3)
- Create `simulator/replay/player.py` - Playback engine
- Create `simulator/replay/service.py` - Replay API
- Implement snapshot seeking and forking

### Phase 7: Docker & Integration (Tasks 7.1-7.3)
- Update `docker-compose.yml` with all services
- Create multi-stage `Dockerfile`
- Add health checks and integration tests

### Phase 8: CLI & Polish (Tasks 8.1-8.3)
- Create `cli/simulator.py` - CLI commands
- Add API endpoints in `api/routers/simulator.py`
- Documentation and examples

---

**Each phase follows the same TDD structure:**
1. Write failing test
2. Run test to verify failure
3. Write minimal implementation
4. Run test to verify pass
5. Commit

---
