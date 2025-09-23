import type { NextConfig } from "next";
import path from 'path';
import os from 'os';

const nextConfig: NextConfig = {
  // Minimal configuration to avoid path issues
  poweredByHeader: false,
  compress: true,
  
  // Basic image config
  images: {
    formats: ['image/webp'],
  },
  
  // Set output directory to avoid path issues
  distDir: '.next-build',
  
  // Comprehensive webpack config to handle path issues
  webpack(config) {
    // Use memory cache to avoid filesystem path issues
    config.cache = {
      type: 'memory',
    };
    
    // Fix context and output paths to avoid exclamation marks
    const safeDir = path.join(os.tmpdir(), 'next-build-safe');
    config.context = safeDir;
    config.output = config.output || {};
    config.output.path = path.join(safeDir, '.next');
    
    // Fix module rules paths to avoid special characters
    if (config.module && config.module.rules) {
      config.module.rules.forEach((rule: any) => {
        // Fix main rule level paths
        if (rule.resource && typeof rule.resource === 'string' && rule.resource.includes('!')) {
          rule.resource = rule.resource.replace(/\/Users\/gene\/Library\/CloudStorage\/Dropbox\/ !! @Cursor Projects\/@ Vercel Deployment\/TIN FRONT ENDS FOR GOOGLE CLOUD RUN\/AI-Model-As-A-Service-Front-End-Vercel/g, safeDir);
        }
        
        if (rule.include && Array.isArray(rule.include)) {
          rule.include.forEach((includePath: any, index: number) => {
            if (typeof includePath === 'string' && includePath.includes('!')) {
              rule.include[index] = includePath.replace(/\/Users\/gene\/Library\/CloudStorage\/Dropbox\/ !! @Cursor Projects\/@ Vercel Deployment\/TIN FRONT ENDS FOR GOOGLE CLOUD RUN\/AI-Model-As-A-Service-Front-End-Vercel/g, safeDir);
            }
          });
        }
        
        if (rule.test && typeof rule.test === 'string' && rule.test.includes('!')) {
          rule.test = rule.test.replace(/\/Users\/gene\/Library\/CloudStorage\/Dropbox\/ !! @Cursor Projects\/@ Vercel Deployment\/TIN FRONT ENDS FOR GOOGLE CLOUD RUN\/AI-Model-As-A-Service-Front-End-Vercel/g, safeDir);
        }
        
        // Fix oneOf rules
        if (rule.oneOf && Array.isArray(rule.oneOf)) {
          rule.oneOf.forEach((oneOfRule: any) => {
            if (oneOfRule.issuer && oneOfRule.issuer.and && Array.isArray(oneOfRule.issuer.and)) {
              oneOfRule.issuer.and.forEach((issuerPath: any, index: number) => {
                if (typeof issuerPath === 'string' && issuerPath.includes('!')) {
                  oneOfRule.issuer.and[index] = issuerPath.replace(/\/Users\/gene\/Library\/CloudStorage\/Dropbox\/ !! @Cursor Projects\/@ Vercel Deployment\/TIN FRONT ENDS FOR GOOGLE CLOUD RUN\/AI-Model-As-A-Service-Front-End-Vercel/g, safeDir);
                }
              });
            }
            
            if (oneOfRule.include && Array.isArray(oneOfRule.include)) {
              oneOfRule.include.forEach((includePath: any, index: number) => {
                if (typeof includePath === 'string' && includePath.includes('!')) {
                  oneOfRule.include[index] = includePath.replace(/\/Users\/gene\/Library\/CloudStorage\/Dropbox\/ !! @Cursor Projects\/@ Vercel Deployment\/TIN FRONT ENDS FOR GOOGLE CLOUD RUN\/AI-Model-As-A-Service-Front-End-Vercel/g, safeDir);
                }
              });
            }
            
            // Fix test properties
            if (oneOfRule.test && typeof oneOfRule.test === 'string' && oneOfRule.test.includes('!')) {
              oneOfRule.test = oneOfRule.test.replace(/\/Users\/gene\/Library\/CloudStorage\/Dropbox\/ !! @Cursor Projects\/@ Vercel Deployment\/TIN FRONT ENDS FOR GOOGLE CLOUD RUN\/AI-Model-As-A-Service-Front-End-Vercel/g, safeDir);
            }
          });
        }
      });
    }
    
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