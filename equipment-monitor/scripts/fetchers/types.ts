/** Shared types for the asset pipeline fetchers */

export interface FetchResult {
  localPath: string;
  license: string;
  licenseUrl: string;
  attribution: {
    title: string;
    author: string;
    sourceUrl: string;
    downloadDate: string;
  };
}

export interface AssetSpec {
  id: string;
  category: string;
  source?: string;
  source_priority?: SourceEntry[];
  query?: string;
  prompt?: string;
  config?: Record<string, unknown>;
  license_filter?: string[];
  target_path: string;
  format?: string;
  resolution?: string;
  vendor_path?: string;
  min_likes?: number;
  description?: string;
}

export interface SourceEntry {
  source: string;
  query?: string;
  prompt?: string;
  min_likes?: number;
  license_filter?: string[];
  config?: Record<string, unknown>;
}

export interface Fetcher {
  name: string;
  fetch(spec: AssetSpec, sourceEntry?: SourceEntry): Promise<FetchResult>;
  isAvailable(): boolean;
}
