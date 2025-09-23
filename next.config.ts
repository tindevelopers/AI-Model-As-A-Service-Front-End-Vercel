import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Minimal configuration to avoid path issues
  poweredByHeader: false,
  compress: true,
  
  // Basic image config
  images: {
    formats: ['image/webp'],
  },
  
  // Minimal webpack config - disable for Vercel compatibility
  ...(process.env.VERCEL ? {} : {
    webpack(config: any) {
      // Only apply webpack config locally, not on Vercel
      config.cache = {
        type: 'memory',
      };
      
      // Ignore problematic packages
      config.module.rules.push({
        test: /packages[\\/]tailadmin[\\/]/,
        use: 'null-loader',
      });
      
      return config;
    }
  }),
  
  // Disable static file caching hints
  generateEtags: false,
  httpAgentOptions: { keepAlive: false },
};

export default nextConfig;