'use client';

import { useMemo } from 'react';

export type WebGLVersion = 'webgl' | 'webgl2' | null;

export interface WebGLSupportInfo {
  supported: boolean;
  version: WebGLVersion;
  isSoftwareRenderer: boolean;
}

/**
 * Detects WebGL support and software renderer fallback.
 * SSR-safe: returns safe defaults when window is unavailable.
 */
export function useWebGLSupport(): WebGLSupportInfo {
  return useMemo(() => {
    // SSR guard
    if (typeof window === 'undefined') {
      return { supported: false, version: null, isSoftwareRenderer: false };
    }

    const canvas = document.createElement('canvas');

    // Try WebGL2 first
    let gl: WebGLRenderingContext | WebGL2RenderingContext | null =
      canvas.getContext('webgl2');
    let version: WebGLVersion = 'webgl2';

    if (!gl) {
      // Fallback to WebGL1
      gl = canvas.getContext('webgl') as WebGLRenderingContext | null;
      version = 'webgl';
    }

    if (!gl) {
      return { supported: false, version: null, isSoftwareRenderer: false };
    }

    // Check for software renderer via WEBGL_debug_renderer_info
    let isSoftwareRenderer = false;
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      // Common software renderer identifiers
      isSoftwareRenderer =
        /swiftshader|software|llvmpipe|mesa\s+software/i.test(renderer);
    }

    return { supported: true, version, isSoftwareRenderer };
  }, []);
}