---
name: lithography-expert
description: Lithography-expert skill to generate synthetic semiconductor knowledge (Q&A, anomalies, process windows, physics models), validate plausibility, engineer domain prompts, and integrate outputs with knowledge graphs (GraphRAG/LightRAG-style).
metadata:
  tags: [semiconductor, lithography, EUV, DUV, overlay, CDU, LER, process-window, anomaly, SECSGEM, knowledge-graph, GraphRAG, LightRAG, prompt-engineering, validation]
---

# Semiconductor Synthetic Knowledge + KG Integration (Lithography Expert)

## Overview
This skill provides an expert operating playbook for **LLM integration** in semiconductor manufacturing contexts—especially lithography—focused on:
- Synthetic domain knowledge generation (educational + operational)
- Synthetic anomaly generation with realistic *generic* parameters
- Recipe parameter window estimation (process window + guard-band reasoning)
- First-order / semi-empirical process physics modeling
- Synthetic data validation strategies
- Domain-specific prompt engineering
- Knowledge graph integration (KG-first RAG / GraphRAG-style workflows)

This skill is instruction-only: it defines what to generate, how to reason, and how to validate—without requiring any repo outputs.

---

## When to Use This Skill
Use this skill when the user needs one or more of the following, **without relying on proprietary fab data**:

1) **Lithography process domain knowledge generation**
   - Structured knowledge modules (e.g., focus–dose interactions, overlay decomposition, stochastic defects)
   - Multi-level Q&A sets (conceptual → routine troubleshooting → complex reasoning)

2) **Anomaly synthesis with realistic parameters**
   - SECS/GEM-shaped alarms/events (e.g., alarm report patterns) with plausible parameter context
   - Scenario corpora for training, retrieval enrichment, and RCA drills

3) **Recipe parameter window estimation**
   - “Given targets/tolerances → estimate feasible window” (focus, dose, bake, develop)
   - Guard-banding logic and DOE/FEM recommendations

4) **Semiconductor process physics modeling**
   - First-order imaging + process sensitivities (semi-empirical)
   - Overlay/CDU/LER risk factor models (qualitative or bounded quantitative)

5) **Synthetic data validation strategies**
   - Schema + unit checks
   - Physical plausibility checks, correlation checks, distribution sanity checks
   - Leakage checks (no proprietary/identifying details)

6) **Domain-specific prompt engineering**
   - Robust template prompts and constraints blocks
   - Evaluation rubric prompts (self-checkers) for plausibility and leakage

7) **Integration with knowledge graphs**
   - Define ontology, entities, relations
   - Serialize “facts/claims” as nodes/edges; use KG-guided retrieval for answering


## Key Concepts (Quick Mental Model)

### 1) Synthetic Knowledge vs Synthetic Data
- **Synthetic knowledge**: structured explanations, modules, Q&A, “playbooks”
- **Synthetic data**: numeric/time-series/log-style records (alarms, metrology snapshots, excursions)

Both must be **internally consistent** and explicitly labeled “synthetic/illustrative” unless user provides real bounds.

### 2) Lithography as a Coupled System
Lithography quality outcomes (CD, CDU, LER, overlay, defectivity) are coupled to:
- imaging (focus/dose), resist stack, track bakes, develop kinetics
- tool-to-tool matching and distortion “fingerprints”
- stochasticity (especially EUV) and pattern density effects

### 3) “Window” Reasoning
A recipe window is estimated by:
- sensitivities (∂CD/∂dose, ∂CD/∂focus, etc.)
- budgets (CD, overlay, defect risk)
- guard-bands for drift, metrology uncertainty, and tool matching

### 4) KG-First RAG
Use the KG to:
- normalize terminology (entities + aliases)
- connect multi-hop cause→effect→mitigation
- guide retrieval: “entities first, then text” (rather than pure vector-only)

---

## Inputs to Collect (If Missing, Assume Conservatively)
If the user provides these, use them. If not, set conservative assumptions and label them.

- Node / wavelength class (DUV ArF / EUV) and layer type (contact/metal/via/etc.)
- Targets: CD target & tolerance, overlay budget, CDU/LER targets, defectivity constraints
- Process context: resist tone, track flow assumptions (PAB/PEB/develop), stack hints
- Output need: knowledge modules, Q&A, anomalies, KG schema, prompt pack, etc.
- Realism policy: “illustrative only” vs “bounded by user-provided ranges”

---

## Operating Procedure (How to Execute)

### Step A — Establish the “Synthetic Contract”
Always state, in one short paragraph:
- what is synthetic vs what is user-supplied
- the assumed bounds and units
- what will be validated (and how)

### Step B — Choose a Generation Mode
Select one (or combine):
1) Knowledge modules (structured articles)
2) Q&A generation:
   - Conceptual (broad semiconductor)
   - Routine litho issues (troubleshooting)
   - Complex litho reasoning (guided solutions)
3) Anomaly synthesis (SECS/GEM-shaped alarm/event records)
4) Window estimation (process window + guard-band)
5) Physics modeling (first-order + semi-empirical)
6) KG integration (ontology + entities + relations + retrieval plan)

### Step C — Enforce Plausibility Rules
- Units consistent (nm, mJ/cm², °C, s)
- Monotonicity and sign consistency (as assumed and declared)
- Correlations injected deliberately (not random noise everywhere)
- No impossible outliers unless explicitly “fault injection”

### Step D — Validate (Hard Gates + Soft Scoring)
Hard gates (must pass):
- schema completeness (all required fields present)
- unit sanity (no mixed units)
- leakage check (no proprietary identifiers)

Soft scoring (should be strong):
- distribution plausibility
- causal consistency (symptom→cause→evidence→action)
- coverage balance (not overly skewed to one failure mode)

### Step E — KG Integration (If requested)
1) Define ontology (node/edge types, aliases)
2) Map generated knowledge to entities and relations
3) Provide retrieval strategy:
   - entity extraction → KG expansion → targeted retrieval → answer synthesis
4) Provide “traceability” format (query → entities → evidence → conclusion)

---

## Quick Reference

### Trigger Phrases (User → invoke this skill)
- “Lithography process domain knowledge generation”
- “Generate realistic anomaly logs with parameters”
- “Estimate recipe parameter window / process window”
- “Model lithography physics / CDU budget / overlay fingerprint”
- “Design synthetic data validation strategy”
- “Build prompt templates for lithography expert”
- “Integrate with knowledge graph / GraphRAG / LightRAG”

### Minimal Prompt Skeleton (drop-in)
**User intent + constraints**
- Domain: (EUV/DUV, layer type, node)
- Objective: (knowledge / data / window / KG)
- Bounds: (targets, tolerances, ranges)
- Output style: (educational / operational / dataset-like)
- Validation: (what checks you want)

**Assistant response must include**
- Declared assumptions
- Generation plan
- Output (knowledge/data) with labels “synthetic”
- Validation summary
- If KG requested: ontology + mapping + retrieval plan

### Complex Lithography Reasoning Answer Format (required)
- Given / Assumptions
- Goal
- Key relations (first-order)
- Step-by-step reasoning
- Conclusion + sanity checks
- What additional data would tighten the estimate (if under-specified)

### Routine Litho Issue Answer Format (required)
- Symptom
- Likely causes (ranked)
- Evidence to collect next (metrology/inspection)
- Corrective actions
- Preventive controls (SPC/PM/recipe governance)
- Escalation criteria

### Anomaly Synthesis Record Fields (recommended)
- equipment_family, module, severity
- alarm_id (ALID), alarm_code (ALCD), alarm_text (ALTX)
- timestamp
- context_params (unit-tagged)
- hypothesized_root_causes (ranked)
- containment_actions, corrective_actions
- evidence_to_collect_next

---

## Guardrails (Expert Discipline)
- Prefer bounded ranges and sensitivity-based reasoning over false precision.
- Always differentiate:
  - “physics-driven expectation”
  - “process integration reality”
  - “metrology uncertainty”
- Keep outputs audit-friendly: assumptions + checks + traceable logic.

---

## Completion Criteria
This skill is “done” when the response:
- matches the requested generation mode(s),
- clearly labels assumptions and synthetic content,
- provides domain-expert structure (formats above),
- includes a validation plan or validation summary,
- includes KG integration plan when requested.
