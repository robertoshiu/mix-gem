import { render, screen } from '@testing-library/react';
import { SubsystemCard } from '../SubsystemCard';
import type { SubsystemSnapshot } from '@/lib/engines/dashboard-facility-types';

// Canvas mock — jsdom has no real canvas support
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  clearRect: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  stroke: jest.fn(),
  arc: jest.fn(),
  fill: jest.fn(),
  scale: jest.fn(),
  set strokeStyle(_: string) {},
  set fillStyle(_: string) {},
  set lineWidth(_: number) {},
  set lineJoin(_: string) {},
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

const sparklineData = [20, 21, 22, 21.5, 22.1];

describe('SubsystemCard', () => {
  beforeEach(() => {
    render(
      <SubsystemCard
        subsystemId="ems"
        snapshot={mockSnapshot}
        sparklineData={sparklineData}
      />,
    );
  });

  test('renders subsystem label', () => {
    expect(screen.getByText('EMS')).toBeInTheDocument();
    expect(screen.getByText(/Environmental Monitoring/)).toBeInTheDocument();
  });

  test('renders all 4 metric values', () => {
    expect(screen.getByText('22.1')).toBeInTheDocument();
    expect(screen.getByText('45.2')).toBeInTheDocument();
    expect(screen.getByText('1200')).toBeInTheDocument();
    expect(screen.getByText('12.5')).toBeInTheDocument();
  });

  test('renders metric labels', () => {
    expect(screen.getByText('Temp')).toBeInTheDocument();
    expect(screen.getByText('RH')).toBeInTheDocument();
    expect(screen.getByText('Particles')).toBeInTheDocument();
  });

  test('renders status dot', () => {
    expect(screen.getByTestId('status-dot')).toBeInTheDocument();
    expect(screen.getByText('EMS status: warning')).toBeInTheDocument();
  });

  test('renders canvas element for sparkline', () => {
    const canvas = document.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
    expect(screen.getByText('EMS primary metric sparkline is trending up.')).toBeInTheDocument();
  });

  test('applies data-subsystem attribute', () => {
    const card = document.querySelector('[data-subsystem="ems"]');
    expect(card).toBeInTheDocument();
  });
});
