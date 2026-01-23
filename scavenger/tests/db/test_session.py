import pytest
from scavenger.db.session import get_session, init_db


def test_get_session_returns_context_manager():
    """get_session provides async context manager."""
    session_ctx = get_session()
    assert hasattr(session_ctx, "__aenter__")
    assert hasattr(session_ctx, "__aexit__")
