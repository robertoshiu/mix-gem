# Anomaly Synthesis for SECS/GEM Systems

Generate realistic alarm/event records for training, retrieval enrichment, and RCA drills.

## Record Schema

```yaml
anomaly_record:
  # Equipment identification
  equipment_family: string    # e.g., "scanner", "track", "etch"
  equipment_model: string     # e.g., "TWINSCAN_NXE", "LITHIUS_Pro"
  module: string              # e.g., "wafer_stage", "reticle_handler", "EUV_source"
  
  # SECS/GEM alarm fields
  alarm_id: integer           # ALID - unique alarm identifier
  alarm_code: string          # ALCD - equipment-specific code
  alarm_text: string          # ALTX - human-readable description
  severity: enum              # "warning", "light_alarm", "serious_alarm", "critical"
  
  # Temporal context
  timestamp: ISO8601          # When alarm triggered
  lot_id: string              # Synthetic lot identifier
  wafer_id: string            # Synthetic wafer identifier
  recipe_name: string         # Active recipe at alarm time
  
  # Process context (unit-tagged)
  context_params:
    - name: string
      value: number
      unit: string
      nominal: number         # Expected value
      tolerance: number       # Acceptable range
  
  # Root cause analysis
  hypothesized_root_causes:
    - rank: integer           # 1 = most likely
      cause: string
      probability: string     # "high", "medium", "low"
      supporting_evidence: string
  
  # Response actions
  containment_actions:
    - action: string
      immediate: boolean
  corrective_actions:
    - action: string
      owner: string           # Role, not person name
  evidence_to_collect_next:
    - measurement_type: string
      expected_finding: string
```

## Severity Guidelines

| Severity | Criteria | Typical Response |
|----------|----------|------------------|
| Warning | Parameter drift, no immediate impact | Log and monitor |
| Light alarm | Out-of-spec condition, product may be affected | Hold wafer, investigate |
| Serious alarm | Equipment protection triggered, process stopped | Hold lot, PM required |
| Critical | Safety interlock, immediate shutdown | Evacuate if needed, full investigation |

## Context Parameter Patterns

### Scanner Alarms
```yaml
context_params:
  - name: "focus_offset"
    value: 45
    unit: "nm"
    nominal: 0
    tolerance: 30
  - name: "dose_delivered"
    value: 32.5
    unit: "mJ/cm2"
    nominal: 33.0
    tolerance: 0.5
  - name: "overlay_x"
    value: 8.2
    unit: "nm"
    nominal: 0
    tolerance: 5
```

### Track Alarms
```yaml
context_params:
  - name: "PEB_temperature"
    value: 112.5
    unit: "C"
    nominal: 110.0
    tolerance: 0.3
  - name: "develop_time"
    value: 58
    unit: "s"
    nominal: 60
    tolerance: 2
  - name: "dispense_volume"
    value: 1.82
    unit: "mL"
    nominal: 2.0
    tolerance: 0.1
```

### EUV Source Alarms
```yaml
context_params:
  - name: "source_power"
    value: 185
    unit: "W"
    nominal: 250
    tolerance: 20
  - name: "droplet_stability"
    value: 0.82
    unit: "arb"
    nominal: 0.95
    tolerance: 0.05
  - name: "collector_reflectivity"
    value: 0.88
    unit: "fraction"
    nominal: 0.92
    tolerance: 0.02
```

## Example Complete Record

```yaml
anomaly_record:
  equipment_family: "scanner"
  equipment_model: "TWINSCAN_NXE_3400"
  module: "wafer_stage"
  
  alarm_id: 7042
  alarm_code: "WS_FOCUS_DRIFT"
  alarm_text: "Focus offset exceeds tolerance during exposure"
  severity: "light_alarm"
  
  timestamp: "2024-03-15T14:23:47Z"
  lot_id: "SYN_LOT_A1234"
  wafer_id: "SYN_W07"
  recipe_name: "METAL1_EUV_32P"
  
  context_params:
    - name: "focus_offset"
      value: 48
      unit: "nm"
      nominal: 0
      tolerance: 30
    - name: "leveling_correction"
      value: 125
      unit: "nm"
      nominal: 80
      tolerance: 50
    - name: "wafer_flatness_range"
      value: 220
      unit: "nm"
      nominal: 150
      tolerance: 80
  
  hypothesized_root_causes:
    - rank: 1
      cause: "Wafer flatness exceeds spec due to backside contamination"
      probability: "high"
      supporting_evidence: "Leveling correction also elevated"
    - rank: 2
      cause: "Level sensor calibration drift"
      probability: "medium"
      supporting_evidence: "Would affect all wafers consistently"
    - rank: 3
      cause: "Chuck flatness degradation"
      probability: "low"
      supporting_evidence: "Would show pattern across wafer map"
  
  containment_actions:
    - action: "Hold current wafer for inspection"
      immediate: true
    - action: "Queue flatness measurement for remaining lot wafers"
      immediate: false
  
  corrective_actions:
    - action: "Backside inspection and clean if contaminated"
      owner: "process_engineer"
    - action: "Run level sensor qualification wafer"
      owner: "equipment_engineer"
  
  evidence_to_collect_next:
    - measurement_type: "Wafer backside particle inspection"
      expected_finding: "Contamination particles >1um"
    - measurement_type: "Focus uniformity map from FEM wafer"
      expected_finding: "Systematic focus signature if sensor drift"
```

## Generation Rules

1. All alarm_id values must be unique within a dataset
2. Context parameter values should be physically plausible and near their nominal with occasional excursions
3. Root causes must be causally connected to the observed parameter deviations
4. Never include real fab names, actual employee names, or proprietary identifiers
5. Label all records as "synthetic" in any dataset metadata
6. Inject deliberate correlations where physically expected (e.g., focus and leveling alarms often co-occur)