# Quick Reference

Compact lookup tables for validation, units, sensitivities, and prompt templates.

## Validation Checklist

### Hard Gates (Must Pass)

| Check | Criterion | Action if Fail |
|-------|-----------|----------------|
| Schema complete | All required fields present | Add missing fields |
| Units consistent | No mixed unit systems | Convert to standard |
| Leakage-free | No proprietary identifiers | Remove/anonymize |
| Physically bounded | Values within plausible ranges | Clamp or flag |

### Soft Scoring (Should Be Strong)

| Check | Target | Acceptable |
|-------|--------|------------|
| Distribution plausibility | 95%+ values in typical range | 90%+ |
| Causal consistency | All cause→effect chains valid | Minor gaps OK |
| Coverage balance | <30% on any single failure mode | <40% |
| Sensitivity sign | All signs physically correct | Zero tolerance |

## Unit Conventions

### Standard Units

| Quantity | Unit | Symbol | Notes |
|----------|------|--------|-------|
| Dimension | nanometer | nm | CD, overlay, focus |
| Dose | millijoules per cm² | mJ/cm² | Scanner dose |
| Temperature | Celsius | °C | Track temps |
| Time | seconds | s | Develop, expose |
| Pressure | Pascal | Pa | Vacuum levels |
| Power | Watts | W | EUV source |
| Percentage | percent | % | Dose variation |

### Conversion Quick Reference

| From | To | Factor |
|------|----|--------|
| mJ/cm² | J/m² | ×10 |
| nm | Å | ×10 |
| °C | K | +273.15 |
| mTorr | Pa | ×0.133 |

## Common Sensitivity Values

### CD Sensitivities (Typical Ranges)

| Parameter | Sensitivity | Node Context |
|-----------|-------------|--------------|
| ∂CD/∂dose | 1.5-3 nm/% | ArF immersion |
| ∂CD/∂dose | 2-5 nm/% | EUV |
| ∂CD/∂focus | 0.3-1 nm/10nm | Near best focus |
| ∂CD/∂PEB | 2-4 nm/°C | CAR resists |
| ∂CD/∂develop | 0.5-1.5 nm/s | Standard develop |

### Overlay Budgets (Advanced Nodes)

| Component | Typical 3σ (nm) |
|-----------|-----------------|
| Scanner | 1.0-1.5 |
| Tool matching | 0.5-1.0 |
| Wafer distortion | 1.0-2.0 |
| Process-induced | 0.5-1.0 |
| Metrology | 0.3-0.5 |
| **Total (RSS)** | **2-3** |

### CDU Budgets (Sub-20nm Features)

| Component | Typical 3σ (nm) |
|-----------|-----------------|
| Dose uniformity | 1.5-2.5 |
| Focus uniformity | 0.5-1.5 |
| Mask contribution | 0.5-1.0 |
| OPC residual | 0.5-1.0 |
| Etch contribution | 1.0-2.0 |
| **Total (RSS)** | **2.5-4** |

### Process Windows (Typical)

| Parameter | Typical Capability | Spec (Example) |
|-----------|-------------------|----------------|
| Focus | ±50nm range | ±30nm usable |
| Dose | ±0.3% uniformity | ±1% process |
| PEB | ±0.1°C uniformity | ±0.5°C process |
| Overlay | 2nm 3σ | 3nm spec |

## Prompt Templates

### Knowledge Module Request

```
Generate a lithography knowledge module on [TOPIC].

Domain context:
- Wavelength: [EUV/DUV ArF]
- Node: [Xnm]
- Layer type: [contact/metal/via/etc.]

Output requirements:
- Core concept (2-3 sentences)
- Physical basis
- Process impact on [CD/overlay/CDU/LER/defectivity]
- Coupled effects with other parameters
- Practical implications for process engineers

Label all content as synthetic/illustrative.
```

### Anomaly Synthesis Request

```
Generate [N] synthetic SECS/GEM anomaly records for [EQUIPMENT_FAMILY].

Constraints:
- Module focus: [specific module or "varied"]
- Severity distribution: [warning/light/serious/critical ratios]
- Include context parameters with units and nominal values
- Provide ranked root cause hypotheses
- Include containment and corrective actions

Validation requirements:
- No proprietary identifiers
- Physically plausible parameter values
- Causal consistency between symptoms and causes

Output format: YAML records per schema in ANOMALY-SYNTHESIS.md
```

### Process Window Request

```
Estimate the process window for:

Target:
- CD: [X]nm ± [Y]nm (3σ)
- Overlay: ± [Z]nm
- CDU: [W]nm (3σ)

Process context:
- Node/wavelength: [EUV/DUV]
- Layer: [type]
- Known sensitivities: [if any, otherwise estimate]

Deliverables:
1. Sensitivity analysis (state sources: measured/literature/assumed)
2. Raw window calculation
3. Guard-band allocation (matching, drift, metrology)
4. Usable window assessment
5. Feasibility statement with limiting factor
6. DOE recommendation if window is marginal

Label all assumed values explicitly.
```

### Q&A Generation Request

```
Generate [N] Q&A pairs at [LEVEL: conceptual/troubleshooting/complex] level.

Domain focus: [topic area]

Level-specific requirements:
- Conceptual: Test foundational understanding, include key insight
- Troubleshooting: Follow symptom→causes→evidence→actions format
- Complex: Include Given/Goal/Relations/Steps/Conclusion/Sanity checks

Quality criteria:
- Quantitative where possible (with stated assumptions)
- Industry-standard terminology
- Traceable reasoning from inputs to conclusions
```

### KG Integration Request

```
Integrate the following content with knowledge graph structure:

Content type: [anomaly records / Q&A / knowledge module]
Content: [paste or reference]

Deliverables:
1. Entity extraction (list all identified entities with types)
2. Relation extraction (triples with attributes)
3. Ontology mapping (how entities fit schema)
4. Retrieval strategy recommendation
5. Example query showing KG-guided retrieval flow

Output format: YAML for entities/relations, prose for strategy
```

## Synthetic Contract Template

Include at the start of any generation response:

```
**Synthetic Content Notice**

This content is synthetically generated for [purpose: training/illustration/demonstration].

Bounds and assumptions:
- [List all assumed parameter ranges]
- [State what is user-provided vs. estimated]
- [Specify unit conventions used]

Validation applied:
- [List validation checks performed]
- [Note any soft-score concerns]

Not to be used for: [production decisions / actual equipment operation / etc.]
```