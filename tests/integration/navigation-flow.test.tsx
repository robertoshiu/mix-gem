import { render, screen } from '@testing-library/react';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: () => '/mes/spc',
}));

// Mock next/link
jest.mock('next/link', () => {
  return function MockLink({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  }) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  };
});

import { MesNavBar } from '@/components/mes/MesNavBar';

describe('MES Navigation Flow', () => {
  it('renders all four MES nav links with correct hrefs', () => {
    render(<MesNavBar />);

    // Two "Equipment" links exist (/ and /mes/equipment) — pick the MES one
    const equipmentLinks = screen.getAllByRole('link', { name: 'Equipment' });
    expect(equipmentLinks[1]).toHaveAttribute('href', '/mes/equipment');

    const lotsLink = screen.getByRole('link', { name: 'Lot Tracker' });
    expect(lotsLink).toHaveAttribute('href', '/mes/lots');

    const recipesLink = screen.getByRole('link', { name: 'Recipe Manager' });
    expect(recipesLink).toHaveAttribute('href', '/mes/recipes');

    const spcLink = screen.getByRole('link', { name: 'SPC Dashboard' });
    expect(spcLink).toHaveAttribute('href', '/mes/spc');
  });

  it('marks the active route with aria-current=page', () => {
    render(<MesNavBar />);
    const activeLink = screen.getByRole('link', { name: 'SPC Dashboard' });
    expect(activeLink).toHaveAttribute('aria-current', 'page');
  });
});
