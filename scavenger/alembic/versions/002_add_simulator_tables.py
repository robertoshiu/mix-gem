"""Add simulator tables.

Revision ID: 002
Revises: 001
Create Date: 2026-01-23
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "002"
down_revision: str | None = "001"
branch_labels = None
depends_on = None


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
        sa.Column("after_message_id", sa.BigInteger(), sa.ForeignKey("secs_messages.id")),
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
