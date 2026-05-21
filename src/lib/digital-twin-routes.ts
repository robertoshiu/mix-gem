import type { ProcessId } from './fab-process-data';

/** Map of processes that have a digital twin sub-route */
export const DIGITAL_TWIN_ROUTES: Partial<Record<ProcessId, string>> = {
  lithography: '/mes/fab-floor/lithography/lens-sim',
  deposition: '/mes/fab-floor/deposition/reactor-sim',
  metallization: '/mes/fab-floor/metallization/damascene-sim',
  etching: '/mes/fab-floor/etching/etch-sim',
  cmp: '/mes/fab-floor/cmp/planarization-sim',
  implant: '/mes/fab-floor/implant/implant-sim',
  diffusion: '/mes/fab-floor/diffusion/diffusion-sim',
};
