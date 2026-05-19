'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { RefObject } from 'react';

const FOCUSABLE_SELECTOR =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * Focus-trap hook for dialog/overlay panels.
 *
 * - On open: saves the previously-focused element, waits one frame,
 *   then moves focus into the dialog (preferring the close button).
 * - Traps Tab / Shift+Tab inside the dialog boundary.
 * - Escape calls `onClose`.
 * - On close: restores focus to the saved element and removes listeners.
 */
export function useDialogFocusTrap(
  dialogRef: RefObject<HTMLElement | null>,
  isOpen: boolean,
  onClose: () => void,
): void {
  const previouslyFocusedRef = useRef<Element | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Focus management on open / close
  useEffect(() => {
    if (!isOpen) {
      // Restore focus when dialog closes
      const el = previouslyFocusedRef.current as HTMLElement | null;
      if (el && typeof el.focus === 'function') {
        el.focus();
      }
      previouslyFocusedRef.current = null;
      return;
    }

    // Save current active element before dialog opens
    previouslyFocusedRef.current = document.activeElement;

    // Wait for the next paint so the dialog is in the DOM
    const rafId = requestAnimationFrame(() => {
      const dialog = dialogRef.current;
      if (!dialog) return;

      // Prefer the close button, otherwise first focusable element
      const closeBtn = dialog.querySelector<HTMLButtonElement>(
        'button[aria-label="Close panel"]',
      );
      const firstFocusable = closeBtn ?? dialog.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      firstFocusable?.focus();
    });

    return () => cancelAnimationFrame(rafId);
  }, [isOpen, dialogRef]);

  // Keyboard handler (Escape + Tab trap)
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }

      if (e.key !== 'Tab') return;

      const dialog = dialogRef.current;
      if (!dialog) return;

      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [dialogRef],
  );

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, handleKeyDown]);
}