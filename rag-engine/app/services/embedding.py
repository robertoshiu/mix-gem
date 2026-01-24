# rag-engine/app/services/embedding.py
"""Embedding functions for LightRAG using Ollama."""
import numpy as np
import ollama
from lightrag.utils import wrap_embedding_func_with_attrs

from app.config import settings


def create_ollama_embedding_func(
    model: str = settings.embedding_model,
    host: str = settings.ollama_host,
    dims: int = settings.embedding_dims,
):
    """Create LightRAG-compatible embedding function using Ollama."""

    @wrap_embedding_func_with_attrs(embedding_dim=dims, max_token_size=8192)
    async def ollama_embed(texts: list[str]) -> np.ndarray:
        """Generate embeddings using Ollama."""
        client = ollama.Client(host=host)
        response = client.embed(model=model, input=texts)
        return np.array(response["embeddings"])

    return ollama_embed


async def embed_single(text: str) -> list[float]:
    """Embed a single text using Ollama (for standalone use)."""
    client = ollama.Client(host=settings.ollama_host)
    response = client.embed(model=settings.embedding_model, input=text)
    return response["embeddings"][0]
