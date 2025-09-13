import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Simplified config for better CI/CD compatibility
  
  // Basic optimizations only
  poweredByHeader: false,
  compress: true,
  
  // Enable build caching for faster builds
  distDir: '.next',
  
  // Minimal experimental features to reduce build complexity
  experimental: {
    optimizePackageImports: ['@supabase/supabase-js'],
  },
  
  // Basic image config
  images: {
    formats: ['image/webp'],
  },
  
  // Configure caching
  onDemandEntries: {
    // period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },
  
  webpack(config) {
    // Enable persistent caching with proper configuration
    config.cache = {
      type: 'filesystem',
      cacheDirectory: '.next/cache/webpack',
      buildDependencies: {
        config: [__filename],
      },
    };
    
    // Reduce memory usage during build
    config.optimization = {
      ...config.optimization,
      minimize: process.env.NODE_ENV === 'production',
    };
    
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    
    return config;
  },
};

export default nextConfig;