'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { generateWaferMap } from '@/lib/mes-mock-data';
import type { WaferDie } from '@/lib/mes-types';
import { scaleIn, useReducedMotion } from '@/lib/animation';

const STATUS_COLORS: Record<WaferDie['status'], string> = {
  pass: 'var(--smartfactory-status-green)',
  fail: 'var(--smartfactory-status-red)',
  retest: 'var(--smartfactory-status-amber)',
  not_tested: 'var(--smartfactory-text-muted)',
};

const STATUS_LABELS: Record<WaferDie['status'], string> = {
  pass: 'Pass',
  fail: 'Fail',
  retest: 'Retest',
  not_tested: 'Not Tested',
};

const CELL_SIZE = 14;
const CELL_GAP = 1;

interface WaferBinMapProps {
  lotId?: string;
}

export function WaferBinMap({ lotId = 'A03' }: WaferBinMapProps) {
  const dies = useMemo(() => generateWaferMap(), []);
  const reduced = useReducedMotion();
  const scaleInProps = reduced ? {} : { variants: scaleIn, initial: 'initial' as const, animate: 'animate' as const };

  const { maxRow, maxCol, counts } = useMemo(() => {
    const maxRow = Math.max(...dies.map((d) => d.row));
    const maxCol = Math.max(...dies.map((d) => d.col));
    const counts = dies.reduce(
      (acc, d) => {
        acc[d.status] = (acc[d.status] || 0) + 1;
        return acc;
      },
      {} as Record<WaferDie['status'], number>,
    );
    return { maxRow, maxCol, counts };
  }, [dies]);

  const svgWidth = (maxCol + 1) * (CELL_SIZE + CELL_GAP) + CELL_GAP;
  const svgHeight = (maxRow + 1) * (CELL_SIZE + CELL_GAP) + CELL_GAP;

  return (
    <motion.div {...scaleInProps}>
      <div
        data-testid="wafer-bin-map"
        className="bg-[var(--smartfactory-surface-card)] rounded border border-[var(--smartfactory-border-default)] p-4"
      >
        <h3 className="text-sm font-semibold text-[var(--smartfactory-text-primary)] mb-4">
          Wafer Map &mdash; Lot {lotId}
        </h3>

        <div className="flex items-start gap-6">
          {/* SVG Wafer Map */}
          <div className="flex-shrink-0">
            <svg
              width={svgWidth}
              height={svgHeight}
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="block"
              role="img"
              aria-label="Wafer bin map showing die status distribution"
            >
              {/* Circular boundary hint */}
              <circle
                cx={svgWidth / 2}
                cy={svgHeight / 2}
                r={(maxCol / 2) * (CELL_SIZE + CELL_GAP)}
                fill="none"
                stroke="var(--smartfactory-border-default)"
                strokeWidth="1"
                strokeDasharray="2 2"
                opacity="0.3"
              />
              {dies.map((die) => {
                const x = die.col * (CELL_SIZE + CELL_GAP) + CELL_GAP;
                const y = die.row * (CELL_SIZE + CELL_GAP) + CELL_GAP;
                return (
                  <rect
                    key={`${die.row}-${die.col}`}
                    data-testid={`wafer-die-${die.row}-${die.col}`}
                    x={x}
                    y={y}
                    width={CELL_SIZE}
                    height={CELL_SIZE}
                    rx="2"
                    fill={STATUS_COLORS[die.status]}
                    opacity="0.85"
                  />
                );
              })}
            </svg>
          </div>

          {/* Legend */}
          <div className="flex flex-col gap-2 pt-1">
            {(Object.keys(STATUS_LABELS) as WaferDie['status'][]).map((status) => (
              <div key={status} className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: STATUS_COLORS[status] }}
                />
                <span className="text-xs text-[var(--smartfactory-text-secondary)] min-w-[72px]">
                  {STATUS_LABELS[status]}
                </span>
                <span className="text-xs font-mono font-semibold text-[var(--smartfactory-text-primary)] min-w-[24px] text-right">
                  {counts[status] || 0}
                </span>
              </div>
            ))}

            <div className="border-t border-[var(--smartfactory-border-default)] my-1" />

            <div className="text-xs text-[var(--smartfactory-text-muted)]">
              Total: <span className="font-mono text-[var(--smartfactory-text-secondary)]">{dies.length}</span> dies
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
