'use client';

import { AlertTriangle, CheckCircle } from 'lucide-react';
import type { SpcViolation } from '@/lib/mes-types';
import { SPC_PARAMETERS } from '@/lib/spc-parameters';

const RULE_LABELS: Record<string, string> = {
  rule_1: 'Rule 1: Beyond 3 Sigma',
  rule_2: 'Rule 2: 7 Consecutive Same Side',
  rule_3: 'Rule 3: Trend — 6 consecutive increasing/decreasing',
  rule_4: 'Rule 4: Oscillation — 14 alternating points',
  rule_5: 'Rule 5: 2 of 3 Beyond 2 Sigma',
  rule_6: 'Rule 6: 4 of 5 Beyond ±1σ Same Side',
  rule_7: 'Rule 7: Stratification — 15 points within ±1σ',
  rule_8: 'Rule 8: Mixture — 8 points beyond ±1σ both sides',
};

type RuleSeverity = { border: string; bg: string; text: string; badge: string };

const RULE_SEVERITY: Record<string, RuleSeverity> = {
  rule_1: {
    border: 'var(--smartfactory-status-red)',
    bg: 'rgba(239,68,68,0.1)',
    text: 'var(--smartfactory-status-red)',
    badge: 'CRITICAL',
  },
  rule_2: {
    border: 'var(--smartfactory-status-amber)',
    bg: 'rgba(245,158,11,0.1)',
    text: 'var(--smartfactory-status-amber)',
    badge: 'WARNING',
  },
  rule_3: {
    border: 'var(--smartfactory-accent-blue)',
    bg: 'rgba(59,130,246,0.1)',
    text: 'var(--smartfactory-accent-blue)',
    badge: 'INFO',
  },
  rule_4: {
    border: 'var(--smartfactory-accent-blue)',
    bg: 'rgba(59,130,246,0.1)',
    text: 'var(--smartfactory-accent-blue)',
    badge: 'INFO',
  },
  rule_5: {
    border: 'var(--smartfactory-status-amber)',
    bg: 'rgba(245,158,11,0.1)',
    text: 'var(--smartfactory-status-amber)',
    badge: 'WARNING',
  },
  rule_6: {
    border: 'var(--smartfactory-status-amber)',
    bg: 'rgba(245,158,11,0.1)',
    text: 'var(--smartfactory-status-amber)',
    badge: 'WARNING',
  },
  rule_7: {
    border: 'var(--smartfactory-accent-blue)',
    bg: 'rgba(59,130,246,0.1)',
    text: 'var(--smartfactory-accent-blue)',
    badge: 'INFO',
  },
  rule_8: {
    border: 'var(--smartfactory-accent-blue)',
    bg: 'rgba(59,130,246,0.1)',
    text: 'var(--smartfactory-accent-blue)',
    badge: 'INFO',
  },
};

interface ViolationCardProps {
  violation: SpcViolation;
  onAcknowledge: (id: string) => void;
}

export function ViolationCard({ violation, onAcknowledge }: ViolationCardProps) {
  const { parameter, rule, value, limit, lotId, waferNumber, acknowledged } = violation;
  const config = SPC_PARAMETERS[parameter];
  const severity = RULE_SEVERITY[rule];

  return (
    <div
      data-testid={`violation-card-${violation.id}`}
      className="border rounded p-3 flex flex-col gap-2"
      style={{
        borderColor: severity.border,
        backgroundColor: severity.bg,
        ...(acknowledged ? {} : { boxShadow: `0 0 12px ${severity.bg}` }),
      }}
    >
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: severity.text }} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold" style={{ color: severity.text }}>
            {RULE_LABELS[rule]}
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded ml-2"
              style={{ backgroundColor: severity.border, color: '#fff' }}
            >
              {severity.badge}
            </span>
          </p>
          <p className="text-xs text-[var(--smartfactory-text-secondary)] mt-0.5">
            {config.label} (<span className="font-['Fira_Code',monospace]">{value.toFixed(2)}</span>
            {' '}{value > limit ? '>' : '<'}{' '}
            {limit === config.ucl ? 'UCL' : 'LCL'}{' '}
            <span className="font-['Fira_Code',monospace]">{limit.toFixed(1)}</span>)
          </p>
        </div>
      </div>

      <div className="text-xs text-[var(--smartfactory-text-secondary)] space-y-0.5">
        <div>Lot: <span className="text-[var(--smartfactory-text-primary)]">{lotId}</span></div>
        <div>Wafer: <span className="text-[var(--smartfactory-text-primary)] font-['Fira_Code',monospace]">{waferNumber}</span></div>
        <div>Action: <span className="text-[var(--smartfactory-status-amber)]">Auto-hold + Equip inhibit</span></div>
      </div>

      {acknowledged ? (
        <div className="flex items-center gap-1.5 text-sm text-[var(--smartfactory-status-green)]">
          <CheckCircle className="w-4 h-4" />
          <span>Acknowledged</span>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => onAcknowledge(violation.id)}
          className="min-h-[44px] px-3 py-2 rounded text-sm font-semibold bg-[var(--smartfactory-surface-elevated)] hover:bg-[var(--smartfactory-border-default)] border text-[var(--smartfactory-text-primary)] cursor-pointer transition-colors"
          style={{ borderColor: severity.border }}
          aria-label="Acknowledge violation"
          data-testid="acknowledge-button"
        >
          Acknowledge
        </button>
      )}
    </div>
  );
}
