'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
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

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      console.log('Initial session check:', { hasSession: !!session, userId: session?.user?.id })
      
      // Log initial session state
      sessionDebugger.logSessionState(session, session?.user, 'INITIAL_SESSION')
      
      // If no session but we have the auth-session-established cookie, try to recover
      if (!session) {
        const authSessionEstablished = document.cookie.includes('auth-session-established=true')
        if (authSessionEstablished) {
          console.log('🔄 Auth session cookie found, attempting session recovery...')
          // Try to refresh the session
          const { data: { session: refreshedSession } } = await supabase.auth.refreshSession()
          if (refreshedSession) {
            console.log('✅ Session recovered:', { hasSession: !!refreshedSession, userId: refreshedSession?.user?.id })
            sessionDebugger.logSessionState(refreshedSession, refreshedSession?.user, 'SESSION_RECOVERED')
            setSession(refreshedSession)
            setUser(refreshedSession?.user ?? null)
            setLoading(false)
            return
          }
        }
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
  }, [])

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