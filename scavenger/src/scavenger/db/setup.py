"""Database setup helpers for extensions and triggers."""
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection


async def ensure_extensions(conn: AsyncConnection) -> None:
    """Ensure required PostgreSQL extensions are available."""
    await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
    await conn.execute(text("CREATE EXTENSION IF NOT EXISTS pg_trgm"))
    await conn.execute(text('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"'))


async def ensure_alarm_fts_triggers(conn: AsyncConnection) -> None:
    """Ensure full-text search triggers for alarms."""
    await conn.execute(
        text(
            """
            CREATE OR REPLACE FUNCTION alarms_altx_tsv_update()
            RETURNS trigger AS $$
            BEGIN
                NEW.altx_tsv := to_tsvector('english', COALESCE(NEW.altx, ''));
                RETURN NEW;
            END
            $$ LANGUAGE plpgsql;
            """
        )
    )
    await conn.execute(text("DROP TRIGGER IF EXISTS trg_alarms_altx_tsv ON alarms"))
    await conn.execute(
        text(
            """
            CREATE TRIGGER trg_alarms_altx_tsv
            BEFORE INSERT OR UPDATE OF altx ON alarms
            FOR EACH ROW EXECUTE FUNCTION alarms_altx_tsv_update();
            """
        )
    )
