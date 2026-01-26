import { render, fireEvent } from '@testing-library/react';
import { ChartSyncProvider, useChartSync } from './chart-sync-provider';

function TestChart({ id }: { id: string }) {
  const { activeIndex, setActiveIndex } = useChartSync();
  return (
    <div data-testid={`chart-${id}`} onMouseMove={() => setActiveIndex(5)}>
      Active: {activeIndex}
    </div>
  );
}

describe('ChartSyncProvider', () => {
  it('should sync activeIndex across charts', () => {
    const { getByTestId } = render(
      <ChartSyncProvider>
        <TestChart id="1" />
        <TestChart id="2" />
      </ChartSyncProvider>
    );

    const chart1 = getByTestId('chart-1');
    fireEvent.mouseMove(chart1);

    expect(chart1.textContent).toBe('Active: 5');
    expect(getByTestId('chart-2').textContent).toBe('Active: 5');
  });
});
