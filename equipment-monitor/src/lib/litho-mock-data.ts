export type LithoDashboardKind = 'overlay' | 'cd' | 'dose';

export interface WaferSite {
  id: string;
  x: number;
  y: number;
  value: number;
  dx?: number;
  dy?: number;
}

export interface LithoTrendPoint {
  lot: string;
  value: number;
  target: number;
  lcl: number;
  ucl: number;
}

export interface LithoMetric {
  name: string;
  value: number;
  unit: string;
  lsl: number;
  usl: number;
}

export interface LithoDashboardData {
  title: string;
  subtitle: string;
  waferMode: LithoDashboardKind;
  unit: string;
  target: number;
  lcl: number;
  ucl: number;
  sites: WaferSite[];
  trend: LithoTrendPoint[];
  metrics: LithoMetric[];
}

const SITE_GRID = [-4, -3, -2, -1, 0, 1, 2, 3, 4];

function round(value: number, digits = 2) {
  return Number(value.toFixed(digits));
}

function generateSites(kind: LithoDashboardKind): WaferSite[] {
  const sites: WaferSite[] = [];
  for (const row of SITE_GRID) {
    for (const col of SITE_GRID) {
      const radius = Math.sqrt(row * row + col * col);
      if (radius > 4.4) continue;

      const swirl = Math.sin(row * 0.9) + Math.cos(col * 0.7);
      const edge = radius / 4.4;
      if (kind === 'overlay') {
        const dx = round(col * 0.22 + Math.sin(row) * 0.55, 2);
        const dy = round(row * -0.18 + Math.cos(col) * 0.48, 2);
        sites.push({ id: `${row}:${col}`, x: col / 4.6, y: row / 4.6, value: round(Math.hypot(dx, dy), 2), dx, dy });
      } else if (kind === 'cd') {
        sites.push({ id: `${row}:${col}`, x: col / 4.6, y: row / 4.6, value: round(45 + swirl * 0.55 + edge * 0.65, 2) });
      } else {
        sites.push({ id: `${row}:${col}`, x: col / 4.6, y: row / 4.6, value: round(100 + swirl * 0.18 - edge * 0.28, 2) });
      }
    }
  }
  return sites;
}

function generateTrend(kind: LithoDashboardKind, target: number, lcl: number, ucl: number): LithoTrendPoint[] {
  return Array.from({ length: 32 }, (_, index) => {
    const drift = Math.sin(index / 4) * (kind === 'dose' ? 0.18 : kind === 'overlay' ? 0.32 : 0.42);
    const step = index > 23 ? (kind === 'dose' ? 0.08 : 0.18) : 0;
    return {
      lot: `L${(6240 + index).toString()}`,
      value: round(target + drift + step + Math.cos(index / 2.8) * (kind === 'dose' ? 0.05 : 0.12), 2),
      target,
      lcl,
      ucl,
    };
  });
}

export function getLithoDashboardData(kind: LithoDashboardKind): LithoDashboardData {
  if (kind === 'overlay') {
    return {
      title: 'Overlay Control',
      subtitle: 'Vector residuals across 49 sampled sites with lot-to-lot 3-sigma drift',
      waferMode: kind,
      unit: 'nm',
      target: 0,
      lcl: -3,
      ucl: 3,
      sites: generateSites(kind),
      trend: generateTrend(kind, 0.8, 0, 3),
      metrics: [
        { name: 'Overlay X Mean', value: 0.42, unit: 'nm', lsl: -3, usl: 3 },
        { name: 'Overlay Y Mean', value: -0.31, unit: 'nm', lsl: -3, usl: 3 },
        { name: 'Overlay 3 Sigma', value: 2.1, unit: 'nm', lsl: 0, usl: 3 },
      ],
    };
  }

  if (kind === 'cd') {
    return {
      title: 'CD Uniformity',
      subtitle: 'Across-wafer CD map with edge signature and lot trend control limits',
      waferMode: kind,
      unit: 'nm',
      target: 45,
      lcl: 42,
      ucl: 48,
      sites: generateSites(kind),
      trend: generateTrend(kind, 45, 42, 48),
      metrics: [
        { name: 'CD Mean', value: 45.3, unit: 'nm', lsl: 42, usl: 48 },
        { name: 'CDU Range', value: 2.4, unit: 'nm', lsl: 0, usl: 3 },
        { name: 'CD Bias', value: 0.3, unit: 'nm', lsl: -1.5, usl: 1.5 },
      ],
    };
  }

  return {
    title: 'Dose Control',
    subtitle: 'Dose uniformity contour bands with exposure-to-target error trend',
    waferMode: kind,
    unit: '%',
    target: 100,
    lcl: 99,
    ucl: 101,
    sites: generateSites(kind),
    trend: generateTrend(kind, 100, 99, 101),
    metrics: [
      { name: 'Dose Mean', value: 100.2, unit: '%', lsl: 99, usl: 101 },
      { name: 'Uniformity', value: 0.7, unit: '%', lsl: 0, usl: 1.5 },
      { name: 'Target Error', value: 0.2, unit: '%', lsl: -1, usl: 1 },
    ],
  };
}
