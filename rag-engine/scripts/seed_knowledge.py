#!/usr/bin/env python3
# rag-engine/scripts/seed_knowledge.py
"""Seed LightRAG knowledge base with lithography domain knowledge."""
import argparse
import asyncio
import os
import sys
from pathlib import Path

# Add app to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.config import settings


async def main(force: bool = False):
    """Seed knowledge base."""
    # Set PostgreSQL environment for LightRAG
    os.environ["POSTGRES_HOST"] = settings.postgres_host
    os.environ["POSTGRES_PORT"] = str(settings.postgres_port)
    os.environ["POSTGRES_USER"] = settings.postgres_user
    os.environ["POSTGRES_PASSWORD"] = settings.postgres_password
    os.environ["POSTGRES_DATABASE"] = settings.postgres_database

    from app.services.lightrag_service import LightRAGService

    print(f"Connecting to PostgreSQL at {settings.postgres_host}...")

    service = LightRAGService()
    await service.initialize()

    try:
        # Load seed data
        data_path = Path(__file__).parent.parent / "data" / "lithography_concepts.txt"

        if not data_path.exists():
            print(f"Error: Seed data not found at {data_path}")
            return

        with open(data_path, "r") as f:
            content = f.read()

        print(f"Inserting {len(content)} characters of knowledge...")
        print("This may take a few minutes as LightRAG extracts entities and relationships...")

        await service.insert(content)

        print("Knowledge seeding complete!")
        print("\nLightRAG has automatically extracted:")
        print("- Entities: equipment, phenomena, parameters, metrics")
        print("- Relationships: causes, affects, measured_on")
        print("\nTest with: python -m scripts.test_query")

    finally:
        await service.finalize()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed LightRAG knowledge base")
    parser.add_argument("--force", action="store_true", help="Force re-seeding")
    args = parser.parse_args()

    asyncio.run(main(force=args.force))
