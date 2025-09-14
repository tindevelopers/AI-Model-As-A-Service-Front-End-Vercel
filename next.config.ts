import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  // Simplified config for better CI/CD compatibility
  
  // Basic optimizations only
  poweredByHeader: false,
  compress: true,
  
  // Enable build caching for faster builds
  distDir: '.next',
  
  // Set output file tracing root to fix workspace detection warning
  outputFileTracingRoot: path.join(__dirname),
  
  // Minimal experimental features to reduce build complexity
  experimental: {
    // Disable optimizePackageImports to avoid resolution quirks on Vercel
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
    // Removed simplebar-core alias after dropping SimpleBar dependency
    
    // Enable persistent caching with proper configuration
    // Only enable filesystem cache in development to avoid CI/CD issues
    if (process.env.NODE_ENV === 'development') {
      config.cache = {
        type: 'filesystem',
        cacheDirectory: path.join(__dirname, '.next/cache/webpack'),
        buildDependencies: {
          config: [__filename],
        },
      };
    }
    
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
  // Disable static file caching hints to avoid stale deploys in Vercel edge cache
  generateEtags: false,
  httpAgentOptions: { keepAlive: false },
};

export default nextConfig;