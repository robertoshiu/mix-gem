'use client';

import { OrbitControls, Grid, Line } from '@react-three/drei';
import { useState } from 'react';
import { AmhsRail, CleanroomShell, CoaterDeveloperTrack, DataFlowLine, LithoScanner, MetrologyTool, StatusBeacon, ZoneAccentLight } from './FabScenePrimitives';

const FLOOR_POINTS: [number, number, number][] = [
  [-14, 0.08, -10],
  [14, 0.08, -10],
  [14, 0.08, 10],
  [-14, 0.08, 10],
  [-14, 0.08, -10],
];

export function LithoFactoryScene() {
  const [selected, setSelected] = useState('NXE-01');
  const cyan = '#22d3ee';

  return (
    <>
      <ambientLight intensity={0.24} color="#050a1f" />
      <directionalLight position={[14, 22, 12]} intensity={0.58} color="#93c5fd" />
      <pointLight position={[0, 5, 0]} intensity={1.1} color={cyan} />
      <OrbitControls enableRotate enableZoom enablePan target={[0, 0.8, 0]} minDistance={9} maxDistance={44} maxPolarAngle={Math.PI / 2.12} />
      <Grid position={[0, 0, 0]} args={[36, 28]} cellSize={1} cellThickness={0.5} cellColor="#113052" sectionSize={4} sectionThickness={1.3} sectionColor={cyan} fadeDistance={36} fadeStrength={1.6} infiniteGrid={false} />
      <Line points={FLOOR_POINTS} color={cyan} lineWidth={2.2} transparent opacity={0.7} dashed dashSize={1.2} gapSize={0.35} />
      <CleanroomShell />
      <LithoScanner position={[-6, 0.12, -3.4]} color="#38bdf8" label="NXE-01" selected={selected === 'NXE-01'} onClick={() => setSelected('NXE-01')} />
      <LithoScanner position={[-2.7, 0.12, -3.4]} color="#60a5fa" label="NXE-02" selected={selected === 'NXE-02'} onClick={() => setSelected('NXE-02')} />
      <CoaterDeveloperTrack position={[3.8, 0.12, -3.6]} color="#a78bfa" label="TRACK-7" selected={selected === 'TRACK-7'} onClick={() => setSelected('TRACK-7')} />
      <MetrologyTool position={[-5.2, 0.12, 4.5]} color="#f59e0b" label="OVL-04" selected={selected === 'OVL-04'} onClick={() => setSelected('OVL-04')} />
      <MetrologyTool position={[-2.8, 0.12, 4.5]} color="#10b981" label="CDSEM-2" selected={selected === 'CDSEM-2'} onClick={() => setSelected('CDSEM-2')} />
      <MetrologyTool position={[-0.4, 0.12, 4.5]} color="#22d3ee" label="SCAT-1" selected={selected === 'SCAT-1'} onClick={() => setSelected('SCAT-1')} />
      <AmhsRail color={cyan} />
      <DataFlowLine from={[-6, 2.3, -3.4]} to={[0, 2.2, 0]} />
      <DataFlowLine from={[3.8, 1.8, -3.6]} to={[0, 2.2, 0]} />
      <DataFlowLine from={[-2.8, 1.8, 4.5]} to={[0, 2.2, 0]} />
      <StatusBeacon position={[0, 0, 0]} color={cyan} pulse />
      <ZoneAccentLight position={[-5, 4, -3]} color="#38bdf8" />
      <ZoneAccentLight position={[4, 4, -3]} color="#a78bfa" />
      <ZoneAccentLight position={[-3, 4, 4]} color="#f59e0b" />
    </>
  );
}
