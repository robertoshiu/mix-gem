"""Search API schemas."""
from pydantic import BaseModel, ConfigDict, Field


class RRFWeights(BaseModel):
    """RRF weight configuration."""

    keyword: float = Field(default=0.4, ge=0, le=1)
    semantic: float = Field(default=0.6, ge=0, le=1)


class AlarmSearchRequest(BaseModel):
    """Alarm search request."""

    query: str = Field(..., min_length=1, description="Search query text")
    vendor: str | None = Field(default=None, description="Filter by vendor")
    process_type: str | None = Field(default=None, description="Filter by process type")
    limit: int = Field(default=20, ge=1, le=100, description="Max results")
    rrf_weights: RRFWeights = Field(default_factory=RRFWeights)


class AlarmResult(BaseModel):
    """Single alarm result."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    alid: int
    alcd: int
    altx: str
    module_name: str | None
    severity: str | None
    probable_causes: list[str] | None
    rrf_score: float
    keyword_rank: int | None
    semantic_rank: int | None


class AlarmSearchResponse(BaseModel):
    """Alarm search response."""

    results: list[AlarmResult]
    total: int
    query: str
