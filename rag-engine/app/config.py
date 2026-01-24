# rag-engine/app/config.py
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings from environment variables."""

    # PostgreSQL (used by LangGraph checkpointer + LightRAG)
    postgres_host: str = "localhost"
    postgres_port: int = 5432
    postgres_user: str = "mixgem"
    postgres_password: str = "mixgem"
    postgres_database: str = "mixgem"

    @property
    def postgres_url(self) -> str:
        return f"postgresql://{self.postgres_user}:{self.postgres_password}@{self.postgres_host}:{self.postgres_port}/{self.postgres_database}"

    @property
    def asyncpg_url(self) -> str:
        return f"postgresql+asyncpg://{self.postgres_user}:{self.postgres_password}@{self.postgres_host}:{self.postgres_port}/{self.postgres_database}"

    # Redis
    redis_url: str = "redis://localhost:6379"

    # Ollama (embeddings)
    ollama_host: str = "http://localhost:11434"
    embedding_model: str = "snowflake-arctic-embed2"
    embedding_dims: int = 1024

    # Anthropic (reasoning via LangGraph)
    anthropic_api_key: str = ""
    llm_model: str = "claude-sonnet-4-20250514"

    # LightRAG
    lightrag_working_dir: str = "./lightrag_storage"
    lightrag_workspace: str = "lithography"

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
