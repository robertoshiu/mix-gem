'use client';

import dynamic from 'next/dynamic';
import { ReactNode, Suspense } from 'react';
import { ErrorBoundary } from '@/components/error-boundary';
import { useWebGLSupport } from '@/hooks/use-webgl-support';
import { WebGLFallback } from './WebGLFallback';

const R3FCanvas = dynamic(
  () => import('@react-three/fiber').then((mod) => ({ default: mod.Canvas })),
  { ssr: false },
);

interface FactoryCanvasProps {
  children: ReactNode;
  className?: string;
}

function CanvasLoadingFallback() {
  return (
    <div
      className="flex items-center justify-center h-full w-full"
      style={{ backgroundColor: 'var(--sf-bg-canvas, #0B0F19)' }}
    >
      <div className="rounded-2xl border px-6 py-5 text-center" style={{ borderColor: 'var(--sf-border-default)', backgroundColor: 'var(--sf-surface-card)' }}>
        <p className="animate-pulse text-sm motion-reduce:animate-none" style={{ color: 'var(--sf-text-secondary, #94A3B8)' }}>
          Initializing 3D war room...
        </p>
      </div>
    </div>
  );
}

function CanvasErrorFallback() {
  return <WebGLFallback />;
}

export function FactoryCanvas({ children, className }: FactoryCanvasProps) {
  const webgl = useWebGLSupport();
  const rootClassName = ['factory-canvas-root', className].filter(Boolean).join(' ');

  if (!webgl.supported) {
    return (
      <div className={rootClassName}>
        <WebGLFallback />
      </div>
    );
  }

  return (
    <div className={rootClassName}>
      <ErrorBoundary fallback={<CanvasErrorFallback />}>
        <Suspense fallback={<CanvasLoadingFallback />}>
          <R3FCanvas
            camera={{ position: [22, 18, 22], fov: 50, near: 0.1, far: 140 }}
            frameloop="always"
            dpr={[1, 1.5]}
            gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
            style={{
              width: '100%',
              height: '100%',
              minHeight: 'inherit',
              backgroundColor: 'var(--sf-bg-canvas, #0B0F19)',
            }}
          >
            {children}
          </R3FCanvas>
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
