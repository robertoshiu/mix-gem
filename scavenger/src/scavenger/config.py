"""Application configuration using pydantic-settings."""
from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Database
    database_url: str = Field(
        default="postgresql+asyncpg://scavenger:scavenger_dev@localhost:5432/onokb",
        description="PostgreSQL connection URL",
    )

    # OpenAI
    openai_api_key: SecretStr = Field(
        default=SecretStr(""),
        description="OpenAI API key for embeddings",
    )

    # HSMS Runtime
    hsms_host: str = Field(default="0.0.0.0", description="HSMS server bind address")
    hsms_port: int = Field(default=5000, description="HSMS passive mode port")
    hsms_mode: str = Field(default="passive", description="HSMS connection mode")
    hsms_device_id: int = Field(default=1, description="HSMS device ID")
    hsms_t3_timeout: float = Field(default=45.0, description="Reply timeout seconds")
    hsms_t6_timeout: float = Field(default=5.0, description="Control timeout seconds")
    hsms_t7_timeout: float = Field(default=10.0, description="Connection timeout seconds")

    # API
    api_host: str = Field(default="0.0.0.0", description="API server host")
    api_port: int = Field(default=8000, description="API server port")

    # Embeddings
    embedding_model: str = Field(
        default="text-embedding-3-small",
        description="OpenAI embedding model",
    )
    embedding_dimensions: int = Field(
        default=1536,
        description="Embedding vector dimensions",
    )

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


def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
