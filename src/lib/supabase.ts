import { createClient } from '@supabase/supabase-js'
import { errorLogger } from '@/utils/errorLogger'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

// Only throw error if we're in a browser environment and values are still placeholders
const isValidConfig = supabaseUrl !== 'https://placeholder.supabase.co' && supabaseAnonKey !== 'placeholder-key'

if (typeof window !== 'undefined' && !isValidConfig) {
  errorLogger.logWarning('Supabase environment variables not properly configured. Some features may not work.', {
    component: 'supabase-client',
    action: 'initialization',
    additionalData: {
      hasValidUrl: supabaseUrl !== 'https://placeholder.supabase.co',
      hasValidKey: supabaseAnonKey !== 'placeholder-key',
      url: supabaseUrl,
      keyPrefix: supabaseAnonKey.substring(0, 10) + '...',
    }
  });
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'pkce',
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Note: Auth state change handling is done in AuthContext to avoid conflicts

// Note: server-side clients live in supabase-server.ts
