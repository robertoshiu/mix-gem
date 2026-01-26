import { render } from '@testing-library/react';
import { GaugeCard } from './gauge-card';

describe('GaugeCard Accessibility', () => {
  it('should have aria-live region for value updates', () => {
    const { container } = render(
      <GaugeCard
        parameter={{
            name: "Temperature",
            value: 22.5,
            unit: "°C",
            nominal: 20,
            tolerance: 5,
            min: 0,
            max: 50,
            lsl: 18,
            usl: 25,
            timestamp: new Date()
        }}
      />
    );

    const liveRegion = container.querySelector('[aria-live]');
    expect(liveRegion).toHaveAttribute('aria-live', 'polite');
  });

  it('should announce alarm state changes', () => {
    const { container, rerender } = render(
      <GaugeCard
        parameter={{
            name: "Temperature",
            value: 22.5,
            unit: "°C",
            nominal: 20,
            tolerance: 5,
            min: 0,
            max: 50,
            lsl: 18,
            usl: 25,
            timestamp: new Date()
        }}
      />
    );

    rerender(
      <GaugeCard
        parameter={{
            name: "Temperature",
            value: 26,
            unit: "°C",
            nominal: 20,
            tolerance: 5,
            min: 0,
            max: 50,
            lsl: 18,
            usl: 25,
            timestamp: new Date()
        }}
      />
    );

    const liveRegion = container.querySelector('[aria-live]');
    expect(liveRegion?.textContent).toContain('Temperature alarm');
  });
});
