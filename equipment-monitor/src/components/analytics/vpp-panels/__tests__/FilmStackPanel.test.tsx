import { render, screen } from '@testing-library/react';
import { FilmStackPanel } from '../FilmStackPanel';
import type { FilmLayer } from '@/lib/analytics/types';

describe('FilmStackPanel', () => {
  const layers: FilmLayer[] = [
    { material: 'SiO₂', thickness: 100, color: '#60A5FA' },
    { material: 'Cu', thickness: 150, color: '#FB923C' },
  ];

  test('renders canvas and summary', () => {
    render(<FilmStackPanel filmStack={layers} />);
    expect(screen.getByTestId('film-stack-canvas')).toBeInTheDocument();
    expect(screen.getByText(/250/)).toBeInTheDocument();
  });

  test('renders layer labels', () => {
    render(<FilmStackPanel filmStack={layers} />);
    expect(screen.getByText(/SiO₂/)).toBeInTheDocument();
    expect(screen.getAllByText(/Cu/).length).toBeGreaterThanOrEqual(1);
  });
});
