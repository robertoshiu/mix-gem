import { render, screen, fireEvent } from '@testing-library/react';
import { AnalyticsTabBar } from '../AnalyticsTabBar';

describe('AnalyticsTabBar', () => {
  test('renders all 6 tab buttons', () => {
    render(<AnalyticsTabBar activeTab="yield" onTabChange={() => {}} />);
    expect(screen.getByRole('tab', { name: /VPP/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /APC R2R/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Yield Forecast/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Reliability/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Cross-Process Opt/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Multi-Fab/i })).toBeInTheDocument();
  });

  test('active tab has aria-selected=true', () => {
    render(<AnalyticsTabBar activeTab="apc" onTabChange={() => {}} />);
    expect(screen.getByRole('tab', { name: /APC R2R/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: /Yield Forecast/i })).toHaveAttribute('aria-selected', 'false');
  });

  test('clicking tab calls onTabChange', () => {
    const onChange = jest.fn();
    render(<AnalyticsTabBar activeTab="yield" onTabChange={onChange} />);
    fireEvent.click(screen.getByRole('tab', { name: /Reliability/i }));
    expect(onChange).toHaveBeenCalledWith('reliability');
  });
});
