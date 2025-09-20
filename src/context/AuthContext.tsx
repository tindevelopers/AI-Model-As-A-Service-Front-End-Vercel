'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase'
import { errorLogger } from '@/utils/errorLogger'
import { sessionDebugger } from '@/utils/sessionDebugger'

interface UserMetadata {
  full_name?: string
  [key: string]: unknown
}

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, userData?: UserMetadata) => Promise<{ error: AuthError | null }>
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<{ error: AuthError | null }>
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [recoveryAttempted, setRecoveryAttempted] = useState(false)
  
  // Create client instance
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      console.log('Initial session check:', { hasSession: !!session, userId: session?.user?.id })
      
      // Log initial session state
      sessionDebugger.logSessionState(session, session?.user, 'INITIAL_SESSION')
      
      // If no session but we have Supabase auth token cookies, try to recover
      if (!session && !recoveryAttempted) {
        const authSessionEstablished = document.cookie.includes('auth-session-established=true')
        const hasSupabaseAuthToken = document.cookie.includes('sb-') && document.cookie.includes('auth-token')
        const hasSupabaseCookies = document.cookie.includes('supabase')
        
        console.log('🔍 Session recovery check:', { 
          hasSession: !!session, 
          hasAuthCookie: authSessionEstablished,
          hasSupabaseAuthToken,
          hasSupabaseCookies,
          recoveryAttempted,
          shouldAttemptRecovery: authSessionEstablished || hasSupabaseAuthToken || hasSupabaseCookies
        })
        
        if (authSessionEstablished || hasSupabaseAuthToken || hasSupabaseCookies) {
          setRecoveryAttempted(true) // Prevent multiple recovery attempts
          console.log('🔄 Auth session cookie found, attempting session recovery...')
          console.log('🔄 Recovery attempt started at:', new Date().toISOString())
          
          // Try multiple recovery methods
          try {
            // Method 1: Try to refresh the session (this should work with httpOnly cookies)
            const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession()
            console.log('🔄 Refresh session result:', { 
              hasSession: !!refreshedSession, 
              error: refreshError?.message 
            })
            
            if (refreshedSession) {
              console.log('✅ Session recovered via refresh:', { hasSession: !!refreshedSession, userId: refreshedSession?.user?.id })
              sessionDebugger.logSessionState(refreshedSession, refreshedSession?.user, 'SESSION_RECOVERED')
              setSession(refreshedSession)
              setUser(refreshedSession?.user ?? null)
              setLoading(false)
              return
            }
            
            // Method 2: Try to get session again (in case it was just delayed)
            const { data: { session: retrySession } } = await supabase.auth.getSession()
            console.log('🔄 Retry get session result:', { hasSession: !!retrySession })
            
            if (retrySession) {
              console.log('✅ Session recovered via retry:', { hasSession: !!retrySession, userId: retrySession?.user?.id })
              sessionDebugger.logSessionState(retrySession, retrySession?.user, 'SESSION_RECOVERED_RETRY')
              setSession(retrySession)
              setUser(retrySession?.user ?? null)
              setLoading(false)
              return
            }
            
            // Method 3: Try to manually extract session from cookies (now that auth tokens are accessible)
            console.log('🔄 Attempting manual session extraction from cookies...')
            const cookies = document.cookie.split(';').reduce((acc, cookie) => {
              const [name, value] = cookie.trim().split('=');
              acc[name] = value;
              return acc;
            }, {} as Record<string, string>);
            
            console.log('🍪 Available cookies:', Object.keys(cookies));
            
            // Look for Supabase auth token cookies
            const authTokenCookie = Object.keys(cookies).find(key => 
              key.includes('supabase') && key.includes('auth-token')
            );
            
            // Also check for the new format cookies we set in the callback
            const accessToken = cookies['supabase-auth-token'];
            const refreshToken = cookies['supabase-refresh-token'];
            
            console.log('🍪 Token extraction:', {
              hasAuthTokenCookie: !!authTokenCookie,
              hasAccessToken: !!accessToken,
              hasRefreshToken: !!refreshToken,
              authTokenCookieName: authTokenCookie
            });
            
            // Try the new format first (direct token cookies)
            if (accessToken && refreshToken) {
              console.log('🔄 Attempting session recovery with direct token cookies...');
              try {
                const { data: { session: directSession }, error: directError } = await supabase.auth.setSession({
                  access_token: accessToken,
                  refresh_token: refreshToken
                });
                
                console.log('🔄 Direct token recovery result:', { 
                  hasSession: !!directSession, 
                  error: directError?.message 
                });
                
                if (directSession) {
                  console.log('✅ Session recovered via direct tokens:', { hasSession: !!directSession, userId: directSession?.user?.id });
                  sessionDebugger.logSessionState(directSession, directSession?.user, 'SESSION_RECOVERED_DIRECT');
                  setSession(directSession);
                  setUser(directSession?.user ?? null);
                  setLoading(false);
                  return;
                }
              } catch (error) {
                console.error('❌ Direct token recovery error:', error);
              }
            }
            
            if (authTokenCookie) {
              console.log('🔑 Found auth token cookie:', authTokenCookie);
              try {
                let tokenData;
                const cookieValue = cookies[authTokenCookie];
                
                // Handle base64-encoded cookies (new format)
                if (cookieValue.startsWith('base64-')) {
                  console.log('🔑 Detected base64-encoded cookie, decoding...');
                  const base64Data = cookieValue.replace('base64-', '');
                  const decodedData = atob(base64Data);
                  tokenData = JSON.parse(decodedData);
                } else {
                  // Handle URL-encoded cookies (old format)
                  tokenData = JSON.parse(decodeURIComponent(cookieValue));
                }
                
                console.log('🔑 Token data:', { 
                  hasAccessToken: !!tokenData.access_token,
                  hasRefreshToken: !!tokenData.refresh_token,
                  expiresAt: tokenData.expires_at,
                  userId: tokenData.user?.id,
                  userEmail: tokenData.user?.email,
                  tokenType: tokenData.token_type
                });
                
                if (tokenData.access_token && tokenData.refresh_token) {
                  // Try to set the session manually
                  const { data: { session: manualSession }, error: manualError } = await supabase.auth.setSession({
                    access_token: tokenData.access_token,
                    refresh_token: tokenData.refresh_token
                  });
                  
                  console.log('🔄 Manual session set result:', { 
                    hasSession: !!manualSession, 
                    error: manualError?.message 
                  });
                  
                  if (manualSession) {
                    console.log('✅ Session recovered via manual extraction:', { 
                      hasSession: !!manualSession, 
                      userId: manualSession?.user?.id 
                    });
                    sessionDebugger.logSessionState(manualSession, manualSession?.user, 'SESSION_RECOVERED_MANUAL')
                    setSession(manualSession)
                    setUser(manualSession?.user ?? null)
                    setLoading(false)
                    return
                  }
                }
              } catch (parseError) {
                console.error('❌ Failed to parse auth token cookie:', parseError);
              }
            }
            
            // Method 4: Clear invalid cookies and stop trying
            console.log('❌ Session recovery failed - clearing invalid cookies')
            document.cookie = 'auth-session-established=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
            // Also clear the Supabase auth token cookie if it's invalid
            const invalidAuthTokenCookie = Object.keys(cookies).find(key => 
              key.includes('supabase') && key.includes('auth-token')
            );
            if (invalidAuthTokenCookie) {
              document.cookie = `${invalidAuthTokenCookie}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
            }
            return
            
          } catch (error) {
            console.error('❌ Session recovery error:', error)
          }
        } else {
          console.log('❌ Session recovery skipped - no auth cookies found')
        }
      } else {
        console.log('❌ Session recovery skipped - conditions not met:', {
          hasSession: !!session,
          recoveryAttempted
        })
      }
      
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', { event, hasSession: !!session, userId: session?.user?.id })
        
        // Log detailed session state for debugging
        sessionDebugger.logSessionState(session, session?.user, event)
        
        // Log auth events for debugging
        if (event === 'SIGNED_IN') {
          errorLogger.logSuccess('User signed in successfully', {
            component: 'auth-context',
            action: 'signIn',
            userId: session?.user?.id,
            additionalData: {
              email: session?.user?.email,
              provider: session?.user?.app_metadata?.provider,
            }
          });
        } else if (event === 'SIGNED_OUT') {
          errorLogger.logSuccess('User signed out', {
            component: 'auth-context',
            action: 'signOut',
          });
        } else if (event === 'TOKEN_REFRESHED') {
          errorLogger.logSuccess('Auth token refreshed', {
            component: 'auth-context',
            action: 'tokenRefresh',
            userId: session?.user?.id,
          });
        }
        
        // Only update state if this is a meaningful change
        // Avoid rapid state changes that might cause session loss
        setSession(prevSession => {
          // Only update if the session actually changed
          if (prevSession?.access_token !== session?.access_token) {
            // Reset recovery flag when we get a valid session
            if (session && recoveryAttempted) {
              setRecoveryAttempted(false)
            }
            return session
          }
          return prevSession
        })
        
        setUser(prevUser => {
          // Only update if the user actually changed
          if (prevUser?.id !== session?.user?.id) {
            return session?.user ?? null
          }
          return prevUser
        })
        
        // Only set loading to false on initial load or after sign in/out
        if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [recoveryAttempted, supabase.auth])

  const signUp = async (email: string, password: string, userData?: UserMetadata) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    })
    return { error }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })
    return { error }
  }

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}