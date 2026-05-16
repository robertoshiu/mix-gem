import * as BABYLON from '@babylonjs/core';

const HOLOGRAPHIC_VERTEX_SHADER = `
precision highp float;

attribute vec3 position;
attribute vec3 normal;

uniform mat4 world;
uniform mat4 worldViewProjection;
uniform float time;
uniform float flickerIntensity;

varying vec3 vWorldNormal;
varying vec3 vWorldPosition;
varying vec3 vLocalPosition;

void main() {
  vec3 displaced = position;
  float flicker = sin(time * 18.7 + position.y * 4.0) * flickerIntensity * 0.003;
  displaced += normal * flicker;

  vLocalPosition = displaced;
  vWorldNormal = normalize((world * vec4(normal, 0.0)).xyz);
  vWorldPosition = (world * vec4(displaced, 1.0)).xyz;

  gl_Position = worldViewProjection * vec4(displaced, 1.0);
}
`;

const HOLOGRAPHIC_FRAGMENT_SHADER = `
precision highp float;

uniform vec3 baseColor;
uniform vec3 cameraPosition;
uniform float time;
uniform float fresnelPower;
uniform float scanLineSpacing;
uniform float scanLineSpeed;
uniform float alphaCenter;
uniform float alphaEdge;
uniform float gridStrength;

varying vec3 vWorldNormal;
varying vec3 vWorldPosition;
varying vec3 vLocalPosition;

void main() {
  vec3 viewDir = normalize(cameraPosition - vWorldPosition);
  float fresnel = pow(1.0 - max(dot(vWorldNormal, viewDir), 0.0), fresnelPower);

  float scanLine = sin((vWorldPosition.y + time * scanLineSpeed) * scanLineSpacing);
  scanLine = smoothstep(0.2, 0.8, scanLine * 0.5 + 0.5);
  float scanDim = mix(0.7, 1.0, scanLine);

  uniform float gridScale;
  float gridX = step(0.96, fract(vLocalPosition.x * gridScale));
  float gridZ = step(0.96, fract(vLocalPosition.z * gridScale));
  float grid = max(gridX, gridZ) * gridStrength;

  float alpha = mix(alphaCenter, alphaEdge, fresnel);
  vec3 color = baseColor * (0.4 + fresnel * 0.8) * scanDim;
  color += baseColor * grid * 0.5;
  color += baseColor * fresnel * 0.6;

  gl_FragColor = vec4(color, alpha);
}
`;

BABYLON.Effect.ShadersStore['holographicVertexShader'] = HOLOGRAPHIC_VERTEX_SHADER;
BABYLON.Effect.ShadersStore['holographicFragmentShader'] = HOLOGRAPHIC_FRAGMENT_SHADER;

export interface HolographicOptions {
  baseColor: string;
  fresnelPower?: number;
  scanLineSpacing?: number;
  scanLineSpeed?: number;
  alphaCenter?: number;
  alphaEdge?: number;
  flickerIntensity?: number;
  gridStrength?: number;
  gridScale?: number;
}

function createHolographicMaterial(
  scene: BABYLON.Scene,
  name: string,
  options: Required<HolographicOptions>,
): BABYLON.ShaderMaterial {
  const material = new BABYLON.ShaderMaterial(name, scene, 'holographic', {
    attributes: ['position', 'normal'],
    uniforms: [
      'world', 'worldViewProjection', 'cameraPosition', 'time',
      'baseColor', 'fresnelPower', 'scanLineSpacing', 'scanLineSpeed',
      'alphaCenter', 'alphaEdge', 'flickerIntensity', 'gridStrength', 'gridScale',
    ],
    needAlphaBlending: true,
  });

  const color = BABYLON.Color3.FromHexString(options.baseColor);
  material.setColor3('baseColor', color);
  material.setFloat('fresnelPower', options.fresnelPower);
  material.setFloat('scanLineSpacing', options.scanLineSpacing);
  material.setFloat('scanLineSpeed', options.scanLineSpeed);
  material.setFloat('alphaCenter', options.alphaCenter);
  material.setFloat('alphaEdge', options.alphaEdge);
  material.setFloat('flickerIntensity', options.flickerIntensity);
  material.setFloat('gridStrength', options.gridStrength);
  material.setFloat('gridScale', options.gridScale);
  material.setFloat('time', 0);

  material.backFaceCulling = false;
  material.alphaMode = BABYLON.Constants.ALPHA_COMBINE;

  return material;
}

export function createPersonnelHolographicMaterial(
  scene: BABYLON.Scene,
  name: string,
  options: HolographicOptions,
): BABYLON.ShaderMaterial {
  return createHolographicMaterial(scene, name, {
    baseColor: options.baseColor,
    fresnelPower: options.fresnelPower ?? 2.5,
    scanLineSpacing: options.scanLineSpacing ?? 12.0,
    scanLineSpeed: options.scanLineSpeed ?? 0.8,
    alphaCenter: options.alphaCenter ?? 0.7,
    alphaEdge: options.alphaEdge ?? 1.0,
    flickerIntensity: options.flickerIntensity ?? 1.0,
    gridStrength: options.gridStrength ?? 0.0,
    gridScale: options.gridScale ?? 2.0,
  });
}

export function createEquipmentHolographicMaterial(
  scene: BABYLON.Scene,
  name: string,
  options: HolographicOptions,
): BABYLON.ShaderMaterial {
  return createHolographicMaterial(scene, name, {
    baseColor: options.baseColor,
    fresnelPower: options.fresnelPower ?? 3.0,
    scanLineSpacing: options.scanLineSpacing ?? 8.0,
    scanLineSpeed: options.scanLineSpeed ?? 0.4,
    alphaCenter: options.alphaCenter ?? 0.3,
    alphaEdge: options.alphaEdge ?? 0.85,
    flickerIntensity: options.flickerIntensity ?? 0.5,
    gridStrength: options.gridStrength ?? 0.6,
    gridScale: options.gridScale ?? 0.5,
  });
}

export function updateHolographicTime(material: BABYLON.ShaderMaterial, time: number) {
  material.setFloat('time', time);
}

export function updateHolographicColor(material: BABYLON.ShaderMaterial, color: string) {
  material.setColor3('baseColor', BABYLON.Color3.FromHexString(color));
}
