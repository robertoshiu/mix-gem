# Repository Guidelines

## Project Structure & Module Organization
- `.claude/skill/` contains reusable skills; each skill lives in its own folder (for example, `secs-gem-open-source-docs/`).
- `.claude/agent/` contains specialized agent profiles (`runtime-implementer.md`, `db-migrator.md`, `rag-engine-implementer.md`).
- `scavenger/` is the Python reference project (FastAPI + async SQLAlchemy) with source in `scavenger/src/scavenger/` and tests in `scavenger/tests/`.
- `docs/plans/` holds design and implementation plans; keep these aligned with changes.
- `CLAUDE.md` describes the repository’s intent and available skills/agents.

## Build, Test, and Development Commands
- `cd scavenger && pip install -e ".[dev]"` installs the local package plus dev tools (pytest, ruff, mypy).
- `cd scavenger && pytest -v` runs the full test suite.
- `cd scavenger && docker compose up -d` starts the local stack (PostgreSQL + app).
- `cd scavenger && docker compose config` validates Compose syntax.
- `cd scavenger && uvicorn scavenger.api.main:app --reload` runs the API locally (if present).

## Coding Style & Naming Conventions
- Python 3.12 with `ruff` and `mypy` (strict) configured in `scavenger/pyproject.toml`.
- Indentation: 4 spaces; max line length: 100.
- Use `snake_case` for modules/functions, `PascalCase` for classes, and `UPPER_SNAKE_CASE` for constants.

## Testing Guidelines
- Frameworks: `pytest`, `pytest-asyncio`.
- Test paths live under `scavenger/tests/` and use `test_*.py` naming.
- Prefer focused unit tests; integration tests may use `testcontainers` when added.

## Commit & Pull Request Guidelines
- No git history is available in this workspace; use Conventional Commits when possible (for example, `feat: add search router`).
- PRs should include: a concise summary, test evidence (commands + results), and any doc updates (for example, `docs/plans/...`).

## Agent-Specific Instructions
- Prefer skills in `.claude/skill/` before implementing domain-specific changes.
- Use agent profiles in `.claude/agent/` when delegating complex work (runtime, DB, RAG).
