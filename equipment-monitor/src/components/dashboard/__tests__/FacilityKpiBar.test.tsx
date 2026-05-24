// src/components/dashboard/__tests__/FacilityKpiBar.test.tsx

import { render, screen } from '@testing-library/react';
import { FacilityKpiBar } from '../FacilityKpiBar';
import type { FacilityKpis } from '@/stores/dashboard-facility-store';

const mockKpis: FacilityKpis = {
  comfortIndex: 92.3,
  gasSafety: 97.1,
  pue: 1.38,
  systemUptime: 80,
  energyLoad: 847,
  activeAlarms: { warnings: 2, criticals: 0 },
};

describe('FacilityKpiBar', () => {
  beforeEach(() => {
    render(<FacilityKpiBar kpis={mockKpis} />);
  });

  test('renders Comfort Index value', () => {
    expect(screen.getByText('92.3')).toBeInTheDocument();
    expect(screen.getByText(/Comfort/i)).toBeInTheDocument();
  });

  test('renders Gas Safety value', () => {
    expect(screen.getByText('97.1')).toBeInTheDocument();
    expect(screen.getByText(/Gas Safety/i)).toBeInTheDocument();
  });

  test('renders PUE value', () => {
    expect(screen.getByText('1.38')).toBeInTheDocument();
    expect(screen.getByText(/PUE/i)).toBeInTheDocument();
  });

  test('renders System Uptime value', () => {
    expect(screen.getByText('80')).toBeInTheDocument();
    expect(screen.getByText(/Uptime/i)).toBeInTheDocument();
  });

  test('renders Energy Load value', () => {
    expect(screen.getByText('847')).toBeInTheDocument();
    expect(screen.getByText(/Energy/i)).toBeInTheDocument();
  });

  test('renders Active Alarms', () => {
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText(/Alarms/i)).toBeInTheDocument();
  });

  test('renders 6 KPI cards', () => {
    const cards = screen.getAllByTestId('kpi-card');
    expect(cards).toHaveLength(6);
  });
});
