# Process Physics Models

First-order and semi-empirical models for lithography outcomes. Use these for estimation, risk assessment, and diagnostic reasoning—not for production simulation.

## Model Categories

### 1. Imaging Models

#### Resolution Limit (Rayleigh Criterion)
```
R = k1 × λ / NA

Where:
  R = minimum resolvable pitch (nm)
  k1 = process factor (0.25-0.4 typical, lower is harder)
  λ = wavelength (193nm ArF, 13.5nm EUV)
  NA = numerical aperture
```

**Application**: Estimate whether a target pitch is feasible for given optical configuration. k1 < 0.3 requires aggressive RET (OPC, source-mask optimization).

#### Depth of Focus
```
DOF = k2 × λ / NA²

Where:
  k2 = process factor (0.5-1.0 typical)
```

**Key insight**: DOF scales inversely with NA². High-NA reduces resolution limit but shrinks process window. This is the fundamental NA tradeoff.

#### Aerial Image Contrast (NILS)
```
NILS = (Imax - Imin) / (Imax + Imin) × pitch / π

Where:
  NILS = Normalized Image Log-Slope
  I = intensity at bright/dark regions
```

**Application**: NILS > 2 indicates robust printing. NILS < 1.5 suggests high defectivity risk. NILS is sensitive to defocus and drops at pattern edges.

### 2. Resist Models

#### Exposure-Response (Dose-to-Clear)
```
CD_deviation = S_dose × (D_actual / D_target - 1) × 100

Where:
  S_dose = dose sensitivity (nm/%)
  D = dose
```

**Typical values**: S_dose = 1.5-3 nm/% for ArF resists, 2-5 nm/% for EUV.

#### PEB Sensitivity
```
CD_deviation = S_PEB × ΔT_PEB

Where:
  S_PEB = PEB temperature sensitivity (nm/°C)
  ΔT_PEB = deviation from target temperature
```

**Typical values**: S_PEB = 2-4 nm/°C, higher for chemically amplified resists.

#### Activation Energy Model (Arrhenius)
```
Rate ∝ exp(-Ea / kT)

Temperature sensitivity: dR/dT ∝ Ea/kT² × Rate
```

**Application**: Explains why small temperature changes have large effect on resist chemistry. Ea ~ 20-30 kcal/mol for typical CAR deprotection.

### 3. Overlay Models

#### Rigid Body Components
```
OVL_x = Tx + Rx×y + Mx×x
OVL_y = Ty + Ry×x + My×y

Where:
  T = translation
  R = rotation
  M = magnification
```

#### Higher-Order Components
```
OVL = Σ(aij × x^i × y^j) for i+j ≤ N

Common basis: Zernike polynomials or Legendre polynomials
```

**Application**: Decompose measured overlay into correctable (scanner adjustable) and non-correctable (process/material) components.

#### Overlay Budget
```
OVL_total² = OVL_scanner² + OVL_match² + OVL_wafer² + OVL_process² + OVL_metrology²
```

**Typical allocation** (advanced node):
- Scanner: 1-1.5nm
- Matching: 0.5-1nm
- Wafer distortion: 1-2nm
- Process (film stress, etc.): 0.5-1nm
- Metrology: 0.3-0.5nm
- Total budget: 2-3nm

### 4. CDU Models

#### CDU Budget Decomposition
```
CDU_total² = CDU_dose² + CDU_focus² + CDU_mask² + CDU_OPC² + CDU_etch² + ...
```

#### Dose-Induced CDU
```
CDU_dose = S_dose × Dose_uniformity

Example: 2 nm/% × 1% = 2nm
```

#### Focus-Induced CDU (near best focus)
```
CDU_focus ≈ (∂²CD/∂focus²) × focus_variation² / 2

Note: First derivative is ~0 at best focus, second derivative dominates
```

### 5. LER/LWR Models

#### Stochastic LER (EUV)
```
LER ∝ (1/√dose) × (1/NILS)

Higher dose reduces shot noise
Better aerial image reduces amplification of noise
```

#### Resist Contribution
```
LER_total² = LER_aerial² + LER_resist²

LER_resist depends on:
  - Molecular weight distribution
  - Acid diffusion length
  - Development kinetics
```

### 6. Defectivity Models

#### Pattern Collapse Criterion
```
Collapse when: Capillary_force > Pattern_strength

Capillary force ∝ γ × cosθ / spacing
Pattern strength ∝ E × (CD)³ / H²

Where:
  γ = surface tension
  θ = contact angle
  E = resist modulus
  H = pattern height
```

**Critical ratio**: Aspect ratio (H/CD) > 3-4 indicates collapse risk for aqueous develop.

#### Stochastic Failure (EUV)
```
P_failure ∝ exp(-NILS × √dose × CD)

Probability increases exponentially as:
  - NILS decreases (worse aerial image)
  - Dose decreases (more shot noise)
  - CD decreases (fewer photons per feature)
```

## Using Models for Estimation

### Step 1: Identify Relevant Physics
Match the user's question to the appropriate model category.

### Step 2: State Assumptions
List all parameter values used—measured, literature, or assumed.

### Step 3: Calculate with Bounds
Provide point estimate plus sensitivity to assumed parameters.

### Step 4: Sanity Check
Verify result is physically plausible:
- Within known industry ranges
- Consistent with related observations
- Appropriate magnitude and sign

### Step 5: State Limitations
Acknowledge where the model simplifies reality:
- First-order approximations miss higher-order effects
- Process integration effects not captured
- Material-specific behavior may vary

## Example Application

**Question**: What CDU contribution should we expect from ±2% dose uniformity if dose sensitivity is 2.2 nm/%?

**Analysis**:
```
Given:
  Dose uniformity: ±2% (assume 3σ)
  S_dose: 2.2 nm/%

Calculation:
  CDU_dose = S_dose × Dose_variation
  CDU_dose = 2.2 nm/% × 2% = 4.4 nm (3σ)
  CDU_dose = 1.47 nm (1σ)

Sanity check:
  - 4.4nm 3σ is significant for sub-30nm features
  - Consistent with dose being a major CDU contributor
  
Limitation:
  - Assumes dose sensitivity is constant (linear regime)
  - Does not include focus-dose interaction
  - Actual CDU includes other sources (mask, OPC, etch)

Recommendation:
  Tighten dose uniformity or reduce sensitivity via OPC iteration
```