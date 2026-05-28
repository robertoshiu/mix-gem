import { render, screen } from '@testing-library/react';

// recharts' ResponsiveContainer needs ResizeObserver, which jsdom lacks.
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

import { FilmStackPanel } from '../FilmStackPanel';
import type { FilmLayer } from '@/lib/analytics/types';

// Render the recharts tree (charts are behind a hydration gate).
jest.mock('@/hooks/use-client-ready', () => ({ useClientReady: () => true }));

describe('FilmStackPanel', () => {
  const layers: FilmLayer[] = [
    { material: 'SiO₂', thickness: 100, color: '#60A5FA' },
    { material: 'Cu', thickness: 150, color: '#FB923C' },
  ];

  test('renders a recharts chart (not canvas) and summary', () => {
    const { container } = render(<FilmStackPanel filmStack={layers} />);
    expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument();
    expect(container.querySelector('canvas')).toBeNull();
    expect(screen.getByText(/250/)).toBeInTheDocument();
  });

  test('renders layer labels with real Unicode glyphs', () => {
    const { container } = render(<FilmStackPanel filmStack={layers} />);
    expect(screen.getAllByText(/SiO₂/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Cu/).length).toBeGreaterThanOrEqual(1);
    // Regression: the subscript renders as a glyph, never as a literal escape.
    expect(container.textContent ?? '').not.toContain('\\u2082');
  });
});
