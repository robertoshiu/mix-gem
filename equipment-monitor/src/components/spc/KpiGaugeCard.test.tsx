import { render, screen } from '@testing-library/react';
import { KpiGaugeCard } from './KpiGaugeCard';
import type { SpcMeasurement } from '@/lib/mes-types';

// ResizeObserver needed by recharts ResponsiveContainer
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// matchMedia needed by useReducedMotion in animation.ts
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

const baseMeasurement: SpcMeasurement = {
  id: 'm1',
  lotId: 'LOT-001',
  waferNumber: 5,
  timestamp: new Date(),
  cd: 45.0,
  cdu: 2.0,
  ovl_x: 0.0,
  ovl_y: 0.0,
  ler: 3.0,
};

describe('KpiGaugeCard', () => {
  it('renders 5 gauge skeletons when no measurement provided', () => {
    render(
      <KpiGaugeCard
        latest={null}
        activeParam="cd"
        onParamSelect={jest.fn()}
        hasViolation={false}
      />,
    );

    expect(screen.getByTestId('kpi-gauge-cd')).toBeInTheDocument();
    expect(screen.getByTestId('kpi-gauge-cdu')).toBeInTheDocument();
    expect(screen.getByTestId('kpi-gauge-ovl_x')).toBeInTheDocument();
    expect(screen.getByTestId('kpi-gauge-ovl_y')).toBeInTheDocument();
    expect(screen.getByTestId('kpi-gauge-ler')).toBeInTheDocument();
  });

  it('renders gauge cards with parameter labels when measurement provided', () => {
    render(
      <KpiGaugeCard
        latest={baseMeasurement}
        activeParam="cd"
        onParamSelect={jest.fn()}
        hasViolation={false}
      />,
    );

    expect(screen.getByText('Critical Dimension')).toBeInTheDocument();
    expect(screen.getByText('CD Uniformity')).toBeInTheDocument();
    expect(screen.getByText('Overlay X')).toBeInTheDocument();
    expect(screen.getByText('Overlay Y')).toBeInTheDocument();
    expect(screen.getByText('Line Edge Roughness')).toBeInTheDocument();
  });
});
