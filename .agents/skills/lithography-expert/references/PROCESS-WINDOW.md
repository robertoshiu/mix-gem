# Process Window Estimation

Estimate feasible recipe parameter windows using sensitivity-based reasoning and guard-band logic.

## Core Framework

A process window defines the region where all quality metrics remain within tolerance. The window is bounded by:

1. **Sensitivities**: How much each metric changes per unit parameter change
2. **Budgets**: Allowable variation in each quality metric
3. **Guard-bands**: Margin reserved for drift, matching, and measurement uncertainty

## Sensitivity Notation

Use consistent notation throughout analysis:

| Symbol | Meaning | Typical Units |
|--------|---------|---------------|
| ∂CD/∂dose | CD sensitivity to dose | nm/% |
| ∂CD/∂focus | CD sensitivity to focus | nm/nm |
| ∂CD/∂PEB | CD sensitivity to PEB temperature | nm/°C |
| ∂OVL/∂dose | Overlay sensitivity to dose (rare) | nm/% |
| DOF | Depth of focus (CD stays in spec) | nm |
| EL | Exposure latitude (dose range for CD spec) | % |

## Window Calculation Method

### Step 1: List Quality Constraints

Define targets and tolerances for relevant metrics:

```
CD_target = 24 nm ± 2 nm (3σ)
Overlay_budget = ± 3 nm (per layer)
CDU_budget = 1.5 nm (3σ)
LER_max = 2.5 nm
```

### Step 2: Identify Dominant Sensitivities

For each parameter, list known or estimated sensitivities:

```
Focus:
  ∂CD/∂focus = 0.8 nm per 10nm defocus (near best focus)
  ∂CD/∂focus² = non-linear beyond ±40nm

Dose:
  ∂CD/∂dose = 2.5 nm per 1% dose change
  
PEB Temperature:
  ∂CD/∂PEB = 3 nm per 1°C
```

### Step 3: Invert to Find Parameter Allowable

Given budget B and sensitivity S:
```
Allowable_parameter_range = B / S
```

Example:
```
CD budget = ±2 nm
∂CD/∂dose = 2.5 nm/%
Dose_allowable = 2 / 2.5 = ±0.8%
```

### Step 4: Apply Guard-Bands

Reserve margin for:
- Tool-to-tool matching: typically 20-30% of window
- Drift between calibrations: 10-20%
- Metrology uncertainty: depends on Gauge R&R
- Incoming material variation: wafer flatness, film thickness

```
Usable_window = Raw_window × (1 - guard_band_fraction)
```

Typical total guard-band: 40-50% of calculated window.

### Step 5: Verify Window Exists

If usable window is negative or impractically small:
- Relax tolerance (if possible)
- Improve sensitivity (OPC, source-mask optimization)
- Tighten incoming material spec
- Flag as high-risk layer

## DOE/FEM Recommendations

When user needs experimental confirmation of window:

**Focus-Exposure Matrix (FEM):**
```
Focus range: Best focus ± 60nm, 9 steps
Dose range: Target ± 5%, 7 steps
Measurements: CD at multiple sites, edge placement error, profile SEM
```

**Track Parameter Matrix:**
```
PEB: Target ± 2°C, 5 steps
Develop: Target ± 5s, 5 steps
Response: CD, profile, defectivity
```

## Example Window Calculation

```
Given:
- CD target: 32nm ± 1.5nm (3σ)
- Node: DUV ArF immersion
- Layer: Contact
- Sensitivities (from prior FEM):
  - ∂CD/∂dose = 1.8 nm/%
  - ∂CD/∂focus = 0.5 nm/10nm (within ±30nm of best focus)
  - ∂CD/∂PEB = 2.2 nm/°C

Step 1: Raw allowable ranges
- Dose: 1.5 / 1.8 = ±0.83%
- Focus: 1.5 / 0.05 = ±30nm (assuming linear region)
- PEB: 1.5 / 2.2 = ±0.68°C

Step 2: Apply 45% guard-band
- Usable dose window: ±0.46%
- Usable focus window: ±16.5nm
- Usable PEB window: ±0.37°C

Step 3: Assess feasibility
- Dose: Scanner spec typically ±0.2-0.3%, window is tight but feasible
- Focus: Scanner DOF typically ±50nm, well within capability
- PEB: Track typically ±0.1°C, comfortably achievable

Conclusion: Window exists. Dose is the limiting factor. Recommend centering
at best dose with tight SPC. Consider OPC iteration to reduce dose sensitivity.
```

## Output Format

Always structure window analysis as:

```
## Process Window Analysis

### Inputs
- [List all provided constraints and targets]
- [State assumed values with source/rationale]

### Sensitivity Analysis
- [Table of ∂metric/∂parameter values]
- [Source: measured, literature, assumed]

### Raw Window
- [Parameter 1]: ± X [unit]
- [Parameter 2]: ± Y [unit]

### Guard-Band Allocation
- Matching: [%]
- Drift: [%]
- Metrology: [%]
- Total: [%]

### Usable Window
- [Parameter 1]: ± X' [unit]
- [Parameter 2]: ± Y' [unit]

### Feasibility Assessment
- [Which parameters are limiting?]
- [Is window sufficient for production?]

### Recommendations
- [Centering strategy]
- [SPC limits]
- [DOE if needed]
```