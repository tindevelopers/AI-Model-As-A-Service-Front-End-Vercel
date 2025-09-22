import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Minimal configuration to avoid path issues
  poweredByHeader: false,
  compress: true,
  
  // Basic image config
  images: {
    formats: ['image/webp'],
  },
  
  // Minimal webpack config
  webpack(config) {
    // Use memory cache to avoid filesystem path issues
    config.cache = {
      type: 'memory',
    };
    
    // Add SVG handling
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    
    // Ignore problematic packages
    config.module.rules.push({
      test: /packages[\\/]tailadmin[\\/]/,
      use: 'null-loader',
    });
    
    return config;
  },
  
  // Disable static file caching hints
  generateEtags: false,
  httpAgentOptions: { keepAlive: false },
};

export default nextConfig;