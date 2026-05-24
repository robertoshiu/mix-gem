// src/components/dashboard/__tests__/SubsystemCard.test.tsx

import { render, screen } from '@testing-library/react';
import { SubsystemCard } from '../SubsystemCard';
import type { SubsystemSnapshot, EquipmentStatus } from '@/lib/engines/dashboard-facility-types';

// Canvas mock — jsdom has no real canvas
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  clearRect: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  stroke: jest.fn(),
  arc: jest.fn(),
  fill: jest.fn(),
  fillRect: jest.fn(),
  fillText: jest.fn(),
  measureText: jest.fn(() => ({ width: 20 })),
  setLineDash: jest.fn(),
  scale: jest.fn(),
  save: jest.fn(),
  restore: jest.fn(),
  set strokeStyle(_: string) {},
  set fillStyle(_: string) {},
  set lineWidth(_: number) {},
  set lineJoin(_: string) {},
  set font(_: string) {},
  set textAlign(_: string) {},
  set textBaseline(_: string) {},
  set globalAlpha(_: number) {},
})) as never;

const mockSnapshot: SubsystemSnapshot = {
  id: 'ems',
  metrics: [
    { key: 'temp', value: 22.1, status: 'normal' },
    { key: 'rh', value: 45.2, status: 'normal' },
    { key: 'particles', value: 1200, status: 'warning' },
    { key: 'dp', value: 12.5, status: 'normal' },
  ],
  status: 'warning',
};

const mockEquipment: [EquipmentStatus, EquipmentStatus, EquipmentStatus] = [
  { name: 'HEPA Filter Bank', status: 'running', detail: 'ΔP 11.2Pa' },
  { name: 'Particle Monitor', status: 'maintenance', detail: 'Cal due 3 days' },
  { name: 'Makeup Air Damper', status: 'running', detail: 'Auto 78%' },
];

const sparklineData = [20, 21, 22, 21.5, 22.1, 22.3, 21.8];

describe('SubsystemCard', () => {
  beforeEach(() => {
    render(
      <SubsystemCard
        subsystemId="ems"
        snapshot={mockSnapshot}
        sparklineData={sparklineData}
        equipmentStatuses={mockEquipment}
      />,
    );
  });

  test('renders subsystem label', () => {
    expect(screen.getByText('EMS')).toBeInTheDocument();
    expect(screen.getByText(/Environmental/)).toBeInTheDocument();
  });

  test('renders chart title (primary metric name)', () => {
    expect(screen.getByText('Cleanroom Temp')).toBeInTheDocument();
  });

  test('renders canvas for threshold-band chart', () => {
    const canvas = document.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  test('renders all 4 metric values with units', () => {
    // 22.1°C appears twice: once in chart header, once in metrics row
    expect(screen.getAllByText('22.1°C').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('45.2%')).toBeInTheDocument();
    expect(screen.getByText('1200/m³')).toBeInTheDocument();
    expect(screen.getByText('12.5Pa')).toBeInTheDocument();
  });

  test('renders metric labels', () => {
    expect(screen.getByText('Temp')).toBeInTheDocument();
    expect(screen.getByText('RH')).toBeInTheDocument();
    expect(screen.getByText('Particles')).toBeInTheDocument();
  });

  test('renders equipment status items', () => {
    expect(screen.getByText('HEPA Filter Bank')).toBeInTheDocument();
    expect(screen.getByText('Particle Monitor')).toBeInTheDocument();
    expect(screen.getByText('Makeup Air Damper')).toBeInTheDocument();
  });

  test('renders equipment detail text', () => {
    expect(screen.getByText('ΔP 11.2Pa')).toBeInTheDocument();
    expect(screen.getByText('Cal due 3 days')).toBeInTheDocument();
    expect(screen.getByText('Auto 78%')).toBeInTheDocument();
  });

  test('renders status dot', () => {
    expect(screen.getByTestId('status-dot')).toBeInTheDocument();
  });

  test('applies data-subsystem attribute', () => {
    expect(document.querySelector('[data-subsystem="ems"]')).toBeInTheDocument();
  });
});
