import type { SimulationParams } from './types';
import { ETCH_PROFILE_POINTS } from './constants';

export interface EtchProfileResult {
  profile: number[];
  etchDepth: number;
  profileAngle: number;
  isIsotropic: boolean;
}

export function computeEtchProfile(
  prevProfile: number[],
  gasRatio: number,
  ionAngle: number,
  ionEnergy: number,
  etchRateNmMin: number,
  dt: number,
  params: SimulationParams,
): EtchProfileResult {
  const profile = [...prevProfile];
  const n = ETCH_PROFILE_POINTS;
  const center = (n - 1) / 2;
  const isAnisotropic = gasRatio > 0.6;
  const isIsotropic = gasRatio < 0.3;
  const passivationStrength = 1 - gasRatio;
  const profileAngle = Math.min(90, 90 - ionAngle + passivationStrength * 5);
  const trenchDepth = params.trenchWidth * params.aspectRatio;
  const removalRate = (etchRateNmMin / 60) * dt / Math.max(trenchDepth / n, 1);
  const removal = Math.min(removalRate, 0.05);
  const microLoading = Math.min(1, Math.max(0.3, params.trenchWidth / 200));

  for (let i = 0; i < n; i++) {
    if (profile[i] <= 0) continue;
    const distFromCenter = Math.abs(i - center) / center;
    let localRemoval = removal * microLoading;
    if (isAnisotropic) {
      localRemoval *= (1 - distFromCenter * 0.3);
    } else if (isIsotropic) {
      localRemoval *= 1.0;
    } else {
      localRemoval *= (1 - distFromCenter * 0.6);
    }
    profile[i] = Math.max(0, profile[i] - localRemoval);
  }

  const avgRemoved = 1 - profile.reduce((s, v) => s + v, 0) / n;
  const etchDepth = avgRemoved * trenchDepth;
  return { profile, etchDepth, profileAngle, isIsotropic };
}
