'use client';

import { motion } from 'framer-motion';
import { useMesSpcStore } from '@/stores/mes-spc-store';
import { cn } from '@/lib/utils';
import {
  Droplets,
  Sun,
  FlaskConical,
  Microscope,
  BarChart3,
  ChevronRight,
} from 'lucide-react';
import { fadeIn, useReducedMotion } from '@/lib/animation';

const FLOW_STEPS = [
  { id: 'coat', label: 'COAT', equipment: 'COAT-01', icon: Droplets },
  { id: 'expose', label: 'EXPOSE', equipment: 'LITHO-01', icon: Sun },
  { id: 'develop', label: 'DEVELOP', equipment: 'DEV-01', icon: FlaskConical },
  { id: 'metrology', label: 'METROLOGY', equipment: 'METRO-01', icon: Microscope },
  { id: 'spc', label: 'SPC EVAL', equipment: 'SPC System', icon: BarChart3 },
] as const;

interface StepDisplay {
  iconColor: string;
  badgeText: string;
  badgeColor: string;
  isActive: boolean;
}

function getStepDisplay(equipmentState: 'idle' | 'processing' | 'inhibited'): StepDisplay {
  switch (equipmentState) {
    case 'processing':
      return {
        iconColor: 'var(--smartfactory-accent-blue)',
        badgeText: 'Running',
        badgeColor: 'var(--smartfactory-status-green)',
        isActive: true,
      };
    case 'inhibited':
      return {
        iconColor: 'var(--smartfactory-status-red)',
        badgeText: 'Inhibited',
        badgeColor: 'var(--smartfactory-status-red)',
        isActive: false,
      };
    default:
      return {
        iconColor: 'var(--smartfactory-text-muted)',
        badgeText: 'Idle',
        badgeColor: 'var(--smartfactory-status-amber)',
        isActive: false,
      };
  }
}

export function ProcessFlow() {
  const { equipmentState } = useMesSpcStore();
  const reduced = useReducedMotion();
  const display = getStepDisplay(equipmentState);
  const fadeInProps = reduced ? {} : { variants: fadeIn, initial: 'initial' as const, animate: 'animate' as const };

  return (
    <div
      data-testid="process-flow"
      className="flex items-center gap-0 overflow-x-auto p-3 bg-[var(--smartfactory-surface-card)] rounded border border-[var(--smartfactory-border-default)]"
    >
      {FLOW_STEPS.map((step, index) => (
        <motion.div key={step.id} className="flex items-center gap-0" {...fadeInProps}>
          <div
            className={cn(
              'min-w-[90px] p-2 text-center rounded-lg border bg-[var(--smartfactory-surface-card)] border-[var(--smartfactory-border-default)]',
              display.isActive && 'border-l-2 border-l-[var(--smartfactory-border-active)]'
            )}
          >
            <div className="flex justify-center mb-1">
              <step.icon
                size={18}
                color={display.iconColor}
                aria-hidden="true"
              />
            </div>
            <div className="text-[11px] font-semibold uppercase text-[var(--smartfactory-text-primary)]">
              {step.label}
            </div>
            <div className="text-[10px] text-[var(--smartfactory-text-secondary)]">
              {step.equipment}
            </div>
            <div
              className="text-[9px] font-medium mt-0.5"
              style={{ color: display.badgeColor }}
            >
              {display.badgeText}
            </div>
          </div>

          {index < FLOW_STEPS.length - 1 && (
            <ChevronRight
              size={16}
              color="var(--smartfactory-text-muted)"
              className="shrink-0 mx-1"
              aria-hidden="true"
            />
          )}
        </motion.div>
      ))}
    </div>
  );
}
