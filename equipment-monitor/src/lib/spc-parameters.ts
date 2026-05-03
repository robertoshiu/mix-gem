import type { SpcParameter } from './mes-types';

export interface SpcParamConfig {
  target: number;
  sigma: number;
  unit: string;
  label: string;
  ucl: number;
  lcl: number;
}

export const SPC_PARAMETERS: Record<SpcParameter, SpcParamConfig> = {
  cd:    { target: 45.0, sigma: 1.0, unit: 'nm', label: 'Critical Dimension', ucl: 48.0, lcl: 42.0 },
  cdu:   { target: 2.0,  sigma: 0.3, unit: 'nm', label: 'CD Uniformity',       ucl: 2.9,  lcl: 1.1  },
  ovl_x: { target: 0.0,  sigma: 1.0, unit: 'nm', label: 'Overlay X',           ucl: 3.0,  lcl: -3.0 },
  ovl_y: { target: 0.0,  sigma: 1.0, unit: 'nm', label: 'Overlay Y',           ucl: 3.0,  lcl: -3.0 },
  ler:   { target: 3.0,  sigma: 0.5, unit: 'nm', label: 'Line Edge Roughness', ucl: 4.5,  lcl: 1.5  },
};

export const SPC_PARAM_KEYS = Object.keys(SPC_PARAMETERS) as SpcParameter[];
