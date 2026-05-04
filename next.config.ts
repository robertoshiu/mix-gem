import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/mix-gem',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
