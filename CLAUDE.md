# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

**mix-gem** is a Claude Skills and Agents ecosystem for semiconductor equipment engineering and AI/RAG development. It contains:

- **Skills** (`.claude/skill/`): Reusable knowledge modules with curated references, templates, and examples
- **Agents** (`.claude/agent/`): Specialized sub-agents that use skills to implement systems

This is not a traditional application to build/deploy. It's a knowledge base that Claude Code leverages when building systems in these domains.

## Skills

| Skill | Purpose |
|-------|---------|
| `secs-gem-open-source-docs` | SECS/GEM protocol engineering (SEMI-E5, E37, E37.1) with cross-language implementations (Python/Java/.NET/Go) |
| `mastering-postgresql` | PostgreSQL + pgvector + full-text search (BM25) for AI embeddings and search features |
| `pgvector-setup` | Vector database configuration for embeddings and semantic search |
| `docker-compose-generator` | Generate and validate production Docker Compose configurations |
| `ollama-rag` | RAG systems with Ollama local models and cloud models (DeepSeek-V3.2, Qwen3-Coder, MiniMax-M2) |
| `asyncio-concurrency-patterns` | Python async/await patterns and best practices |
| `fastapi-patterns` | FastAPI API design patterns and examples |
| `lithography-expert` | Semiconductor manufacturing knowledge (lithography processes) |

## Agents

| Agent | Purpose |
|-------|---------|
| `runtime-implementer` | Implements SECS/GEM runtime servers (equipment + host + scenario engine) |
| `db-migrator` | Designs PostgreSQL schemas, migrations, and indexes for event storage |
| `rag-engine-implementer` | Builds ACE Context Pack and Agentic RAG orchestration with evidence chains |

## Key Commands

### Docker Compose Validation
```bash
./scripts/validate_compose.sh --file <compose.yml> --strict --verbose
```

### Environment File Generation
```bash
python3 ./scripts/generate_env_file.py --compose <compose.yml> --output .env
```

### PostgreSQL Scripts (in mastering-postgresql skill)
```bash
pip install -r scripts/requirements.txt
python scripts/setup_extensions.py --host localhost --dbname mydb
python scripts/create_search_tables.py --host localhost --dbname mydb
python scripts/health_check.py --host localhost --dbname mydb
```

## Architecture Notes

### SECS/GEM Protocol
When implementing semiconductor equipment communication:
- Use **go-secs** (Go) for modern concurrent implementations
- Use **secsgem** (Python) for mature GEM standard message support
- HSMS connection modes: Active (Host initiates) vs Passive (Equipment listens)
- SML format for message definitions and testing

### PostgreSQL + AI
For vector search and RAG:
- Use `pgvector/pgvector:pg17` Docker image
- Enable extensions: `vector`, `pg_trgm`
- HNSW index for best recall, IVFFlat for fast builds
- Combine `tsvector` (full-text) + `pgvector` (semantic) for hybrid search

### RAG Systems
- Local: Ollama with `nemotron-3-nano` (1M context) or `llama3.2:3b` (fast)
- Cloud: `deepseek-v3.2:cloud` (GPT-5 level), `qwen3-coder:480b-cloud` (1M context)
- Embeddings: `snowflake-arctic-embed2` (best accuracy) or `nomic-embed-text` (speed)
- Vector stores: ChromaDB (simple), PostgreSQL+pgvector (production)
