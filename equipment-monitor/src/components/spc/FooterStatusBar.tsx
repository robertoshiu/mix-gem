'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { fadeIn, useReducedMotion } from '@/lib/animation';

const FooterStatusBar: React.FC = () => {
  const [time, setTime] = useState<string>('');
  const reduced = useReducedMotion();
  const fadeInProps = reduced ? {} : { variants: fadeIn, initial: 'initial' as const, animate: 'animate' as const };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour12: false }));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div {...fadeInProps}>
    <footer 
      className="w-full h-10 flex items-center px-4 text-[11px] border-t select-none"
      style={{
        backgroundColor: 'var(--smartfactory-bg-canvas)',
        borderColor: 'var(--smartfactory-border-default)',
        color: 'var(--smartfactory-text-secondary)'
      }}
      data-testid="footer-status-bar"
    >
      {/* Left Segment */}
      <div className="flex-shrink-0">
        SmartFactory Intelligence Platform v1.0
      </div>

      {/* Divider */}
      <div className="mx-3" style={{ color: 'var(--smartfactory-text-muted)' }}>|</div>

      {/* Center-Left Segment */}
      <div className="flex items-center gap-1.5">
        <span 
          className="w-2 h-2 rounded-full" 
          style={{ backgroundColor: 'var(--smartfactory-status-green)' }}
        ></span>
        AI Engine: Active
      </div>

      {/* Divider */}
      <div className="mx-3" style={{ color: 'var(--smartfactory-text-muted)' }}>|</div>

      {/* Center-Right Segment */}
      <div className="flex items-center gap-1.5">
        <span 
          className="w-2 h-2 rounded-full" 
          style={{ backgroundColor: 'var(--smartfactory-accent-blue)' }}
        ></span>
        Data Refresh: 2s
      </div>

      {/* Divider */}
      <div className="mx-3" style={{ color: 'var(--smartfactory-text-muted)' }}>|</div>

      {/* Right Segment */}
      <div className="flex-shrink-0">
        Connected: 8 devices
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
    </footer>
    </motion.div>
  );
};

export default FooterStatusBar;
