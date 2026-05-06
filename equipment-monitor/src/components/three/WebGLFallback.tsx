'use client';

import { AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface WebGLFallbackProps {
  /** Optional link for troubleshooting or documentation */
  learnMoreHref?: string;
}

/**
 * Fallback card displayed when WebGL is unavailable.
 * Uses dark theme CSS tokens (var(--sf-*)).
 */
export function WebGLFallback({
  learnMoreHref = '#',
}: WebGLFallbackProps) {
  return (
    <Card
      role="alert"
      aria-label="WebGL not available"
      className="flex flex-col items-center gap-4 p-8 text-center"
      style={{
        backgroundColor: 'var(--sf-surface, #1a1a2e)',
        borderColor: 'var(--sf-border, #2a2a3e)',
        color: 'var(--sf-text-primary, #e2e8f0)',
      }}
    >
      <AlertTriangle
        className="h-12 w-12"
        style={{ color: 'var(--sf-warning, #f59e0b)' }}
        aria-hidden="true"
      />
      <h2
        className="text-lg font-semibold"
        style={{ color: 'var(--sf-text-primary, #e2e8f0)' }}
      >
        WebGL Not Available
      </h2>
      <p
        className="max-w-sm text-sm"
        style={{ color: 'var(--sf-text-muted, #94a3b8)' }}
      >
        WebGL is required for 3D visualization. Please use a modern browser or
        enable hardware acceleration.
      </p>
      <a
        href={learnMoreHref}
        className="text-sm underline underline-offset-4 transition-colors hover:opacity-80"
        style={{ color: 'var(--sf-link, #60a5fa)' }}
        aria-label="Learn more about WebGL requirements"
      >
        Learn more
      </a>
    </Card>
  );
}
