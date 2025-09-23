import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Absolute minimal configuration for Vercel compatibility
  poweredByHeader: false,
  
  // Basic image config
  images: {
    formats: ['image/webp'],
  },
};

export default nextConfig;