'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Handle the auth callback from the URL
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth callback error:', error)
          router.push('/signin?error=auth_callback_failed')
          return
        }

        // Check if we have URL parameters for auth (magic link, etc.)
        const accessToken = searchParams.get('access_token')
        const refreshToken = searchParams.get('refresh_token')
        const type = searchParams.get('type')

        if (accessToken && refreshToken) {
          // Set the session with tokens from URL
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })

          if (sessionError) {
            console.error('Session error:', sessionError)
            router.push('/signin?error=session_failed')
            return
          }
        }

        // Get the updated session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Session retrieval error:', sessionError)
          router.push('/signin?error=session_retrieval_failed')
          return
        }

        if (sessionData.session) {
          // User is authenticated, redirect to dashboard
          console.log('User authenticated successfully:', sessionData.session.user.email)
          router.push('/')
        } else {
          // No session, redirect to sign in
          console.log('No session found, redirecting to sign in')
          router.push('/signin')
        }
      } catch (error) {
        console.error('Unexpected error in auth callback:', error)
        router.push('/signin?error=unexpected_error')
      }
    }

    handleAuthCallback()
  }, [router, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Completing sign in...</p>
      </div>
    </div>
  )
}
