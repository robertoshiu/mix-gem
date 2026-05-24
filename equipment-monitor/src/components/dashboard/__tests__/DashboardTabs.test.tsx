import { render, screen, fireEvent } from '@testing-library/react';
import { DashboardTabs } from '../DashboardTabs';

describe('DashboardTabs', () => {
  it('renders both tab buttons', () => {
    render(
      <DashboardTabs activeTab="fab-flow" onTabChange={jest.fn()}>
        <div>content</div>
      </DashboardTabs>,
    );
    expect(screen.getByRole('tab', { name: /fab flow/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /facility systems/i })).toBeInTheDocument();
  });

  it('marks active tab with aria-selected="true"', () => {
    const { rerender } = render(
      <DashboardTabs activeTab="fab-flow" onTabChange={jest.fn()}>
        <div>content</div>
      </DashboardTabs>,
    );
    expect(screen.getByRole('tab', { name: /fab flow/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: /facility systems/i })).toHaveAttribute('aria-selected', 'false');

    rerender(
      <DashboardTabs activeTab="facility" onTabChange={jest.fn()}>
        <div>content</div>
      </DashboardTabs>,
    );
    expect(screen.getByRole('tab', { name: /fab flow/i })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('tab', { name: /facility systems/i })).toHaveAttribute('aria-selected', 'true');
  });

  it('calls onTabChange when clicking inactive tab', () => {
    const onTabChange = jest.fn();
    render(
      <DashboardTabs activeTab="fab-flow" onTabChange={onTabChange}>
        <div>content</div>
      </DashboardTabs>,
    );
    fireEvent.click(screen.getByRole('tab', { name: /facility systems/i }));
    expect(onTabChange).toHaveBeenCalledWith('facility');
    expect(onTabChange).toHaveBeenCalledTimes(1);
  });

  it('supports keyboard navigation with arrow keys', () => {
    const onTabChange = jest.fn();
    render(
      <DashboardTabs activeTab="fab-flow" onTabChange={onTabChange}>
        <div>content</div>
      </DashboardTabs>,
    );
    fireEvent.keyDown(screen.getByRole('tablist', { name: /dashboard views/i }), {
      key: 'ArrowRight',
    });
    expect(onTabChange).toHaveBeenCalledWith('facility');
  });

  it('associates tabs with the active tabpanel', () => {
    render(
      <DashboardTabs activeTab="facility" onTabChange={jest.fn()}>
        <div>content</div>
      </DashboardTabs>,
    );
    const activeTab = screen.getByRole('tab', { name: /facility systems/i });
    const panel = screen.getByRole('tabpanel');
    expect(activeTab).toHaveAttribute('aria-controls', panel.id);
    expect(panel).toHaveAttribute('aria-labelledby', activeTab.id);
  });

  it('renders children', () => {
    render(
      <DashboardTabs activeTab="fab-flow" onTabChange={jest.fn()}>
        <div data-testid="child-content">Hello</div>
      </DashboardTabs>,
    );
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
