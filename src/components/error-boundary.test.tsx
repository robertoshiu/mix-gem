import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from './error-boundary';

function ThrowError() {
  throw new Error('Test error');
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  it('should catch errors and display fallback UI', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Something went wrong/)).toBeInTheDocument();
  });

  it('should display error message in dev mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Test error/)).toBeInTheDocument();
    
    process.env.NODE_ENV = originalEnv;
  });
});
