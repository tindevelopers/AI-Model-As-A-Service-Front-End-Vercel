import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Absolute minimal configuration for Vercel compatibility
  poweredByHeader: false,
  
  // Basic image config
  images: {
    formats: ['image/webp'],
  },
  
  // Disable webpack cache to avoid path issues
  webpack: (config: any) => {
    // Disable cache to avoid exclamation mark issues
    config.cache = false;
    
    return config;
  },
};

export default nextConfig;