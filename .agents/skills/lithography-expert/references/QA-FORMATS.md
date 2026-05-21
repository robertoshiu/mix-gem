# Q&A Generation Formats

Generate Q&A pairs at three complexity levels, each with required structure.

## Level 1: Conceptual (Broad Semiconductor)

**Purpose:** Test foundational understanding.

**Format:**
```
Q: [Conceptual question about semiconductor fundamentals]
A: [2-3 sentence explanation covering the key principle]
   Key insight: [One-line takeaway]
```

**Example:**
```
Q: Why does EUV lithography require vacuum operation?
A: EUV photons at 13.5nm wavelength are absorbed by air molecules including nitrogen and oxygen. Even a short path through air would attenuate the beam to unusable levels. The entire optical path from source to wafer must be maintained at high vacuum (typically <1 Pa).
   Key insight: EUV's extreme absorption by matter drives the vacuum requirement and limits viable optical materials to reflective multilayer mirrors.
```

## Level 2: Routine Troubleshooting

**Purpose:** Guide systematic issue resolution.

**Required Format:**
```
Q: [Operational problem statement]
A:
   Symptom: [Observable issue]
   
   Likely Causes (ranked):
   1. [Most probable] - [brief rationale]
   2. [Second most probable] - [brief rationale]
   3. [Less common] - [brief rationale]
   
   Evidence to Collect:
   - [Metrology/inspection action 1]
   - [Metrology/inspection action 2]
   
   Corrective Actions:
   - [Immediate fix for cause 1]
   - [Alternative if cause 2]
   
   Preventive Controls:
   - [SPC/PM/recipe governance measure]
   
   Escalation: [When to escalate]
```

**Example:**
```
Q: Overlay suddenly shifts by 15nm on a specific layer after scanner PM.
A:
   Symptom: Systematic overlay offset appearing post-PM on layer N.
   
   Likely Causes (ranked):
   1. Alignment calibration drift - lens/stage recalibration may have shifted reference
   2. Reticle stage repositioning - PM may have affected reticle alignment
   3. Wafer stage leveling change - leveling sensor recalibration offset
   
   Evidence to Collect:
   - Compare pre/post PM scanner qualification data
   - Run overlay monitor wafers with known history
   - Check alignment mark signal quality trends
   
   Corrective Actions:
   - Re-run scanner-to-scanner matching qualification
   - Apply correctables offset to compensate shift
   
   Preventive Controls:
   - Mandate overlay qualification wafer after any scanner PM
   - SPC chart on inter-field and intra-field overlay components
   
   Escalation: If offset exceeds correction capability or varies wafer-to-wafer
```

## Level 3: Complex Reasoning

**Purpose:** Walk through multi-factor analysis requiring domain synthesis.

**Required Format:**
```
Q: [Complex scenario requiring integration of multiple concepts]
A:
   Given/Assumptions:
   - [Stated constraint 1]
   - [Stated constraint 2]
   - [Assumed value if not provided]
   
   Goal: [What we need to determine]
   
   Key Relations:
   - [First-order relationship 1]
   - [First-order relationship 2]
   
   Step-by-Step Reasoning:
   1. [Analysis step with quantitative estimate if possible]
   2. [Next step building on previous]
   3. [Continue until conclusion]
   
   Conclusion: [Direct answer with confidence qualifier]
   
   Sanity Checks:
   - [Verification that answer is physically reasonable]
   - [Cross-check against known behavior]
   
   To Tighten Estimate: [What additional data would reduce uncertainty]
```

**Example:**
```
Q: If CD sensitivity to dose is 2nm per 1% dose change, and dose uniformity across the slit is ±1.5%, what CD uniformity contribution should we expect? How does this interact with focus uniformity?

A:
   Given/Assumptions:
   - ∂CD/∂dose = 2nm/%
   - Dose uniformity = ±1.5% (3σ assumed)
   - Focus uniformity: not specified, assume ±30nm typical
   - ∂CD/∂focus near best focus: ~0.5nm per 10nm (typical for mid-NA DUV)
   
   Goal: Estimate CDU contribution from dose and focus non-uniformity
   
   Key Relations:
   - CDU_dose = (∂CD/∂dose) × dose_variation
   - CDU_focus = (∂CD/∂focus) × focus_variation
   - CDU_total ≈ √(CDU_dose² + CDU_focus²) assuming independence
   
   Step-by-Step Reasoning:
   1. Dose contribution: 2nm/% × 1.5% = 3nm (3σ)
   2. Focus contribution: 0.5nm/10nm × 30nm = 1.5nm (3σ)
   3. Combined (RSS): √(3² + 1.5²) = √11.25 ≈ 3.4nm (3σ)
   4. Dose dominates but focus is not negligible
   
   Conclusion: Expect ~3.4nm CDU (3σ) from dose+focus, with dose being the larger contributor at ~3nm.
   
   Sanity Checks:
   - Result is <5nm, reasonable for well-controlled scanner
   - Dose dominance expected given the relatively large sensitivity
   
   To Tighten Estimate: Measure actual ∂CD/∂focus via FEM, confirm dose uniformity spec applies to this recipe/pattern
```

## Generation Rules

1. Match complexity to stated level
2. Include quantitative estimates where possible (with stated assumptions)
3. Always provide traceability from inputs to conclusions
4. Use industry-standard terminology
5. Label all assumed values explicitly