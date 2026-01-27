---
name: lithography-expert
description: |
  Lithography domain expert for semiconductor manufacturing. Generates synthetic knowledge (modules, Q&A, SECS/GEM anomaly logs), estimates process windows with guard-bands, models physics (CD/CDU/LER/overlay), validates plausibility, and integrates with knowledge graphs (GraphRAG/LightRAG).
  Use when user needs: lithography knowledge generation, anomaly synthesis for RCA drills, recipe window estimation, overlay/CDU budget modeling, synthetic data validation, domain prompts, or KG integration. Triggers: "lithography knowledge", "anomaly logs", "process window", "overlay fingerprint", "CDU budget", "GraphRAG semiconductor".
---

# Lithography Expert Skill

Generate synthetic semiconductor knowledge, validate plausibility, and integrate with knowledge graphs—without relying on proprietary fab data.

## Quick Mental Model

Lithography quality outcomes (CD, CDU, LER, overlay, defectivity) couple to imaging (focus/dose), resist stack, track bakes, develop kinetics, tool-to-tool matching, and stochasticity (especially EUV). All outputs must be internally consistent and labeled "synthetic/illustrative" unless user provides real bounds.

## Operating Modes

Select one or combine based on user request:

| Mode | Output | Reference |
|------|--------|-----------|
| Knowledge modules | Structured explanations, conceptual articles | [KNOWLEDGE.md](references/KNOWLEDGE.md) |
| Q&A generation | Multi-level Q&A sets (conceptual → troubleshooting → complex reasoning) | [QA-FORMATS.md](references/QA-FORMATS.md) |
| Anomaly synthesis | SECS/GEM-shaped alarm/event records with context params | [ANOMALY-SYNTHESIS.md](references/ANOMALY-SYNTHESIS.md) |
| Window estimation | Process window + guard-band calculations | [PROCESS-WINDOW.md](references/PROCESS-WINDOW.md) |
| Physics modeling | First-order imaging sensitivities, overlay/CDU/LER models | [PHYSICS-MODELS.md](references/PHYSICS-MODELS.md) |
| KG integration | Ontology, entities, relations, retrieval strategy | [KG-INTEGRATION.md](references/KG-INTEGRATION.md) |

## Workflow

### Step 1: Collect Inputs

Gather from user (or assume conservatively and label):

| Input | Examples | Default Assumption |
|-------|----------|-------------------|
| Node/wavelength | EUV, DUV ArF | State "unspecified" |
| Layer type | Contact, metal, via | Generic litho |
| Targets | CD ± tolerance, overlay budget | Industry-typical ranges |
| Process context | Resist tone, track flow | Standard positive-tone |
| Output need | Knowledge, data, KG schema | Ask user |
| Realism policy | Illustrative vs bounded | Illustrative only |

### Step 2: Establish Synthetic Contract

Begin response with a brief paragraph stating:
- What is synthetic vs user-supplied
- Assumed bounds and units (nm, mJ/cm², °C, s)
- What will be validated

### Step 3: Generate Content

Load the appropriate reference file for the selected mode and follow its format specifications.

### Step 4: Validate

**Hard gates (must pass):**
- Schema completeness (all required fields present)
- Unit consistency (no mixed units)
- Leakage check (no proprietary identifiers)

**Soft scoring (should be strong):**
- Distribution plausibility
- Causal consistency (symptom → cause → evidence → action)
- Coverage balance across failure modes

### Step 5: Deliver with Traceability

Structure response to include: assumptions → generation plan → synthetic output → validation summary → KG integration plan (if requested).

## Guardrails

- Prefer bounded ranges over false precision
- Distinguish: physics-driven expectation vs process integration reality vs metrology uncertainty
- Keep outputs audit-friendly with traceable logic
- All synthetic content must be explicitly labeled

## Quick Reference

See [QUICK-REFERENCE.md](references/QUICK-REFERENCE.md) for: validation checklist, unit conventions, common sensitivity values, and prompt templates.