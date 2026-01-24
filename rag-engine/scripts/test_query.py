#!/usr/bin/env python3
# rag-engine/scripts/test_query.py
"""Test LightRAG queries."""
import asyncio
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.config import settings


async def main():
    os.environ["POSTGRES_HOST"] = settings.postgres_host
    os.environ["POSTGRES_PORT"] = str(settings.postgres_port)
    os.environ["POSTGRES_USER"] = settings.postgres_user
    os.environ["POSTGRES_PASSWORD"] = settings.postgres_password
    os.environ["POSTGRES_DATABASE"] = settings.postgres_database

    from app.services.lightrag_service import LightRAGService

    service = LightRAGService()
    await service.initialize()

    try:
        queries = [
            ("Why is CD trending on LITHO01?", "hybrid"),
            ("What affects overlay?", "local"),
            ("What are the main lithography process parameters?", "global"),
        ]

        for query, mode in queries:
            print(f"\n{'='*60}")
            print(f"Query: {query}")
            print(f"Mode: {mode}")
            print("-" * 60)

            result = await service.query(query, mode=mode)
            print(result[:500] + "..." if len(result) > 500 else result)

    finally:
        await service.finalize()


if __name__ == "__main__":
    asyncio.run(main())
