import * as BABYLON from '@babylonjs/core';

export type PipScanlineOptions = {
  scanLineIntensity?: number;
  curvature?: number;
  vignetteIntensity?: number;
  noiseAmount?: number;
};

const DEFAULT_SCAN_LINE_INTENSITY = 0.15;
const DEFAULT_CURVATURE = 0.3;
const DEFAULT_VIGNETTE_INTENSITY = 0.8;
const DEFAULT_NOISE_AMOUNT = 0.03;

const PIP_SCANLINE_FRAGMENT_SHADER = `
precision highp float;

varying vec2 vUV;

uniform sampler2D textureSampler;
uniform float time;
uniform float scanLineIntensity;
uniform float curvature;
uniform float vignetteIntensity;
uniform float noiseAmount;

void main(void) {
  vec2 centeredUv = vUV - 0.5;
  vec2 curvedUv = centeredUv * (1.0 + curvature * length(centeredUv)) + 0.5;

  vec4 sourceColor = texture2D(textureSampler, curvedUv);

  float outsideViewport = step(curvedUv.x, 0.0) + step(1.0, curvedUv.x) + step(curvedUv.y, 0.0) + step(1.0, curvedUv.y);
  sourceColor.rgb *= 1.0 - clamp(outsideViewport, 0.0, 1.0);

  float lineFrequency = 1.35;
  float scanWave = sin((gl_FragCoord.y * lineFrequency) + (time * 2.8));
  float scanLines = 1.0 - (scanLineIntensity * 0.45 * (0.5 + 0.5 * scanWave));

  float distanceFromCenter = length(vUV - 0.5) * 1.4;
  float vignette = 1.0 - vignetteIntensity * smoothstep(0.3, 0.9, distanceFromCenter);

  float grain = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898,78.233))) * 43758.5453);
  float signedGrain = (grain - 0.5) * noiseAmount;

  vec3 color = sourceColor.rgb * scanLines * vignette;
  color += signedGrain;

  gl_FragColor = vec4(clamp(color, 0.0, 1.0), sourceColor.a);
}
`;

BABYLON.Effect.ShadersStore['pipScanlineFragmentShader'] = PIP_SCANLINE_FRAGMENT_SHADER;

export function createPipScanlinePostProcess(
  camera: BABYLON.Camera,
  scene: BABYLON.Scene,
  options: PipScanlineOptions = {},
): BABYLON.PostProcess {
  const scanLineIntensity = options.scanLineIntensity ?? DEFAULT_SCAN_LINE_INTENSITY;
  const curvature = options.curvature ?? DEFAULT_CURVATURE;
  const vignetteIntensity = options.vignetteIntensity ?? DEFAULT_VIGNETTE_INTENSITY;
  const noiseAmount = options.noiseAmount ?? DEFAULT_NOISE_AMOUNT;
  let elapsedSeconds = 0;

  const postProcess = new BABYLON.PostProcess(
    'pipScanlineCRT',
    'pipScanline',
    ['time', 'scanLineIntensity', 'curvature', 'vignetteIntensity', 'noiseAmount'],
    null,
    1.0,
    camera,
  );

  postProcess.onApply = (effect: BABYLON.Effect) => {
    elapsedSeconds += scene.getEngine().getDeltaTime() / 1000;

    effect.setFloat('time', elapsedSeconds);
    effect.setFloat('scanLineIntensity', scanLineIntensity);
    effect.setFloat('curvature', curvature);
    effect.setFloat('vignetteIntensity', vignetteIntensity);
    effect.setFloat('noiseAmount', noiseAmount);
  };

  return postProcess;
}
