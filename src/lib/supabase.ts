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

// Add global error handling for Supabase
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    errorLogger.logSuccess('User signed in successfully', {
      component: 'supabase-auth',
      action: 'signIn',
      userId: session?.user?.id,
      additionalData: {
        email: session?.user?.email,
        provider: session?.user?.app_metadata?.provider,
      }
    });
  } else if (event === 'SIGNED_OUT') {
    errorLogger.logSuccess('User signed out', {
      component: 'supabase-auth',
      action: 'signOut',
    });
  } else if (event === 'TOKEN_REFRESHED') {
    errorLogger.logSuccess('Auth token refreshed', {
      component: 'supabase-auth',
      action: 'tokenRefresh',
      userId: session?.user?.id,
    });
  }
});

// Note: server-side clients live in supabase-server.ts
