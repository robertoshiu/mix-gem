import { render, screen } from '@testing-library/react';
import { KpiStrip } from './KpiStrip';
import type { SpcMeasurement } from '@/lib/mes-types';

const baseMeasurement: SpcMeasurement = {
  id: 'm1', lotId: 'LOT-001', waferNumber: 5, timestamp: new Date(),
  cd: 45.0, cdu: 2.0, ovl_x: 0.0, ovl_y: 0.0, ler: 3.0,
};

describe('KpiStrip', () => {
  it('renders all 5 parameter labels', () => {
    render(<KpiStrip latest={baseMeasurement} hasViolation={false} />);
    expect(screen.getByText('Critical Dimension')).toBeInTheDocument();
    expect(screen.getByText('CD Uniformity')).toBeInTheDocument();
    expect(screen.getByText('Overlay X')).toBeInTheDocument();
    expect(screen.getByText('Overlay Y')).toBeInTheDocument();
    expect(screen.getByText('Line Edge Roughness')).toBeInTheDocument();
  });

  it('shows OK when no violation', () => {
    render(<KpiStrip latest={baseMeasurement} hasViolation={false} />);
    expect(screen.getAllByText('OK').length).toBeGreaterThan(0);
  });

  it('shows CD value formatted to 2 decimal places', () => {
    render(<KpiStrip latest={{ ...baseMeasurement, cd: 45.123 }} hasViolation={false} />);
    expect(screen.getByText('45.12')).toBeInTheDocument();
  });

  it('renders skeleton when no measurement provided', () => {
    render(<KpiStrip latest={null} hasViolation={false} />);
    expect(screen.getByTestId('kpi-strip-skeleton')).toBeInTheDocument();
  });
});