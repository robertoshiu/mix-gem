# rag-engine/app/config.py
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings from environment variables."""

    # Database
    postgres_url: str = "postgresql+asyncpg://mixgem:mixgem@localhost:5432/mixgem"

    # Redis
    redis_url: str = "redis://localhost:6379"

    # Ollama (embeddings)
    ollama_host: str = "http://localhost:11434"
    embedding_model: str = "snowflake-arctic-embed2"
    embedding_dims: int = 1024

    # Anthropic (reasoning)
    anthropic_api_key: str = ""
    llm_model: str = "claude-sonnet-4-20250514"

    # Server
    host: str = "0.0.0.0"
    port: int = 8001
    log_level: str = "INFO"

    # Context budgets (percentages)
    tier1_budget: float = 0.12  # System instructions
    tier2_budget: float = 0.23  # Equipment state
    tier3_budget: float = 0.40  # Retrieved knowledge
    tier4_budget: float = 0.25  # Conversation history

    model_config = {"env_prefix": "", "case_sensitive": False}


settings = Settings()
