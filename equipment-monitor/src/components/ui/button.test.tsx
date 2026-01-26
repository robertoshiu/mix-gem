import { render } from '@testing-library/react';
import { Button } from './button';

describe('Button', () => {
  it('should use blue-500 for primary variant', () => {
    const { container } = render(<Button variant="default">Click me</Button>);
    const button = container.querySelector('button');
    expect(button?.className).toMatch(/bg-blue-500/);
  });

  it('should use blue-400 on hover for primary variant', () => {
    const { container } = render(<Button variant="default">Click me</Button>);
    const button = container.querySelector('button');
    expect(button?.className).toMatch(/hover:bg-blue-400/);
  });
});
