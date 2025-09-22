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
  outputFileTracingRoot: process.cwd(),
  
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
    
    // Disable filesystem cache to avoid path issues with special characters
    // Use memory cache instead for better compatibility
    config.cache = {
      type: 'memory',
    };
    
    // Override problematic paths to avoid special characters
    const os = require('os');
    const safeDir = path.join(os.tmpdir(), 'next-build-safe');
    
    // Don't override context - just fix the problematic paths in the configuration
    
    // Reduce memory usage during build
    config.optimization = {
      ...config.optimization,
      minimize: process.env.NODE_ENV === 'production',
    };
    
    config.module.rules.push({
      test: /packages[\\/]tailadmin[\\/]/,
      use: 'null-loader',
    });
    
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    
    // Fix module rules paths to avoid special characters
    config.module.rules.forEach((rule) => {
      // Fix main rule level paths
      if (rule.resource && typeof rule.resource === 'string' && rule.resource.includes('!')) {
        rule.resource = rule.resource.replace(/\/Users\/gene\/Library\/CloudStorage\/Dropbox\/ !! @Cursor Projects\/@ Vercel Deployment\/TIN FRONT ENDS FOR GOOGLE CLOUD RUN\/AI-Model-As-A-Service-Front-End-Vercel/g, safeDir);
      }
      
      if (rule.oneOf) {
        rule.oneOf.forEach((oneOfRule) => {
          // Fix issuer paths
          if (oneOfRule.issuer && oneOfRule.issuer.and) {
            oneOfRule.issuer.and = oneOfRule.issuer.and.map((issuerPath) => {
              if (typeof issuerPath === 'string' && issuerPath.includes('!')) {
                return safeDir;
              }
              return issuerPath;
            });
          }
          // Fix include paths
          if (oneOfRule.include) {
            oneOfRule.include = oneOfRule.include.map((includePath) => {
              if (typeof includePath === 'string' && includePath.includes('!')) {
                return safeDir;
              }
              return includePath;
            });
          }
          // Fix test paths
          if (oneOfRule.test) {
            if (typeof oneOfRule.test === 'string' && oneOfRule.test.includes('!')) {
              oneOfRule.test = oneOfRule.test.replace(/\/Users\/gene\/Library\/CloudStorage\/Dropbox\/ !! @Cursor Projects\/@ Vercel Deployment\/TIN FRONT ENDS FOR GOOGLE CLOUD RUN\/AI-Model-As-A-Service-Front-End-Vercel/g, safeDir);
            }
          }
          // Fix resource paths
          if (oneOfRule.resource) {
            if (typeof oneOfRule.resource === 'string' && oneOfRule.resource.includes('!')) {
              oneOfRule.resource = oneOfRule.resource.replace(/\/Users\/gene\/Library\/CloudStorage\/Dropbox\/ !! @Cursor Projects\/@ Vercel Deployment\/TIN FRONT ENDS FOR GOOGLE CLOUD RUN\/AI-Model-As-A-Service-Front-End-Vercel/g, safeDir);
            }
          }
        });
      }
    });
    
    return config;
  },
  // Disable static file caching hints to avoid stale deploys in Vercel edge cache
  generateEtags: false,
  httpAgentOptions: { keepAlive: false },
};

export default nextConfig;