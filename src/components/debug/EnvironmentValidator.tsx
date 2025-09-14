'use client';

import React, { useEffect } from 'react';
import { useErrorLogger } from '@/hooks/useErrorLogger';

export function EnvironmentValidator() {
  const { logEnvironmentCheck, logWarning } = useErrorLogger({
    componentName: 'EnvironmentValidator',
    autoCheckEnvironment: false,
  });

  useEffect(() => {
    // Check environment on mount
    const checks = logEnvironmentCheck();
    
    // Log specific warnings for missing configurations
    const missingSupabaseUrl = !process.env.NEXT_PUBLIC_SUPABASE_URL;
    const missingSupabaseKey = !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const missingGatewayUrl = !process.env.NEXT_PUBLIC_GATEWAY_URL;

    if (missingSupabaseUrl || missingSupabaseKey) {
      logWarning('Supabase environment variables not properly configured. Some features may not work.', {
        action: 'environmentValidation',
        additionalData: {
          missingSupabaseUrl,
          missingSupabaseKey,
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
          supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'present' : 'missing',
        }
      });
    }

    if (missingGatewayUrl) {
      logWarning('Gateway URL not configured. API calls will not work.', {
        action: 'environmentValidation',
        additionalData: {
          gatewayUrl: process.env.NEXT_PUBLIC_GATEWAY_URL,
        }
      });
    }

    // Log success if all required variables are present
    if (!missingSupabaseUrl && !missingSupabaseKey && !missingGatewayUrl) {
      console.log('✅ All environment variables are properly configured');
    }
  }, [logEnvironmentCheck, logWarning]);

  // This component doesn't render anything visible
  return null;
}
