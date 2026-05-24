import type { NextConfig } from "next";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/mix-gem',
  trailingSlash: true,
  turbopack: {
    root: projectRoot,
  },
  images: {
    unoptimized: true,
  },
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei', '@babylonjs/core', '@babylonjs/gui'],
};

export default nextConfig;
