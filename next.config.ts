import type { NextConfig } from 'next';
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Support server actions
  experimental: {
    serverActions: {
      allowedOrigins: ['nudge.linaoliveira.dev'],
    },
  },
};

export default nextConfig;

initOpenNextCloudflareForDev();
