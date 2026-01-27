---
description: "Design Postgres schema + migrations + indexes for event storage."
mode: subagent
model: google/antigravity-claude-sonnet-4-5
temperature: 0.1
tools:
  write: true
  edit: true
  bash: true
permission:
  skill:
    "postgresql-master": "allow"
    "pgvector-setup": "allow"
    "secs-*": "allow"
    "lithography-expert": "allow"
    "ollama-rag": "allow"
    "docker-compose-generator": "allow"
    "*": "deny"
---
