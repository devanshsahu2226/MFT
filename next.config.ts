import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  
  // PWA Manifest ke liye headers
  async headers() {
    return [
      {
        source: '/manifest.json',
        headers: [
          { 
            key: 'Content-Type', 
            value: 'application/manifest+json' 
          },
        ],
      },
    ];
  },
  
  // Images optimization (optional)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;