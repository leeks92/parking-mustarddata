import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  compress: true,
  poweredByHeader: false,
  staticPageGenerationTimeout: 180,
};

export default nextConfig;
