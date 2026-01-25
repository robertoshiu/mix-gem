import { render } from '@testing-library/react';
import { StatusIndicator } from './status-indicator';

describe('StatusIndicator Touch Targets', () => {
  it('should have minimum 44x44px clickable area for small size', () => {
    const { container } = render(
      <StatusIndicator status="process" size="sm" />
    );

    const indicator = container.querySelector('[data-testid="status-indicator"]');
    // We can't easily check computed style in jsdom this way for class-based styles without mounting styles,
    // but we can check if the classes are present.
    expect(indicator?.className).toMatch(/min-w-\[44px\]/);
    expect(indicator?.className).toMatch(/min-h-\[44px\]/);
  });

  it('should show label by default for accessibility', () => {
    const { container } = render(
      <StatusIndicator status="process" />
    );

    expect(container.textContent).toContain('Process');
  });
});
