import { render, screen } from '@testing-library/react';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: () => '/mes/spc',
}));

// Mock next/link
jest.mock('next/link', () => {
  return function MockLink({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) {
    return <a href={href} {...props}>{children}</a>;
  };
});

import { MesNavBar } from './MesNavBar';

describe('MesNavBar', () => {
  it('renders all four nav items', () => {
    render(<MesNavBar />);
    expect(screen.getByText('Equipment')).toBeInTheDocument();
    expect(screen.getByText('Lot Tracker')).toBeInTheDocument();
    expect(screen.getByText('Recipe Manager')).toBeInTheDocument();
    expect(screen.getByText('SPC Dashboard')).toBeInTheDocument();
  });

  it('marks the active route with aria-current', () => {
    render(<MesNavBar />);
    const active = screen.getByRole('link', { name: 'SPC Dashboard' });
    expect(active).toHaveAttribute('aria-current', 'page');
  });
});
