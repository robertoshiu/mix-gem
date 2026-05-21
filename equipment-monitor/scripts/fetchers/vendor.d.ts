declare module 'occt-import-js' {
  interface OcctResult {
    success: boolean;
    meshes: Array<{
      indices: Uint32Array | number[];
      attributes: {
        position: { array: Float32Array | number[] };
        normal?: { array: Float32Array | number[] };
      };
    }>;
  }

  interface OcctInstance {
    ReadStepFile(data: Uint8Array, params: null): OcctResult;
  }

  export default function init(): Promise<OcctInstance>;
}

declare module 'yaml' {
  export function parse(input: string): unknown;
  export function stringify(value: unknown): string;
}
