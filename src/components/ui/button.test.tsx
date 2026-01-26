import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './button';

describe('Button', () => {
  describe('colors', () => {
    it('should use blue-500 for primary variant', () => {
      render(<Button variant="default">Click me</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-blue-500');
    });

    it('should use blue-400 on hover for primary variant', () => {
      render(<Button variant="default">Click me</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('hover:bg-blue-400');
    });

    it('should use red-500 for destructive variant', () => {
      render(<Button variant="destructive">Delete</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-red-500');
    });

    it('should use slate colors for outline variant', () => {
      render(<Button variant="outline">Cancel</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('border-slate-700');
      expect(button).toHaveClass('bg-slate-900');
    });
  });

  describe('sizes', () => {
    it('should apply default height', () => {
      render(<Button size="default">Default</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-12');
    });

    it('should apply large height', () => {
      render(<Button size="lg">Large</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-14');
    });
  });

  describe('states', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should not call onClick when disabled', () => {
      const handleClick = jest.fn();
      render(<Button disabled onClick={handleClick}>Disabled</Button>);
      const button = screen.getByRole('button');
      fireEvent.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('interactions', () => {
    it('should call onClick handler when clicked', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Click me</Button>);
      const button = screen.getByRole('button');
      fireEvent.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });
});
