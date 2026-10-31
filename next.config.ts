import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Support server actions
  experimental: {
    serverActions: {
      allowedOrigins: ['nudge.linaolivetree.com'],
    },
  },
};

export default nextConfig;
