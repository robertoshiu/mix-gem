import type { Variants, Transition } from 'framer-motion';

// Shared spring config for smooth UI animations
export const springConfig = {
  stiffness: 300,
  damping: 25,
  mass: 0.8,
};

export const transitionConfig: Transition = {
  type: 'spring',
  ...springConfig,
};

// Common animation variants
export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: transitionConfig },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

export const slideInRight: Variants = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0, transition: transitionConfig },
  exit: { opacity: 0, x: 30, transition: { duration: 0.2 } },
};

export const slideInDown: Variants = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0, transition: transitionConfig },
  exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
};

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1, transition: transitionConfig },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } },
};

export const pulseGlow: Variants = {
  initial: { boxShadow: '0 0 0px rgba(59, 130, 246, 0)' },
  animate: {
    boxShadow: ['0 0 4px rgba(59, 130, 246, 0.4)', '0 0 12px rgba(59, 130, 246, 0.2)', '0 0 4px rgba(59, 130, 246, 0.4)'],
    transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
  },
};

// Stagger container for children
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

// Reduced motion - returns static variants (no animation)
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function useReducedMotion(): boolean {
  return prefersReducedMotion();
}

// Get safe variants that respect reduced motion
export function getSafeVariants(variants: Variants): Variants {
  if (prefersReducedMotion()) {
    return { initial: {}, animate: {}, exit: {} };
  }
  return variants;
}
