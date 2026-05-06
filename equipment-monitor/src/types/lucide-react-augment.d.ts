/**
 * Augment lucide-react types for icons missing from the main export.
 * The lucide-react v0.563.0 type definitions have an extremely long
 * export statement that TypeScript cannot parse fully.
 */
import "lucide-react";

type LucideIconType = import("react").ForwardRefExoticComponent<
  Omit<import("lucide-react").LucideProps, "ref"> &
    import("react").RefAttributes<SVGSVGElement>
>;

declare module "lucide-react" {
  export const Activity: LucideIconType;
  export const AlertCircle: LucideIconType;
  export const AlertTriangle: LucideIconType;
  export const ArrowDown: LucideIconType;
  export const ArrowRight: LucideIconType;
  export const ArrowUp: LucideIconType;
  export const ArrowUpDown: LucideIconType;
  export const BarChart3: LucideIconType;
  export const Bell: LucideIconType;
  export const BellOff: LucideIconType;
  export const Building: LucideIconType;
  export const Check: LucideIconType;
  export const CheckCheck: LucideIconType;
  export const CheckCircle: LucideIconType;
  export const ChevronRight: LucideIconType;
  export const ChevronUp: LucideIconType;
  export const Clock: LucideIconType;
  export const Droplets: LucideIconType;
  export const FileText: LucideIconType;
  export const Flame: LucideIconType;
  export const FlaskConical: LucideIconType;
  export const Info: LucideIconType;
  export const Layers: LucideIconType;
  export const Lightbulb: LucideIconType;
  export const Maximize: LucideIconType;
  export const Microscope: LucideIconType;
  export const Pause: LucideIconType;
  export const Play: LucideIconType;
  export const RotateCw: LucideIconType;
  export const Search: LucideIconType;
  export const Settings: LucideIconType;
  export const Shield: LucideIconType;
  export const Sun: LucideIconType;
  export const Thermometer: LucideIconType;
  export const TrendingUp: LucideIconType;
  export const Upload: LucideIconType;
  export const Wind: LucideIconType;
  export const X: LucideIconType;
  export const XCircle: LucideIconType;
  export const Zap: LucideIconType;
  export const Beaker: LucideIconType;
  export const TestTube: LucideIconType;
}
