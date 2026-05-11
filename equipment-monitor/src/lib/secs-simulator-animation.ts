'use client';

import { useEffect, useState } from 'react';
import type { Variants } from 'framer-motion';
import { prefersReducedMotion, springConfig, transitionConfig } from '@/lib/animation';

export const STAGGER_DELAY = 60;
export const TYPEWRITER_SPEED = 25;
export const GLOW_CYCLE = 2000;
export const MAX_VISIBLE_PACKETS = 50;
export const USER_OVERRIDE_DURATION = 5000;

export const stepExpand: Variants = {
  initial: { height: 0, opacity: 0 },
  animate: { height: 'auto', opacity: 1, transition: transitionConfig },
  exit: { height: 0, opacity: 0, transition: { duration: 0.2 } },
};

export const stepCollapse: Variants = {
  initial: { height: 'auto', opacity: 1 },
  animate: { height: 0, opacity: 0, transition: transitionConfig },
  exit: { height: 0, opacity: 0, transition: { duration: 0.2 } },
};

export const packetEnter: Variants = {
  initial: { opacity: 0, x: 12, y: 6 },
  animate: {
    opacity: 1,
    x: 0,
    y: 0,
    transition: {
      ...transitionConfig,
      staggerChildren: STAGGER_DELAY / 1000,
    },
  },
  exit: { opacity: 0, x: -8, transition: { duration: 0.2 } },
};

export const packetExit: Variants = {
  initial: { opacity: 1, x: 0 },
  animate: { opacity: 0, x: -8, transition: { duration: 0.2 } },
  exit: { opacity: 0, x: -8, transition: { duration: 0.2 } },
};

export const glowPulse: Variants = {
  initial: { boxShadow: '0 0 0px var(--sf-accent-cyan)' },
  animate: {
    boxShadow: [
      '0 0 0px var(--sf-accent-cyan)',
      '0 0 18px var(--sf-accent-cyan)',
      '0 0 4px var(--sf-accent-cyan)',
      '0 0 0px var(--sf-accent-cyan)',
    ],
    transition: { duration: GLOW_CYCLE / 1000, repeat: Infinity, ease: 'easeInOut' },
  },
};

export const recipeRollUp: Variants = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0, transition: transitionConfig },
  exit: { opacity: 0, y: 40, transition: { duration: 0.2 } },
};

export const payloadExpand: Variants = {
  initial: { height: 0, opacity: 0 },
  animate: { height: 'auto', opacity: 1, transition: { duration: 0.3 } },
  exit: { height: 0, opacity: 0, transition: { duration: 0.2 } },
};

export const payloadCollapse: Variants = {
  initial: { height: 'auto', opacity: 1 },
  animate: { height: 0, opacity: 0, transition: { duration: 0.2 } },
  exit: { height: 0, opacity: 0, transition: { duration: 0.2 } },
};

export function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(() => prefersReducedMotion());

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = () => setReducedMotion(mediaQuery.matches);

    handleChange();
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return reducedMotion;
}

export function useTypewriter(text: string, speed = TYPEWRITER_SPEED): string {
  const [reducedMotion] = useState(() => prefersReducedMotion());
  const [displayedText, setDisplayedText] = useState(() => (reducedMotion ? text : ''));

  useEffect(() => {
    if (reducedMotion) {
      setDisplayedText(text);
      return;
    }

    setDisplayedText('');
    let index = 0;

    const intervalId = window.setInterval(() => {
      index += 1;
      setDisplayedText(text.slice(0, index));

      if (index >= text.length) {
        window.clearInterval(intervalId);
      }
    }, speed);

    return () => {
      window.clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion, speed, text]);

  return displayedText;
}

export { springConfig, transitionConfig };
