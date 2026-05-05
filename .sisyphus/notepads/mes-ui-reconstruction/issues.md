# Issues - MES UI Reconstruction

## Known Issues
- `better-logo.png` is 7.3MB — must optimize to <50KB
- `GaugeCard` overflows for values like "+1205.0" (etch equipment)
- `KpiGaugeCard` overflows for values like "+2.35" or "-1.87"
- No Next.js Image component used anywhere in project

## Resolved Issues
- Theme conflict across 3 references → Dark theme unified
- 7.3MB logo perf disaster → Mandate optimization to <50KB
- "3D fab floor" scope creep → CSS isometric only
