import type { FC, SVGProps } from 'react';

type LucideIcon = FC<SVGProps<SVGSVGElement>>;

declare module 'lucide-react' {
  // Missing type definitions for icons in lucide-react v0.563.0
  export const Droplets: LucideIcon;
  export const FlaskConical: LucideIcon;
  export const Microscope: LucideIcon;
  export const BarChart3: LucideIcon;
  export const CheckCheck: LucideIcon;
  export const BellOff: LucideIcon;
  export const RotateCw: LucideIcon;
  export const Maximize: LucideIcon;
}
