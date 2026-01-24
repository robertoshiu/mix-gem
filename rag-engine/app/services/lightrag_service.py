# rag-engine/app/services/lightrag_service.py
"""LightRAG service for knowledge graph retrieval."""
import asyncio
from typing import Any

import anthropic
import structlog
from lightrag import LightRAG, QueryParam
from lightrag.kg.shared_storage import initialize_pipeline_status

from app.config import settings
from app.services.embedding import create_ollama_embedding_func

logger = structlog.get_logger()


async def create_claude_complete_func(
    api_key: str = settings.anthropic_api_key,
    model: str = settings.llm_model,
):
    """Create LightRAG-compatible LLM function using Claude."""
    client = anthropic.AsyncAnthropic(api_key=api_key)

    async def claude_complete(
        prompt: str,
        system_prompt: str | None = None,
        history_messages: list[dict] | None = None,
        **kwargs: Any,
    ) -> str:
        """Generate completion using Claude."""
        messages = []

        if history_messages:
            messages.extend(history_messages)

        messages.append({"role": "user", "content": prompt})

        response = await client.messages.create(
            model=model,
            max_tokens=4096,
            system=system_prompt or "You are a helpful assistant.",
            messages=messages,
        )

        return response.content[0].text

    return claude_complete


class LightRAGService:
    """Manages LightRAG instance for knowledge retrieval."""

    def __init__(self):
        self._rag: LightRAG | None = None
        self._initialized = False

    async def initialize(self) -> None:
        """Initialize LightRAG with PostgreSQL storage."""
        if self._initialized:
            return

        logger.info("initializing_lightrag")

        # Create LLM and embedding functions
        llm_func = await create_claude_complete_func()
        embed_func = create_ollama_embedding_func()

        self._rag = LightRAG(
            working_dir=settings.lightrag_working_dir,
            # PostgreSQL storage backends
            kv_storage="PGKVStorage",
            vector_storage="PGVectorStorage",
            graph_storage="PGGraphStorage",
            doc_status_storage="PGDocStatusStorage",
            # LLM and embeddings
            llm_model_func=llm_func,
            embedding_func=embed_func,
            # Chunking settings
            chunk_token_size=1200,
            chunk_overlap_token_size=100,
            # Performance
            llm_model_max_async=8,
            embedding_batch_num=32,
            # Workspace isolation
            workspace=settings.lightrag_workspace,
        )

        await self._rag.initialize_storages()
        await initialize_pipeline_status()

        self._initialized = True
        logger.info("lightrag_initialized")

    @property
    def rag(self) -> LightRAG:
        """Get LightRAG instance (must be initialized first)."""
        if not self._initialized or not self._rag:
            raise RuntimeError("LightRAG not initialized. Call initialize() first.")
        return self._rag

    async def insert(self, content: str | list[str]) -> None:
        """Insert documents into knowledge base."""
        await self.rag.ainsert(content)

    async def query(
        self,
        query: str,
        mode: str = "hybrid",
        top_k: int = 60,
        only_context: bool = False,
    ) -> str:
        """Query knowledge base.

        Args:
            query: Natural language query
            mode: Query mode (naive, local, global, hybrid, mix)
            top_k: Number of results to retrieve
            only_context: If True, return raw context without LLM synthesis

        Returns:
            Query result or context string
        """
        result = await self.rag.aquery(
            query,
            param=QueryParam(
                mode=mode,
                top_k=top_k,
                only_need_context=only_context,
            ),
        )
        return result

    async def finalize(self) -> None:
        """Cleanup LightRAG resources."""
        if self._rag:
            await self._rag.finalize_storages()
            self._initialized = False


# Singleton instance
_lightrag_service: LightRAGService | None = None


async def get_lightrag_service() -> LightRAGService:
    """Get or create LightRAG service singleton."""
    global _lightrag_service
    if _lightrag_service is None:
        _lightrag_service = LightRAGService()
        await _lightrag_service.initialize()
    return _lightrag_service
