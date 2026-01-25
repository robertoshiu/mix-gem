import { render } from '@testing-library/react';
import { Button } from './button';

describe('Button Touch Targets', () => {
  it('should have 48px height for default size', () => {
    const { container } = render(<Button>Click me</Button>);
    const button = container.querySelector('button');
    expect(button?.className).toMatch(/h-12/);
  });

  it('should have 56px height for large size', () => {
    const { container } = render(<Button size="lg">Click me</Button>);
    const button = container.querySelector('button');
    expect(button?.className).toMatch(/h-14/);
  });
});
