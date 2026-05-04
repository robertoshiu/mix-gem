'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  Zap,
  Settings,
  TrendingUp,
  Shield,
  Clock,
  CheckCircle,
  AlertTriangle,
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

const ICON_MAP: Record<AiRecommendationType, React.FC<React.SVGProps<SVGSVGElement>>> = {
  energy: Zap,
  'predictive-maintenance': Settings,
  'production-optimization': TrendingUp,
  'carbon-reduction': Activity,
  quality: Shield,
  scheduling: Clock,
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
            const TypeIcon = ICON_MAP[rec.type] || Zap;
            const StatusIcon = rec.status === 'applied' ? CheckCircle : AlertTriangle;
            const statusColor =
              rec.status === 'applied'
                ? 'var(--smartfactory-status-green)'
                : rec.status === 'overridden'
                  ? 'var(--smartfactory-status-amber)'
                  : 'var(--smartfactory-accent-electric-blue)';

            return (
              <motion.div key={rec.id} {...fadeInUpProps}>
              <div
                className="border rounded-lg p-3 mb-2"
                style={{
                  backgroundColor: 'var(--smartfactory-surface-card)',
                  borderColor: 'var(--smartfactory-border-default)',
                }}
              >
                {/* Row 1: Icon + Title + Confidence */}
                <div className="flex items-center gap-2 mb-1">
                  <TypeIcon
                    className="w-4 h-4 shrink-0"
                    style={{ color: 'var(--smartfactory-accent-electric-blue)' }}
                  />
                  <span
                    className="text-sm font-medium truncate flex-1"
                    style={{ color: 'var(--smartfactory-text-primary)' }}
                  >
                    {rec.title}
                  </span>
                  <span
                    className="text-xs font-mono rounded-full px-2 py-0.5 shrink-0"
                    style={{
                      backgroundColor: 'rgba(59, 130, 246, 0.4)',
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
                    <button
                      type="button"
                      onClick={() => handleApply(rec)}
                      className="text-xs font-medium rounded px-3 py-1 cursor-pointer transition-colors hover:opacity-80"
                      style={{ backgroundColor: 'var(--smartfactory-accent-electric-blue)', color: 'white' }}
                      data-testid={`ai-apply-btn-${rec.id}`}
                    >
                      Apply
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOverride(rec)}
                      className="text-xs font-medium rounded px-3 py-1 cursor-pointer transition-colors hover:opacity-80 border"
                      style={{
                        borderColor: 'var(--smartfactory-border-default)',
                        color: 'var(--smartfactory-text-secondary)',
                      }}
                      data-testid={`ai-override-btn-${rec.id}`}
                    >
                      Override
                    </button>
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
