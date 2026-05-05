'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { fadeIn, useReducedMotion } from '@/lib/animation';

const FooterStatusBar: React.FC = () => {
  const [time, setTime] = useState<string>('');
  const [uptime, setUptime] = useState<string>('');
  const reduced = useReducedMotion();
  const fadeInProps = reduced ? {} : { variants: fadeIn, initial: 'initial' as const, animate: 'animate' as const };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour12: false }));
    };

    const updateUptime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      setUptime(`${hours}:${minutes}`);
    };

    updateTime();
    updateUptime();
    const timeInterval = setInterval(updateTime, 1000);
    const uptimeInterval = setInterval(updateUptime, 60000);

    return () => {
      clearInterval(timeInterval);
      clearInterval(uptimeInterval);
    };
  }, []);

  return (
    <motion.div {...fadeInProps}>
    <footer
      className="w-full flex flex-col border-t select-none"
      style={{
        backgroundColor: 'var(--smartfactory-bg-canvas)',
        borderColor: 'var(--smartfactory-border-default)',
        color: 'var(--smartfactory-text-secondary)'
      }}
      data-testid="footer-status-bar"
    >
      {/* Main Status Row */}
      <div className="flex items-center h-8 px-4 text-[11px]">
        {/* Left Segment - Version */}
        <div className="flex-shrink-0">
          SmartFactory Analytics v9.2
        </div>

        {/* Divider */}
        <div className="mx-3" style={{ color: 'var(--smartfactory-text-muted)' }}>|</div>

        {/* AI Status with Pulsing Dot */}
        <div className="flex items-center gap-1.5">
          <span
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: 'var(--smartfactory-status-green)',
              boxShadow: reduced ? undefined : '0 0 6px var(--smartfactory-status-green)'
            }}
          >
            {!reduced && (
              <style>{`
                @keyframes ai-pulse {
                  0%, 100% { opacity: 1; box-shadow: 0 0 6px var(--smartfactory-status-green); }
                  50% { opacity: 0.5; box-shadow: 0 0 12px var(--smartfactory-status-green); }
                }
              `}</style>
            )}
          </span>
          <span
            style={!reduced ? { animation: 'ai-pulse 2s ease-in-out infinite' } : undefined}
          >
            AI Optimization: Active
          </span>
        </div>

        {/* Divider */}
        <div className="mx-3" style={{ color: 'var(--smartfactory-text-muted)' }}>|</div>

        {/* Data Refresh Rate */}
        <div className="flex items-center gap-1.5">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: 'var(--smartfactory-accent-blue)' }}
          ></span>
          Refresh: 2s
        </div>

        {/* Divider */}
        <div className="mx-3" style={{ color: 'var(--smartfactory-text-muted)' }}>|</div>

        {/* Connected Devices */}
        <div className="flex items-center gap-1.5">
          Connected: <span className="font-['Fira_Code',monospace]">8</span> devices
        </div>

        {/* Divider */}
        <div className="mx-3" style={{ color: 'var(--smartfactory-text-muted)' }}>|</div>

        {/* Uptime */}
        <div className="flex items-center gap-1.5">
          Uptime: <span className="font-['Fira_Code',monospace]">{uptime || '--:--'}</span>
        </div>

        {/* Live Clock (Far Right) */}
        <div className="ml-auto flex items-center">
          <span
            className="font-['Fira_Code',monospace] tabular-nums"
            data-testid="footer-clock"
          >
            {time || '00:00:00'}
          </span>
        </div>
      </div>

      {/* AI Prediction Message Row */}
      <div
        className="flex items-center h-6 px-4 text-[10px] border-t"
        style={{
          borderColor: 'var(--smartfactory-border-default)',
          color: 'var(--smartfactory-text-muted)',
          backgroundColor: 'var(--smartfactory-surface-panel)'
        }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full mr-2 flex-shrink-0"
          style={{ backgroundColor: 'var(--smartfactory-accent-violet)' }}
        ></span>
        AI predicts yield recovery to 96% with recommended adjustments
      </div>
    </footer>
    </motion.div>
  );
};

export default FooterStatusBar;
