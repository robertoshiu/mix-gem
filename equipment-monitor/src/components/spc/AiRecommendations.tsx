'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  Zap,
  Settings,
  Clock,
  CheckCircle,
  AlertTriangle,
  FileText,
  Play,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { useMesSpcStore } from '@/stores/mes-spc-store';
import {
  makeS2F49ApplyRecommendation,
  makeS2F50ApplyAck,
  makeS2F49OverrideRecommendation,
  makeS2F50OverrideAck,
} from '@/lib/secs-message-log';
import type { AiRecommendationType, TrendDirection } from '@/lib/mes-types';
import { fadeInUp, useReducedMotion } from '@/lib/animation';

const TYPE_LABELS: Record<AiRecommendationType, string> = {
  energy: 'Energy Optimization',
  'predictive-maintenance': 'Predictive Maintenance',
  'production-optimization': 'Production Optimization',
  'carbon-reduction': 'Carbon Reduction',
  quality: 'Quality Control',
  scheduling: 'Scheduling',
};

const TYPE_ACCENT: Record<AiRecommendationType, string> = {
  energy: 'var(--smartfactory-status-green)',
  'predictive-maintenance': 'var(--smartfactory-status-amber)',
  'production-optimization': 'var(--smartfactory-accent-blue)',
  'carbon-reduction': 'var(--smartfactory-accent-teal)',
  quality: 'var(--smartfactory-accent-violet)',
  scheduling: 'var(--smartfactory-accent-electric-blue)',
};

const TYPE_BADGE_BG: Record<AiRecommendationType, string> = {
  energy: 'color-mix(in srgb, var(--smartfactory-status-green) 15%, transparent)',
  'predictive-maintenance': 'color-mix(in srgb, var(--smartfactory-status-amber) 15%, transparent)',
  'production-optimization': 'color-mix(in srgb, var(--smartfactory-accent-blue) 15%, transparent)',
  'carbon-reduction': 'color-mix(in srgb, var(--smartfactory-accent-teal) 15%, transparent)',
  quality: 'color-mix(in srgb, var(--smartfactory-accent-violet) 15%, transparent)',
  scheduling: 'color-mix(in srgb, var(--smartfactory-accent-electric-blue) 15%, transparent)',
};

const SOURCE_LABELS: Record<string, string> = {
  'spc-violation': 'SPC Alert',
  'trend-drift': 'Trend Analysis',
  'equipment-inhibited': 'Equipment Status',
  'yield-prediction': 'Yield Model',
  'process-optimization': 'Process AI',
};

const SOURCE_BG: Record<string, string> = {
  'spc-violation': 'color-mix(in srgb, var(--smartfactory-status-red) 12%, transparent)',
  'trend-drift': 'color-mix(in srgb, var(--smartfactory-accent-blue) 12%, transparent)',
  'equipment-inhibited': 'color-mix(in srgb, var(--smartfactory-status-amber) 12%, transparent)',
  'yield-prediction': 'color-mix(in srgb, var(--smartfactory-accent-violet) 12%, transparent)',
  'process-optimization': 'color-mix(in srgb, var(--smartfactory-accent-teal) 12%, transparent)',
};

const SOURCE_COLOR: Record<string, string> = {
  'spc-violation': 'var(--smartfactory-status-red)',
  'trend-drift': 'var(--smartfactory-accent-blue)',
  'equipment-inhibited': 'var(--smartfactory-status-amber)',
  'yield-prediction': 'var(--smartfactory-accent-violet)',
  'process-optimization': 'var(--smartfactory-accent-teal)',
};

type ActionDef = { label: string; icon?: React.FC<React.SVGProps<SVGSVGElement>>; variant: 'primary' | 'secondary' };

const TYPE_ACTIONS: Record<AiRecommendationType, ActionDef[]> = {
  energy: [
    { label: 'Apply', variant: 'primary' },
    { label: 'Schedule', icon: Clock, variant: 'secondary' },
  ],
  'predictive-maintenance': [
    { label: 'View Details', icon: FileText, variant: 'primary' },
    { label: 'Create WO', icon: Settings, variant: 'secondary' },
  ],
  'production-optimization': [
    { label: 'Optimize Now', icon: Play, variant: 'primary' },
    { label: 'Schedule', icon: Clock, variant: 'secondary' },
  ],
  'carbon-reduction': [
    { label: 'Auto-schedule', icon: Zap, variant: 'primary' },
    { label: 'View Details', icon: FileText, variant: 'secondary' },
  ],
  quality: [
    { label: 'Apply', variant: 'primary' },
    { label: 'Schedule', icon: Clock, variant: 'secondary' },
  ],
  scheduling: [
    { label: 'Apply', variant: 'primary' },
    { label: 'Override', variant: 'secondary' },
  ],
};

function TrendIcon({ direction }: { direction?: TrendDirection }) {
  if (direction === 'improving') return <TrendingDown className="w-3.5 h-3.5" style={{ color: 'var(--smartfactory-status-green)' }} />;
  if (direction === 'degrading') return <TrendingUp className="w-3.5 h-3.5" style={{ color: 'var(--smartfactory-status-red)' }} />;
  return <span className="text-[10px]" style={{ color: 'var(--smartfactory-text-muted)' }}>—</span>;
}

function ConfidenceBar({ confidence }: { confidence: number }) {
  const color = confidence >= 80 ? 'var(--smartfactory-status-green)' : confidence >= 60 ? 'var(--smartfactory-status-amber)' : 'var(--smartfactory-status-red)';

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--smartfactory-surface-base)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${confidence}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
      <span className="text-[10px] font-mono tabular-nums" style={{ color, minWidth: '28px' }}>
        {confidence}%
      </span>
    </div>
  );
}

function MiniSparkline({ history }: { history: { confidence: number }[] }) {
  if (history.length < 2) return null;
  const values = history.slice(-6).map((h) => h.confidence);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const width = 48;
  const height = 16;
  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="opacity-60">
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        points={points}
        style={{ color: 'var(--smartfactory-accent-electric-blue)' }}
      />
    </svg>
  );
}

function RelativeTime({ date }: { date: Date }) {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return <span className="text-[10px]" style={{ color: 'var(--smartfactory-text-muted)' }}>Just now</span>;
  if (diffMins < 60) return <span className="text-[10px]" style={{ color: 'var(--smartfactory-text-muted)' }}>{diffMins}m ago</span>;
  const diffHours = Math.floor(diffMins / 60);
  return <span className="text-[10px]" style={{ color: 'var(--smartfactory-text-muted)' }}>{diffHours}h ago</span>;
}

export function AiRecommendations() {
  const store = useMesSpcStore();
  const recommendations = store.recommendations;
  const reduced = useReducedMotion();
  const fadeInUpProps = reduced ? {} : { variants: fadeInUp, initial: 'initial' as const, animate: 'animate' as const };

  const handleApply = (rec: { id: string }) => {
    store.applyRecommendation(rec.id);
    store.addEvent(makeS2F49ApplyRecommendation(rec.id, 'APPLY'));
    store.addEvent(makeS2F50ApplyAck(rec.id, true));
  };

  const handleOverride = (rec: { id: string }) => {
    store.overrideRecommendation(rec.id);
    store.addEvent(makeS2F49OverrideRecommendation(rec.id, 'MANUAL_OVERRIDE'));
    store.addEvent(makeS2F50OverrideAck(rec.id));
  };

  const handleAction = (rec: { id: string }, action: ActionDef) => {
    if (action.label === 'Apply') {
      handleApply(rec);
    } else if (action.label === 'Override') {
      handleOverride(rec);
    }
    // Other actions are UI-only placeholders
  };

  const pendingCount = recommendations.filter((r) => r.status === 'pending').length;
  const hasData = store.measurements.length >= store.aiEngineConfig.minDataPoints;

  return (
    <div
      className="rounded-lg border p-4"
      style={{
        backgroundColor: 'var(--smartfactory-surface-panel)',
        borderColor: 'var(--smartfactory-border-default)',
      }}
      data-testid="ai-recommendations"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity
            className="w-5 h-5"
            style={{ color: 'var(--smartfactory-accent-electric-blue)' }}
          />
          <span
            className="text-sm font-semibold"
            style={{ color: 'var(--smartfactory-text-primary)' }}
          >
            AI Insights
          </span>
          {pendingCount > 0 && (
            <span
              className="text-[10px] font-bold rounded-full px-2 py-0.5"
              style={{
                backgroundColor: 'var(--smartfactory-accent-electric-blue)',
                color: 'white',
              }}
            >
              {pendingCount}
            </span>
          )}
        </div>
        {hasData && (
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px]" style={{ color: 'var(--smartfactory-text-muted)' }}>Live</span>
          </div>
        )}
      </div>

      {/* Recommendations list or empty state */}
      {!hasData ? (
        <div className="flex flex-col items-center justify-center py-8 gap-2">
          <Activity
            className="w-8 h-8 animate-pulse"
            style={{ color: 'var(--smartfactory-text-muted)' }}
          />
          <span
            className="text-xs"
            style={{ color: 'var(--smartfactory-text-muted)' }}
          >
            AI analysis initializing…
          </span>
          <span className="text-[10px]" style={{ color: 'var(--smartfactory-text-muted)' }}>
            Collecting process data ({store.measurements.length}/{store.aiEngineConfig.minDataPoints} wafers)
          </span>
        </div>
      ) : recommendations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 gap-2">
          <CheckCircle
            className="w-8 h-8"
            style={{ color: 'var(--smartfactory-status-green)' }}
          />
          <span
            className="text-xs"
            style={{ color: 'var(--smartfactory-text-muted)' }}
          >
            No active recommendations — process is stable
          </span>
        </div>
      ) : (
        <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
          {recommendations.map((rec) => {
            const StatusIcon = rec.status === 'applied' ? CheckCircle : rec.status === 'overridden' ? AlertTriangle : AlertTriangle;
            const statusColor =
              rec.status === 'applied'
                ? 'var(--smartfactory-status-green)'
                : rec.status === 'overridden'
                  ? 'var(--smartfactory-status-amber)'
                  : rec.status === 'superseded'
                    ? 'var(--smartfactory-text-muted)'
                    : 'var(--smartfactory-accent-electric-blue)';
            const accentColor = TYPE_ACCENT[rec.type] || TYPE_ACCENT.energy;
            const badgeBg = TYPE_BADGE_BG[rec.type] || TYPE_BADGE_BG.energy;
            const actions = TYPE_ACTIONS[rec.type] || TYPE_ACTIONS.energy;
            const isSuperseded = rec.status === 'superseded';

            return (
              <motion.div key={rec.id} {...fadeInUpProps}>
                <div
                  className="border rounded-lg p-3 mb-2 transition-opacity"
                  style={{
                    backgroundColor: isSuperseded ? 'var(--smartfactory-surface-base)' : 'var(--smartfactory-surface-card)',
                    borderColor: isSuperseded ? 'var(--smartfactory-border-dim)' : 'var(--smartfactory-border-default)',
                    borderLeftWidth: '3px',
                    borderLeftColor: isSuperseded ? 'var(--smartfactory-text-muted)' : accentColor,
                    opacity: isSuperseded ? 0.6 : 1,
                  }}
                >
                  {/* Row 1: Type badge + Title + Confidence */}
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className="text-[10px] font-semibold uppercase tracking-wider rounded px-1.5 py-0.5 shrink-0"
                      style={{
                        backgroundColor: badgeBg,
                        color: accentColor,
                      }}
                    >
                      {TYPE_LABELS[rec.type]}
                    </span>
                    {rec.source && (
                      <span
                        className="text-[9px] font-medium rounded px-1.5 py-0.5 shrink-0"
                        style={{
                          backgroundColor: SOURCE_BG[rec.source] || SOURCE_BG['process-optimization'],
                          color: SOURCE_COLOR[rec.source] || SOURCE_COLOR['process-optimization'],
                        }}
                      >
                        {SOURCE_LABELS[rec.source] || rec.source}
                      </span>
                    )}
                    <span
                      className="text-sm font-medium truncate flex-1"
                      style={{ color: isSuperseded ? 'var(--smartfactory-text-muted)' : 'var(--smartfactory-text-primary)' }}
                    >
                      {rec.title}
                    </span>
                  </div>

                  {/* Row 2: Description */}
                  <p
                    className="text-xs mb-2 leading-relaxed"
                    style={{ color: 'var(--smartfactory-text-secondary)' }}
                  >
                    {rec.description}
                  </p>

                  {/* Row 3: Impact + Parameter + Trend */}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-[10px] rounded px-1.5 py-0.5" style={{ backgroundColor: 'var(--smartfactory-surface-base)', color: 'var(--smartfactory-text-secondary)' }}>
                      {rec.impact}
                    </span>
                    {rec.relatedParameter && (
                      <span className="text-[10px] font-mono rounded px-1.5 py-0.5" style={{ backgroundColor: 'color-mix(in srgb, var(--smartfactory-accent-violet) 10%, transparent)', color: 'var(--smartfactory-accent-violet)' }}>
                        {rec.relatedParameter.toUpperCase()}
                      </span>
                    )}
                    {rec.trendDirection && (
                      <span className="flex items-center gap-1 text-[10px]" style={{ color: rec.trendDirection === 'degrading' ? 'var(--smartfactory-status-red)' : rec.trendDirection === 'improving' ? 'var(--smartfactory-status-green)' : 'var(--smartfactory-text-muted)' }}>
                        <TrendIcon direction={rec.trendDirection} />
                        {rec.trendDirection}
                      </span>
                    )}
                    <RelativeTime date={rec.createdAt} />
                  </div>

                  {/* Row 4: Confidence bar + Sparkline */}
                  {rec.status === 'pending' && !isSuperseded && (
                    <div className="flex items-center gap-2 mb-2">
                      <ConfidenceBar confidence={rec.confidence} />
                      <MiniSparkline history={rec.confidenceHistory} />
                    </div>
                  )}

                  {/* Row 5: Status badge or action buttons */}
                  {rec.status === 'pending' && !isSuperseded ? (
                    <div className="flex items-center gap-2">
                      {actions.map((action) => {
                        const ActionIcon = action.icon;
                        const isPrimary = action.variant === 'primary';
                        return (
                          <button
                            key={action.label}
                            type="button"
                            onClick={() => handleAction(rec, action)}
                            className="text-xs font-medium rounded px-3 py-1 cursor-pointer transition-colors hover:opacity-80 flex items-center gap-1"
                            style={
                              isPrimary
                                ? { backgroundColor: accentColor, color: 'white' }
                                : {
                                    border: '1px solid var(--smartfactory-border-default)',
                                    color: 'var(--smartfactory-text-secondary)',
                                  }
                            }
                            data-testid={`ai-action-${action.label.toLowerCase().replace(/\s+/g, '-')}-${rec.id}`}
                          >
                            {ActionIcon && <ActionIcon className="w-3 h-3" />}
                            {action.label}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <StatusIcon
                        className="w-3.5 h-3.5"
                        style={{ color: statusColor }}
                      />
                      <span
                        className="text-xs font-medium capitalize"
                        style={{ color: statusColor }}
                      >
                        {isSuperseded ? `Superseded${rec.supersededById ? ' by newer insight' : ''}` : rec.status}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default AiRecommendations;
