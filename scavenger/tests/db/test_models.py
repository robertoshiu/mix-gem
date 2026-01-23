# tests/db/test_models.py
import pytest
from scavenger.db.models.provenance import Provenance, SourceType


def test_provenance_model_attributes():
    """Provenance model has required fields."""
    p = Provenance(
        source_type=SourceType.SYNTHETIC,
        generation_params={"model": "gpt-4", "seed": 42},
    )

    assert p.source_type == SourceType.SYNTHETIC
    assert p.generation_params["seed"] == 42


def test_source_type_enum():
    """SourceType enum has expected values."""
    assert SourceType.SYNTHETIC.value == "synthetic"
    assert SourceType.PUBLIC_DOC.value == "public_doc"
    assert SourceType.SEMI_STANDARD.value == "semi_standard"
