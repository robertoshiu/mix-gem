# rag-engine/tests/test_context_assembler.py
"""Tests for context assembler and query classifier."""
import pytest
from unittest.mock import AsyncMock, MagicMock


class TestQueryClassifier:
    """Tests for QueryClassifier."""

    def test_troubleshooting_query(self):
        """Test troubleshooting query classification."""
        from app.core.query_classifier import QueryClassifier

        classifier = QueryClassifier()

        # Test various troubleshooting patterns
        troubleshooting_queries = [
            "Why is CD trending high on LITHO01?",
            "What caused the alarm on LITHO02?",
            "Debug the focus drift issue",
            "There's an error with the scanner",
        ]

        for query in troubleshooting_queries:
            profile = classifier.classify(query)
            assert profile.query_type == "troubleshooting", f"Failed for: {query}"
            assert profile.lightrag_mode == "local"

    def test_conceptual_query(self):
        """Test conceptual query classification."""
        from app.core.query_classifier import QueryClassifier

        classifier = QueryClassifier()

        conceptual_queries = [
            "Explain focus sensitivity in lithography",
            "What is CDU?",
            "How does dose affect CD?",
            "Describe the relationship between focus and overlay",
        ]

        for query in conceptual_queries:
            profile = classifier.classify(query)
            assert profile.query_type == "conceptual", f"Failed for: {query}"
            assert profile.lightrag_mode == "global"

    def test_process_query(self):
        """Test process-related query classification."""
        from app.core.query_classifier import QueryClassifier

        classifier = QueryClassifier()

        process_queries = [
            "Calculate the process window for contact layer",
            "Estimate focus margin for 40nm contacts",
            "Check the dose range for this recipe",  # Avoid "what is" which triggers conceptual
        ]

        for query in process_queries:
            profile = classifier.classify(query)
            assert profile.query_type == "process", f"Failed for: {query}"
            assert profile.lightrag_mode == "hybrid"

    def test_conversational_query(self):
        """Test conversational (default) query classification."""
        from app.core.query_classifier import QueryClassifier

        classifier = QueryClassifier()

        conversational_queries = [
            "Hello",
            "Thanks for the help",
            "Can you summarize that?",
        ]

        for query in conversational_queries:
            profile = classifier.classify(query)
            assert profile.query_type == "conversational", f"Failed for: {query}"
            assert profile.lightrag_mode == "hybrid"

    def test_domain_extraction(self):
        """Test lithography domain extraction."""
        from app.core.query_classifier import QueryClassifier

        classifier = QueryClassifier()

        # Focus domain
        profile = classifier.classify("Check the focus offset on LITHO01")
        assert "focus" in profile.extracted_domains

        # Dose domain
        profile = classifier.classify("The exposure energy is too high")
        assert "dose" in profile.extracted_domains

        # Multiple domains
        profile = classifier.classify("Focus and overlay are both drifting")
        assert "focus" in profile.extracted_domains
        assert "overlay" in profile.extracted_domains

    def test_tool_id_extraction(self):
        """Test equipment ID extraction."""
        from app.core.query_classifier import QueryClassifier

        classifier = QueryClassifier()

        # Extract LITHO01
        profile = classifier.classify("Why is CD trending on LITHO01?")
        assert profile.extracted_tool_id == "LITHO01"

        # Extract LITHO02
        profile = classifier.classify("Check litho02 status")
        assert profile.extracted_tool_id == "LITHO02"

        # Extract TRACK01
        profile = classifier.classify("TRACK01 has an alarm")
        assert profile.extracted_tool_id == "TRACK01"

        # No tool ID
        profile = classifier.classify("What is focus sensitivity?")
        assert profile.extracted_tool_id is None

    def test_tier_budget_allocation(self):
        """Test context tier budget allocations."""
        from app.core.query_classifier import QueryClassifier

        classifier = QueryClassifier()

        # Troubleshooting: more equipment context (need actual troubleshooting pattern)
        profile = classifier.classify("Why is the scanner drift failing?")  # "fail" triggers troubleshooting
        assert profile.query_type == "troubleshooting"
        assert profile.tier2_weight == 0.30  # Equipment tier
        assert profile.tier3_weight == 0.40  # Knowledge tier

        # Conceptual: more knowledge
        profile = classifier.classify("Explain focus sensitivity")
        assert profile.query_type == "conceptual"
        assert profile.tier3_weight == 0.50  # Knowledge tier gets most

        # Conversational: more history
        profile = classifier.classify("Tell me more")
        assert profile.query_type == "conversational"
        assert profile.tier4_weight == 0.35  # History tier


class TestContextAssembler:
    """Tests for ContextAssembler."""

    @pytest.mark.asyncio
    async def test_assemble_basic(self):
        """Test basic context assembly."""
        from app.core.context_assembler import ContextAssembler
        from app.core.query_classifier import QueryProfile

        mock_lightrag = MagicMock()
        mock_lightrag.query = AsyncMock(return_value="Focus sensitivity is approximately 4nm CD per 10nm focus offset.")
        mock_redis = MagicMock()

        assembler = ContextAssembler(mock_lightrag, mock_redis)

        profile = QueryProfile(
            query_type="conceptual",
            tier1_weight=0.10,
            tier2_weight=0.15,
            tier3_weight=0.50,
            tier4_weight=0.25,
            extracted_domains=["focus"],
            extracted_tool_id=None,
            lightrag_mode="global",
        )

        context = await assembler.assemble("What is focus sensitivity?", profile)

        assert "lithography process engineering assistant" in context.system_prompt
        assert context.equipment_context is None  # No tool_id specified
        assert context.retrieved_knowledge is not None
        assert context.profile == profile

    @pytest.mark.asyncio
    async def test_assemble_with_equipment(self):
        """Test context assembly with equipment context."""
        from app.core.context_assembler import ContextAssembler
        from app.core.query_classifier import QueryProfile

        mock_lightrag = MagicMock()
        mock_lightrag.query = AsyncMock(return_value="Equipment knowledge")
        mock_redis = MagicMock()
        mock_redis.hgetall = AsyncMock(return_value={
            b"focus_offset": b"5",
            b"dose": b"22.5",
            b"status": b"running",
        })

        assembler = ContextAssembler(mock_lightrag, mock_redis)

        profile = QueryProfile(
            query_type="troubleshooting",
            tier1_weight=0.10,
            tier2_weight=0.30,
            tier3_weight=0.40,
            tier4_weight=0.20,
            extracted_domains=["focus"],
            extracted_tool_id="LITHO01",
            lightrag_mode="local",
        )

        context = await assembler.assemble("Why is focus drifting on LITHO01?", profile)

        # System prompt should include tool_id
        assert "LITHO01" in context.system_prompt

        # Equipment context should be populated
        assert context.equipment_context is not None
        assert context.equipment_context["tool_id"] == "LITHO01"
        assert context.equipment_context["focus_offset"] == "5"

        # Redis should have been called
        mock_redis.hgetall.assert_called_once_with("equipment:state:LITHO01")

    @pytest.mark.asyncio
    async def test_assemble_with_history(self):
        """Test context assembly with conversation history."""
        import json
        from app.core.context_assembler import ContextAssembler
        from app.core.query_classifier import QueryProfile

        mock_lightrag = MagicMock()
        mock_lightrag.query = AsyncMock(return_value="Knowledge result")
        mock_redis = MagicMock()

        # Mock history retrieval
        history_messages = [
            json.dumps({"role": "user", "content": "Previous question"}),
            json.dumps({"role": "assistant", "content": "Previous answer"}),
        ]
        mock_redis.lrange = AsyncMock(return_value=history_messages)

        assembler = ContextAssembler(mock_lightrag, mock_redis)

        profile = QueryProfile(
            query_type="conversational",
            tier1_weight=0.12,
            tier2_weight=0.20,
            tier3_weight=0.33,
            tier4_weight=0.35,
            extracted_domains=[],
            extracted_tool_id=None,
            lightrag_mode="hybrid",
        )

        context = await assembler.assemble("Tell me more", profile, session_id="session123")

        # History should be populated
        assert context.conversation_history is not None
        assert len(context.conversation_history) == 2
        assert context.conversation_history[0]["role"] == "user"

        # Redis lrange should have been called
        mock_redis.lrange.assert_called_once_with("session:session123:history", -10, -1)

    @pytest.mark.asyncio
    async def test_assemble_handles_redis_error(self):
        """Test graceful handling of Redis errors."""
        from app.core.context_assembler import ContextAssembler
        from app.core.query_classifier import QueryProfile

        mock_lightrag = MagicMock()
        mock_lightrag.query = AsyncMock(return_value="Knowledge")
        mock_redis = MagicMock()
        mock_redis.hgetall = AsyncMock(side_effect=Exception("Redis connection error"))

        assembler = ContextAssembler(mock_lightrag, mock_redis)

        profile = QueryProfile(
            query_type="troubleshooting",
            tier1_weight=0.10,
            tier2_weight=0.30,
            tier3_weight=0.40,
            tier4_weight=0.20,
            extracted_domains=["focus"],
            extracted_tool_id="LITHO01",
            lightrag_mode="local",
        )

        # Should not raise, should return None for equipment_context
        context = await assembler.assemble("Check LITHO01", profile)
        assert context.equipment_context is None

    @pytest.mark.asyncio
    async def test_assemble_handles_lightrag_error(self):
        """Test graceful handling of LightRAG errors."""
        from app.core.context_assembler import ContextAssembler
        from app.core.query_classifier import QueryProfile

        mock_lightrag = MagicMock()
        mock_lightrag.query = AsyncMock(side_effect=Exception("LightRAG error"))
        mock_redis = MagicMock()

        assembler = ContextAssembler(mock_lightrag, mock_redis)

        profile = QueryProfile(
            query_type="conceptual",
            tier1_weight=0.10,
            tier2_weight=0.15,
            tier3_weight=0.50,
            tier4_weight=0.25,
            extracted_domains=["focus"],
            extracted_tool_id=None,
            lightrag_mode="global",
        )

        # Should not raise, should return None for retrieved_knowledge
        context = await assembler.assemble("What is focus?", profile)
        assert context.retrieved_knowledge is None
