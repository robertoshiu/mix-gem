'use client';

import { AlertTriangle, CheckCircle } from 'lucide-react';
import type { SpcViolation } from '@/lib/mes-types';
import { SPC_PARAMETERS } from '@/lib/spc-parameters';

const RULE_LABELS: Record<string, string> = {
  rule_1: 'Rule 1: Beyond 3 Sigma',
  rule_2: 'Rule 2: 7 Consecutive Same Side',
  rule_5: 'Rule 5: 2 of 3 Beyond 2 Sigma',
};

interface ViolationCardProps {
  violation: SpcViolation;
  onAcknowledge: (id: string) => void;
}

export function ViolationCard({ violation, onAcknowledge }: ViolationCardProps) {
  const { parameter, rule, value, limit, lotId, waferNumber, acknowledged } = violation;
  const config = SPC_PARAMETERS[parameter];

  return (
    <div
      className="bg-red-950/30 border border-[#EF4444] rounded p-3 flex flex-col gap-2"
      style={acknowledged ? {} : { boxShadow: '0 0 12px rgba(239,68,68,0.3)' }}
    >
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-[#EF4444] mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#EF4444]">{RULE_LABELS[rule]}</p>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            {config.label} (<span className="font-['Fira_Code',monospace]">{value.toFixed(2)}</span>
            {' '}{value > limit ? '>' : '<'}{' '}
            {limit === config.ucl ? 'UCL' : 'LCL'}{' '}
            <span className="font-['Fira_Code',monospace]">{limit.toFixed(1)}</span>)
          </p>
        </div>
      </div>

      <div className="text-xs text-[#94A3B8] space-y-0.5">
        <div>Lot: <span className="text-[#F1F5F9]">{lotId}</span></div>
        <div>Wafer: <span className="text-[#F1F5F9] font-['Fira_Code',monospace]">{waferNumber}</span></div>
        <div>Action: <span className="text-[#F59E0B]">Auto-hold + Equip inhibit</span></div>
      </div>

      {acknowledged ? (
        <div className="flex items-center gap-1.5 text-sm text-[#10B981]">
          <CheckCircle className="w-4 h-4" />
          <span>Acknowledged</span>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => onAcknowledge(violation.id)}
          className="min-h-[44px] px-3 py-2 rounded text-sm font-semibold bg-[#182840] hover:bg-[#1E3A5F] border border-[#EF4444] text-[#F1F5F9] cursor-pointer transition-colors"
          aria-label="Acknowledge violation"
        >
          Acknowledge
        </button>
      )}
    </div>
  );
}
