import { render, screen } from '@testing-library/react';
import { Button } from './button';

describe('Button Touch Targets', () => {
  describe('Touch target size compliance (48px minimum)', () => {
    it('should have 48px height for default size (h-12)', () => {
      render(<Button size="default">Default Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-12'); // 48px height
    });

    it('should have 56px height for large size (h-14)', () => {
      render(<Button size="lg">Large Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-14'); // 56px height
    });

    it('should have 48x48px dimensions for icon size (h-12 w-12)', () => {
      render(
        <Button size="icon" aria-label="Icon button">
          <svg />
        </Button>
      );
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-12'); // 48px height
      expect(button).toHaveClass('w-12'); // 48px width
    });

    it('should have 40px height for small size (h-10) for secondary actions', () => {
      render(<Button size="sm">Small Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-10'); // 40px height (acceptable for secondary actions)
    });
  });

  describe('Touch target defaults', () => {
    it('should use default size (48px) when no size prop provided', () => {
      render(<Button>No Size Prop</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-12'); // Default to 48px
    });
  });

  describe('Touch target consistency across variants', () => {
    it('should maintain 48px height for primary variant', () => {
      render(<Button variant="default">Primary</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-12');
    });

    it('should maintain 48px height for destructive variant', () => {
      render(<Button variant="destructive">Delete</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-12');
    });

    it('should maintain 48px height for outline variant', () => {
      render(<Button variant="outline">Cancel</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-12');
    });

    it('should maintain 48px height for secondary variant', () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-12');
    });

    it('should maintain 48px height for ghost variant', () => {
      render(<Button variant="ghost">Ghost</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-12');
    });
  });

  describe('Touch target for primary CTAs', () => {
    it('should use large size (56px) for prominent call-to-action buttons', () => {
      render(
        <Button size="lg" variant="default">
          Start Process
        </Button>
      );
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-14'); // 56px for primary CTAs
      expect(button).toHaveClass('bg-blue-500'); // Verify it's a primary button
    });
  });
});
