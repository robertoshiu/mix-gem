/**
 * Shared Unicode symbol constants for analytics labels, formulas, and units.
 *
 * Centralizes the special characters used across analytics charts, axis labels,
 * and statistical/process formulas so they render consistently and are easy to
 * audit. Prefer importing `SYM` over inlining raw Unicode in component strings.
 */
export const SYM = {
  /** Greek small letter lambda (failure rate, wavelength). */
  lambda: 'λ',
  /** Micro sign (mean, micro-prefix). */
  mu: 'µ',
  /** Greek small letter alpha (significance level, coefficient). */
  alpha: 'α',
  /** Subscript zero (e.g. baseline x₀). */
  sub0: '₀',
  /** Superscript two (e.g. R², units squared). */
  sup2: '²',
  /** Plus-minus sign (tolerance bands). */
  plusminus: '±',
  /** Left-right arrow (correlation / bidirectional relationship). */
  leftright: '↔',
  /** Up arrow (maximize direction). */
  arrowUp: '↑',
  /** Down arrow (minimize direction). */
  arrowDown: '↓',
  /** Greater-than-or-equal sign (thresholds). */
  gte: '≥',
  /** Degree sign (temperature, angles). */
  deg: '°',
  /** Multiplication sign (factors, dimensions). */
  times: '×',
  /** Em dash (separators, ranges). */
  dash: '—',
} as const;
