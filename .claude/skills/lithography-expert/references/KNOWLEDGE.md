# Knowledge Module Generation

## Module Structure

Generate knowledge modules with this structure:

```
## [Topic Title]

### Core Concept
[2-3 sentence explanation of the fundamental principle]

### Physical Basis
[How the phenomenon arises from underlying physics]

### Process Impact
[How this affects CD, overlay, CDU, LER, or defectivity]

### Coupled Effects
[Interactions with other process parameters]

### Practical Implications
[What process engineers need to know]
```

## Topic Categories

### Imaging Physics
- Focus-dose interaction (Bossung curves)
- Depth of focus vs numerical aperture tradeoffs
- Partial coherence effects on feature fidelity
- EUV stochastics and shot noise

### Overlay System
- Tool-to-tool matching and lens fingerprints
- Wafer distortion decomposition (translation, rotation, magnification, higher-order)
- Alignment mark quality and measurement noise
- Thermal effects on overlay stability

### Resist/Track Interactions
- PAB/PEB temperature sensitivity on CD
- Develop time kinetics and puddle effects
- Resist profile vs dose latitude
- Outgassing and contamination concerns (EUV)

### Defectivity
- Pattern collapse mechanisms
- Particle-induced bridging
- Stochastic printing failures (EUV)
- Reticle defect printability

## Example Module

```
## Focus-Dose Interaction

### Core Concept
CD varies with both focus and dose. The Bossung curve maps CD vs focus at different doses, revealing the process window where CD stays within tolerance.

### Physical Basis
Defocus blurs the aerial image, reducing contrast. Higher dose partially compensates by driving the resist harder, but beyond optimal focus, no dose can recover fidelity.

### Process Impact
Narrower Bossung iso-CD lines indicate tighter process windows. Dense-isolated bias shifts with focus position.

### Coupled Effects
Focus interacts with NA, partial coherence, and pattern density. Resist thickness and PAB temperature affect effective focus through swing curves.

### Practical Implications
Center the process at best focus (not best dose). Monitor focus via phase-grating marks. Allocate focus budget across scanner, leveling, and wafer flatness.
```

## Generation Rules

1. Use consistent units: nm for dimensions, mJ/cm² for dose, nm for focus
2. Reference industry-standard concepts (Bossung, OPC, source-mask optimization)
3. Connect theory to measurable outcomes
4. Keep explanations accessible to process engineers (not just physicists)