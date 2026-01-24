# rag-engine/tests/test_tools/test_knowledge.py
import pytest

from app.tools.knowledge import search_knowledge, parse_lightrag_tool_call


def test_search_knowledge_returns_marker():
    """Test that search_knowledge returns a parseable marker."""
    result = search_knowledge.invoke({"query": "focus sensitivity", "mode": "hybrid"})
    assert result.startswith("__LIGHTRAG_QUERY__")
    assert "hybrid" in result
    assert "focus sensitivity" in result


def test_parse_lightrag_tool_call():
    """Test parsing LightRAG tool call markers."""
    result = parse_lightrag_tool_call("__LIGHTRAG_QUERY__|hybrid|test query")
    assert result == ("hybrid", "test query")

    result = parse_lightrag_tool_call("not a marker")
    assert result is None
