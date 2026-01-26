import { render, screen, fireEvent } from '@testing-library/react';
import { TabsNavigation } from './tabs-navigation';

describe('TabsNavigation', () => {
  const mockTabs = [
    { id: 'equipment', label: 'Equipment', content: <div>Equipment Content</div> },
    { id: 'gauges', label: 'Gauges', content: <div>Gauges Content</div> },
    { id: 'alerts', label: 'Alerts', content: <div>Alerts Content</div> },
  ];

  it('should render all tab buttons', () => {
    render(<TabsNavigation tabs={mockTabs} />);

    expect(screen.getByRole('tab', { name: 'Equipment' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Gauges' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Alerts' })).toBeInTheDocument();
  });

  it('should have minimum 44px height on tab buttons', () => {
    render(<TabsNavigation tabs={mockTabs} />);

    const equipmentTab = screen.getByRole('tab', { name: 'Equipment' });
    expect(equipmentTab.className).toMatch(/min-h-\[44px\]/);
  });

  it('should show first tab content by default', () => {
    render(<TabsNavigation tabs={mockTabs} />);

    expect(screen.getByText('Equipment Content')).toBeVisible();
    expect(screen.queryByText('Gauges Content')).not.toBeVisible();
  });

  it('should switch content when tab is clicked', () => {
    render(<TabsNavigation tabs={mockTabs} />);

    const gaugesTab = screen.getByRole('tab', { name: 'Gauges' });
    fireEvent.click(gaugesTab);

    expect(screen.getByText('Gauges Content')).toBeVisible();
    expect(screen.queryByText('Equipment Content')).not.toBeVisible();
  });

  it('should apply active styles to selected tab', () => {
    render(<TabsNavigation tabs={mockTabs} />);

    const equipmentTab = screen.getByRole('tab', { name: 'Equipment' });
    expect(equipmentTab.className).toMatch(/border-blue-500/);
    expect(equipmentTab.className).toMatch(/text-blue-400/);
  });

  it('should apply inactive styles to non-selected tabs', () => {
    render(<TabsNavigation tabs={mockTabs} />);

    const gaugesTab = screen.getByRole('tab', { name: 'Gauges' });
    expect(gaugesTab.className).toMatch(/text-slate-400/);
  });

  it('should have proper ARIA attributes', () => {
    render(<TabsNavigation tabs={mockTabs} />);

    const equipmentTab = screen.getByRole('tab', { name: 'Equipment' });
    expect(equipmentTab).toHaveAttribute('aria-selected', 'true');
    expect(equipmentTab).toHaveAttribute('aria-controls', 'tabpanel-equipment');

    const tabpanel = screen.getByRole('tabpanel');
    expect(tabpanel).toHaveAttribute('id', 'tabpanel-equipment');
  });

  it('should support custom defaultTab', () => {
    render(<TabsNavigation tabs={mockTabs} defaultTab="alerts" />);

    expect(screen.getByText('Alerts Content')).toBeVisible();
    expect(screen.queryByText('Equipment Content')).not.toBeVisible();

    const alertsTab = screen.getByRole('tab', { name: 'Alerts' });
    expect(alertsTab).toHaveAttribute('aria-selected', 'true');
  });

  it('should only display on MD viewport (hidden on mobile and desktop)', () => {
    const { container } = render(<TabsNavigation tabs={mockTabs} />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toMatch(/hidden md:block lg:hidden/);
  });

  it('should return null when no tabs provided', () => {
    const { container } = render(<TabsNavigation tabs={[]} />);

    expect(container.firstChild).toBeNull();
  });

  it('should have proper tablist role and label', () => {
    render(<TabsNavigation tabs={mockTabs} />);

    const tablist = screen.getByRole('tablist', { name: 'Dashboard sections' });
    expect(tablist).toBeInTheDocument();
  });
});
