# rag-engine/app/core/query_classifier.py
"""Query classification for context budget allocation."""
import re
from dataclasses import dataclass


@dataclass
class QueryProfile:
    """Context budget allocation based on query type."""

    query_type: str  # troubleshooting, conceptual, process, conversational
    tier1_weight: float  # System instructions
    tier2_weight: float  # Equipment state
    tier3_weight: float  # Retrieved knowledge
    tier4_weight: float  # Conversation history
    extracted_domains: list[str]  # Detected domains (focus, dose, etc.)
    extracted_tool_id: str | None  # Detected equipment ID
    lightrag_mode: str  # Recommended LightRAG query mode


# Keywords for classification
TROUBLESHOOTING_PATTERNS = [
    r"\bwhy\b.*\b(trending|increasing|decreasing|drift|fail|error|alarm)\b",
    r"\bwhat\s+(happened|caused|is wrong)\b",
    r"\b(debug|troubleshoot|diagnose|investigate)\b",
    r"\b(error|alarm|warning|fault)\b",
]

CONCEPTUAL_PATTERNS = [
    r"\b(explain|what is|how does|describe)\b",
    r"\b(definition|concept|theory|principle)\b",
    r"\b(sensitivity|relationship|effect)\b",
]

PROCESS_PATTERNS = [
    r"\b(process window|recipe|parameter)\b",
    r"\b(dose|focus|overlay|cdu)\s+(range|limit|spec)\b",
    r"\b(calculate|estimate|margin)\b",
]

DOMAIN_KEYWORDS = {
    "focus": ["focus", "dof", "depth of focus", "defocus"],
    "dose": ["dose", "exposure", "energy", "intensity"],
    "overlay": ["overlay", "alignment", "registration"],
    "cdu": ["cdu", "uniformity", "cd variation", "critical dimension"],
    "defect": ["defect", "particle", "bridging", "collapse"],
}

TOOL_PATTERN = r"\b(LITHO\d+|TRACK\d+|TOOL\d+)\b"


class QueryClassifier:
    """Classify queries to determine context budget allocation."""

    def classify(self, question: str) -> QueryProfile:
        """Analyze question and return context budget profile."""
        question_lower = question.lower()

        # Detect query type
        query_type = self._detect_type(question_lower)

        # Extract domains mentioned
        domains = self._extract_domains(question_lower)

        # Extract tool ID
        tool_match = re.search(TOOL_PATTERN, question, re.IGNORECASE)
        tool_id = tool_match.group(1).upper() if tool_match else None

        # Allocate budgets and determine LightRAG mode
        weights = self._allocate_budgets(query_type, has_tool=tool_id is not None)
        lightrag_mode = self._determine_lightrag_mode(query_type)

        return QueryProfile(
            query_type=query_type,
            tier1_weight=weights[0],
            tier2_weight=weights[1],
            tier3_weight=weights[2],
            tier4_weight=weights[3],
            extracted_domains=domains,
            extracted_tool_id=tool_id,
            lightrag_mode=lightrag_mode,
        )

    def _detect_type(self, question: str) -> str:
        """Detect query type from patterns."""
        for pattern in TROUBLESHOOTING_PATTERNS:
            if re.search(pattern, question, re.IGNORECASE):
                return "troubleshooting"

        for pattern in CONCEPTUAL_PATTERNS:
            if re.search(pattern, question, re.IGNORECASE):
                return "conceptual"

        for pattern in PROCESS_PATTERNS:
            if re.search(pattern, question, re.IGNORECASE):
                return "process"

        return "conversational"

    def _extract_domains(self, question: str) -> list[str]:
        """Extract lithography domains mentioned."""
        domains = []
        for domain, keywords in DOMAIN_KEYWORDS.items():
            if any(kw in question for kw in keywords):
                domains.append(domain)
        return domains

    def _allocate_budgets(
        self, query_type: str, has_tool: bool
    ) -> tuple[float, float, float, float]:
        """Return (tier1, tier2, tier3, tier4) weights."""
        if query_type == "troubleshooting":
            # More equipment context for debugging
            return (0.10, 0.30, 0.40, 0.20)
        elif query_type == "conceptual":
            # More knowledge retrieval for explanations
            return (0.10, 0.15, 0.50, 0.25)
        elif query_type == "process":
            # Balanced for process engineering
            return (0.10, 0.25, 0.45, 0.20)
        else:
            # Conversational - more history
            return (0.12, 0.20, 0.33, 0.35)

    def _determine_lightrag_mode(self, query_type: str) -> str:
        """Determine optimal LightRAG query mode."""
        if query_type == "troubleshooting":
            return "local"  # Entity-focused for specific issues
        elif query_type == "conceptual":
            return "global"  # Broad themes for explanations
        elif query_type == "process":
            return "hybrid"  # Combined for process questions
        else:
            return "hybrid"  # Default to hybrid
