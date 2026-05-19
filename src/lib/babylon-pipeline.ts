import * as BABYLON from '@babylonjs/core';
import { DefaultRenderingPipeline, GlowLayer } from '@babylonjs/core';

type SSRRenderingPipeline = BABYLON.SSRRenderingPipeline;
type SSAO2RenderingPipeline = BABYLON.SSAO2RenderingPipeline;

export interface PipelineOptions {
  bloomThreshold?: number;
  bloomWeight?: number;
  bloomKernel?: number;
  grainIntensity?: number;
  chromaticAberration?: number;
  vignetteWeight?: number;
  glowIntensity?: number;
  glowKernel?: number;
  glowTextureSize?: number;
  enableSSR?: boolean;
  enableSSAO?: boolean;
}

export function createCinematicPipeline(
  scene: BABYLON.Scene,
  camera: BABYLON.Camera,
  options: PipelineOptions = {},
): {
  pipeline: DefaultRenderingPipeline;
  glow: GlowLayer;
  ssr?: SSRRenderingPipeline;
  ssao?: SSAO2RenderingPipeline;
} {
  const glow = new GlowLayer('cinematic-glow', scene, {
    blurKernelSize: options.glowKernel ?? 16,
    mainTextureFixedSize: options.glowTextureSize,
  });
  glow.intensity = options.glowIntensity ?? 0.62;

  const pipeline = new DefaultRenderingPipeline('cinematic-pipeline', true, scene, [camera]);
  pipeline.fxaaEnabled = true;
  pipeline.bloomEnabled = true;
  pipeline.bloomThreshold = options.bloomThreshold ?? 0.78;
  pipeline.bloomWeight = options.bloomWeight ?? 0.32;
  if (options.bloomKernel !== undefined) {
    pipeline.bloomKernel = options.bloomKernel;
  }
  pipeline.grainEnabled = true;
  pipeline.grain.intensity = options.grainIntensity ?? 4;
  pipeline.chromaticAberrationEnabled = true;
  pipeline.chromaticAberration.aberrationAmount = options.chromaticAberration ?? 8;
  if (options.vignetteWeight !== undefined) {
    const vignettePipeline = pipeline as DefaultRenderingPipeline & {
      vignetteEnabled: boolean;
      vignetteWeight: number;
    };
    vignettePipeline.vignetteEnabled = true;
    vignettePipeline.vignetteWeight = options.vignetteWeight;
  }

  let ssr: SSRRenderingPipeline | undefined;
  if (options.enableSSR) {
    let createdSsr: SSRRenderingPipeline | undefined;
    try {
      createdSsr = new BABYLON.SSRRenderingPipeline(
        'cinematic-ssr',
        scene,
        [camera],
        false,
        BABYLON.Constants.TEXTURETYPE_UNSIGNED_BYTE,
      );
      createdSsr.maxSteps = 64;
      createdSsr.step = 1;
      createdSsr.enableSmoothReflections = true;
      createdSsr.useFresnel = true;
      createdSsr.blurDispersionStrength = 0.3;
      ssr = createdSsr;
    } catch (e) {
      createdSsr?.dispose();
      console.warn('[babylon-pipeline] SSR not supported on this GPU, disabling:', e);
      ssr = undefined;
    }
  }

  let ssao: SSAO2RenderingPipeline | undefined;
  if (options.enableSSAO) {
    let createdSsao: SSAO2RenderingPipeline | undefined;
    try {
      createdSsao = new BABYLON.SSAO2RenderingPipeline(
        'cinematic-ssao2',
        scene,
        0.75,
        [camera],
      );
      createdSsao.totalStrength = 0.8;
      createdSsao.radius = 0.5;
      createdSsao.samples = 16;
      createdSsao.maxZ = 100;
      ssao = createdSsao;
    } catch (e) {
      createdSsao?.dispose();
      console.warn('[babylon-pipeline] SSAO not supported on this GPU, disabling:', e);
      ssao = undefined;
    }
  }

  return { pipeline, glow, ssr, ssao };
}
