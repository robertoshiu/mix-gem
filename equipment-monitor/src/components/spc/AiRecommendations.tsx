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
} from 'lucide-react';
import { useMesSpcStore } from '@/stores/mes-spc-store';
import {
  makeS2F49ApplyRecommendation,
  makeS2F50ApplyAck,
  makeS2F49OverrideRecommendation,
  makeS2F50OverrideAck,
} from '@/lib/secs-message-log';
import type { AiRecommendationType } from '@/lib/mes-types';
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
    // Other actions (Schedule, View Details, Create WO, Optimize Now, Auto-schedule)
    // are UI-only placeholders per task requirements
  };

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
      <div className="flex items-center gap-2 mb-3">
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
      </div>

      {/* Recommendations list or empty state */}
      {recommendations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 gap-2">
          <Activity
            className="w-8 h-8"
            style={{ color: 'var(--smartfactory-text-muted)' }}
          />
          <span
            className="text-xs"
            style={{ color: 'var(--smartfactory-text-muted)' }}
          >
            No AI recommendations available
          </span>
        </div>
      ) : (
        <div>
          {recommendations.map((rec) => {
            const StatusIcon = rec.status === 'applied' ? CheckCircle : AlertTriangle;
            const statusColor =
              rec.status === 'applied'
                ? 'var(--smartfactory-status-green)'
                : rec.status === 'overridden'
                  ? 'var(--smartfactory-status-amber)'
                  : 'var(--smartfactory-accent-electric-blue)';
            const accentColor = TYPE_ACCENT[rec.type] || TYPE_ACCENT.energy;
            const badgeBg = TYPE_BADGE_BG[rec.type] || TYPE_BADGE_BG.energy;
            const actions = TYPE_ACTIONS[rec.type] || TYPE_ACTIONS.energy;

            return (
              <motion.div key={rec.id} {...fadeInUpProps}>
              <div
                className="border rounded-lg p-3 mb-2"
                style={{
                  backgroundColor: 'var(--smartfactory-surface-card)',
                  borderColor: 'var(--smartfactory-border-default)',
                  borderLeftWidth: '3px',
                  borderLeftColor: accentColor,
                }}
              >
                {/* Row 1: Type badge + Title + Confidence */}
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="text-[10px] font-semibold uppercase tracking-wider rounded px-1.5 py-0.5 shrink-0"
                    style={{
                      backgroundColor: badgeBg,
                      color: accentColor,
                    }}
                  >
                    {TYPE_LABELS[rec.type]}
                  </span>
                  <span
                    className="text-sm font-medium truncate flex-1"
                    style={{ color: 'var(--smartfactory-text-primary)' }}
                  >
                    {rec.title}
                  </span>
                  <span
                    className="text-xs font-mono rounded-full px-2 py-0.5 shrink-0"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--smartfactory-accent-blue) 40%, transparent)',
                      color: 'var(--smartfactory-text-primary)',
                    }}
                  >
                    {rec.confidence}%
                  </span>
                </div>

                {/* Row 2: Description */}
                <p
                  className="text-xs mb-2"
                  style={{ color: 'var(--smartfactory-text-secondary)' }}
                >
                  {rec.description}
                </p>

                {/* Row 3: Status badge or action buttons */}
                {rec.status === 'pending' ? (
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
                                  borderColor: 'var(--smartfactory-border-default)',
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
                      {rec.status}
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
