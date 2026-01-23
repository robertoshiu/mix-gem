"""OpenAI embedding service."""
from openai import AsyncOpenAI


class EmbeddingService:
    """Async OpenAI embedding service."""

    DIMENSIONS = {
        "text-embedding-3-small": 1536,
        "text-embedding-3-large": 3072,
        "text-embedding-ada-002": 1536,
    }

    def __init__(self, api_key: str, model: str = "text-embedding-3-small"):
        self.model = model
        self.dimensions = self.DIMENSIONS.get(model, 1536)
        self._client = AsyncOpenAI(api_key=api_key)

    async def embed_text(self, text: str) -> list[float]:
        """Generate embedding for a single text."""
        response = await self._client.embeddings.create(
            model=self.model,
            input=text,
        )
        return response.data[0].embedding

    async def embed_batch(
        self,
        texts: list[str],
        batch_size: int = 100,
    ) -> list[list[float]]:
        """Generate embeddings for multiple texts."""
        all_embeddings: list[list[float]] = []

        for i in range(0, len(texts), batch_size):
            batch = texts[i : i + batch_size]
            response = await self._client.embeddings.create(
                model=self.model,
                input=batch,
            )
            all_embeddings.extend([d.embedding for d in response.data])

        return all_embeddings
