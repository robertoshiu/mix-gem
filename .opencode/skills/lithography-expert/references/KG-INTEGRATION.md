# Knowledge Graph Integration

Integrate lithography domain knowledge with knowledge graphs for GraphRAG/LightRAG-style retrieval workflows.

## Ontology Design

### Core Entity Types

```yaml
entities:
  Equipment:
    attributes: [equipment_family, model, module, capability_class]
    examples: ["scanner", "track", "EUV_source", "metrology_tool"]
    
  Process:
    attributes: [process_type, layer, node, technology]
    examples: ["lithography", "etch", "deposition", "CMP"]
    
  Parameter:
    attributes: [name, unit, typical_range, physics_basis]
    examples: ["focus", "dose", "overlay", "CD", "PEB_temperature"]
    
  Metric:
    attributes: [name, unit, specification, measurement_method]
    examples: ["CDU", "LER", "overlay_3sigma", "defect_density"]
    
  Failure_Mode:
    attributes: [name, severity, detection_method, category]
    examples: ["focus_drift", "dose_excursion", "pattern_collapse", "overlay_shift"]
    
  Root_Cause:
    attributes: [name, category, likelihood, evidence_pattern]
    examples: ["wafer_flatness", "sensor_calibration", "contamination", "recipe_error"]
    
  Action:
    attributes: [type, owner_role, urgency, effectiveness]
    examples: ["recipe_adjust", "PM_activity", "qualification_run", "escalation"]
    
  Knowledge_Module:
    attributes: [topic, complexity_level, related_physics]
    examples: ["focus_dose_interaction", "overlay_decomposition", "EUV_stochastics"]
```

### Core Relation Types

```yaml
relations:
  affects:
    from: [Parameter, Equipment, Process]
    to: [Metric, Failure_Mode]
    attributes: [sensitivity, direction, confidence]
    
  causes:
    from: [Root_Cause, Failure_Mode]
    to: [Failure_Mode, Metric_Deviation]
    attributes: [probability, mechanism, evidence]
    
  mitigates:
    from: [Action]
    to: [Failure_Mode, Root_Cause]
    attributes: [effectiveness, time_to_effect]
    
  measures:
    from: [Equipment]
    to: [Metric, Parameter]
    attributes: [precision, accuracy, throughput]
    
  requires:
    from: [Process, Action]
    to: [Equipment, Parameter_Setting]
    attributes: [criticality, tolerance]
    
  explains:
    from: [Knowledge_Module]
    to: [Parameter, Metric, Failure_Mode]
    attributes: [depth, applicability]
    
  related_to:
    from: [Any]
    to: [Any]
    attributes: [relationship_type, strength]
```

## Entity Extraction Patterns

When processing user queries or generated content, extract entities using these patterns:

### Equipment Mentions
```
Patterns:
  - "scanner", "stepper", "TWINSCAN", "NXE", "NXT"
  - "track", "coater", "developer", "LITHIUS", "SOKUDO"
  - "EUV source", "LPP", "tin droplet"
  - "metrology", "CD-SEM", "scatterometer", "overlay tool"
```

### Parameter Mentions
```
Patterns:
  - Numeric + unit: "45nm focus", "33 mJ/cm²", "110°C PEB"
  - Named parameters: "dose", "focus", "overlay", "CD"
  - Sensitivity expressions: "∂CD/∂dose", "focus sensitivity"
```

### Failure Mode Mentions
```
Patterns:
  - "drift", "shift", "excursion", "out-of-spec"
  - "collapse", "bridging", "missing", "extra patterns"
  - Alarm-related: "alarm", "fault", "error", "warning"
```

## Knowledge Graph Population

### From Anomaly Records

Transform anomaly synthesis records into graph triples:

```
Input Record:
  alarm_code: "WS_FOCUS_DRIFT"
  context: focus_offset = 48nm (nominal: 0, tolerance: 30)
  root_cause_1: "wafer_flatness"
  corrective_action: "backside_clean"

Generated Triples:
  (Equipment:wafer_stage) -[generates]-> (Failure_Mode:focus_drift)
  (Parameter:focus_offset) -[indicates]-> (Failure_Mode:focus_drift)
  (Root_Cause:wafer_flatness) -[causes {probability: high}]-> (Failure_Mode:focus_drift)
  (Action:backside_clean) -[mitigates]-> (Root_Cause:wafer_flatness)
```

### From Q&A Content

Transform Q&A pairs into graph structures:

```
Input Q&A:
  Q: "What causes overlay shift after scanner PM?"
  A: Likely causes: calibration_drift, reticle_repositioning...

Generated Triples:
  (Process:scanner_PM) -[triggers]-> (Failure_Mode:overlay_shift)
  (Root_Cause:calibration_drift) -[causes]-> (Failure_Mode:overlay_shift)
  (Root_Cause:reticle_repositioning) -[causes]-> (Failure_Mode:overlay_shift)
  (Action:overlay_qualification) -[detects]-> (Failure_Mode:overlay_shift)
```

### From Knowledge Modules

Transform structured explanations into concept graphs:

```
Input Module: Focus-Dose Interaction
  - Defocus blurs aerial image
  - Higher dose compensates partially
  - Bossung curve maps relationship

Generated Triples:
  (Parameter:defocus) -[affects {direction: degrades}]-> (Metric:aerial_image_contrast)
  (Parameter:dose) -[affects {direction: compensates}]-> (Metric:CD)
  (Knowledge:Bossung_curve) -[explains]-> (Parameter:focus, Parameter:dose, Metric:CD)
```

## Retrieval Strategy: KG-First RAG

### Step 1: Entity Extraction from Query

```
User Query: "Why is my CD drifting on the contact layer?"

Extracted Entities:
  - Metric: CD
  - Failure_Mode: drift
  - Layer: contact
```

### Step 2: KG Expansion

From extracted entities, traverse the graph to find related nodes:

```
CD -> [affected_by] -> dose, focus, PEB, develop_time, mask_CD
drift -> [caused_by] -> equipment_drift, process_drift, material_variation
contact -> [requires] -> high_NA, aggressive_OPC, tight_overlay

Expansion depth: 2 hops typical
```

### Step 3: Targeted Text Retrieval

Use expanded entity set to filter/boost text retrieval:

```
Retrieval query enhanced with:
  - Entity mentions: "dose", "focus", "PEB", "contact"
  - Relation context: "causes CD drift", "contact layer sensitivity"
  
Vector search weighted by entity overlap
```

### Step 4: Answer Synthesis with Traceability

Structure answer to show: query → entities → evidence → conclusion

```
Response Format:
  Query: [original question]
  Entities Identified: [list]
  Relevant Knowledge:
    - [Source 1]: [key finding]
    - [Source 2]: [key finding]
  Synthesis: [answer integrating multiple sources]
  Confidence: [based on evidence coverage]
  Gaps: [what additional info would help]
```

## Example KG Integration Output

```yaml
query: "Scanner PM caused overlay shift, what should we check?"

entities_extracted:
  - Equipment: scanner
  - Process: PM
  - Failure_Mode: overlay_shift

kg_traversal:
  overlay_shift:
    causes:
      - calibration_drift (high_probability)
      - reticle_stage_shift (medium_probability)
      - wafer_stage_leveling (medium_probability)
    detections:
      - overlay_monitor_wafer
      - scanner_qualification
    mitigations:
      - re-calibration
      - correctables_update

evidence_retrieved:
  - "Routine Litho Issue: Overlay shift after PM" (QA database)
  - "Scanner qualification procedure" (SOP reference)
  - "Overlay budget allocation" (Knowledge module)

synthesized_answer:
  Primary checks:
    1. Compare pre/post PM scanner qualification data
    2. Run overlay monitor wafers from recent production
    3. Review calibration logs for any parameter changes
  
  Likely root causes (ranked):
    1. Alignment system recalibration shifted reference
    2. Reticle stage position offset
    3. Wafer leveling sensor calibration change
  
  Recommended actions:
    - Immediate: Apply correctables offset if shift is systematic
    - Short-term: Full scanner-to-scanner matching qualification
    - Preventive: Mandate overlay qualification after any scanner PM

traceability:
  conclusion_based_on: [QA_record_127, SOP_scanner_qual, KM_overlay_budget]
  confidence: high (multiple corroborating sources)
```

## Implementation Notes

When implementing KG integration:

1. **Normalize terminology**: Use canonical entity names with alias mapping for variations ("scanner" = "stepper" = "exposure_tool")

2. **Maintain provenance**: Every triple should trace back to its source (anomaly record, Q&A pair, knowledge module, or user input)

3. **Version the ontology**: As understanding evolves, the schema may need updates; maintain backward compatibility

4. **Handle uncertainty**: Relations should include confidence/probability attributes; propagate uncertainty through inference chains

5. **Enable multi-hop reasoning**: The KG should support queries like "what root causes affect CD through dose sensitivity" requiring traversal through intermediate nodes