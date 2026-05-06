# Decisions — smart-factory-war-room-gauges

## Architecture
- Next.js static export (output: 'export', basePath: '/mix-gem')
- Playwright serves via custom static-server.mjs (not serve, not next dev)
- Gauge design system: shared tokens in globals.css + shared helpers in gauge-geometry.ts
- 3D fab scene: FabScenePrimitives.tsx composed into FactoryScene.tsx
