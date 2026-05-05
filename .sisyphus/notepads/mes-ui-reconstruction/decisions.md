# Decisions - MES UI Reconstruction

## 2026-05-05
- **Theme**: Dark theme unified — keep current dark navy, interpret all reference elements in dark theme
- **Page mapping**: Enhance existing `/mes/spc` page only (no new routes)
- **3D approach**: CSS isometric only (no Three.js/WebGL)
- **Gauge style**: Speedometer for SPC page, half-arc (overflow-fixed) for dashboard
- **Logo size**: 48px height minimum (circular logo needs at least 40px to be legible)
- **Speedometer zones**: Green 0-60%, Yellow 60-80%, Red 80-100% of parameter range
- **Process flow steps**: Keep existing order (COAT → EXPOSE → DEVELOP → METROLOGY → SPC)
- **Test strategy**: No unit tests, agent-executed QA only
