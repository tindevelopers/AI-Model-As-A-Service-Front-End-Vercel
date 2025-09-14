'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import Button from '@/components/ui/button/Button'
import Input from '@/components/form/input/InputField'
import Label from '@/components/form/Label'

function ForgotPasswordContent() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const [resetMethod, setResetMethod] = useState<'password' | 'magic-link'>('password')
  
  const { resetPassword } = useAuth()
  const searchParams = useSearchParams()

  // Get email from URL parameters (passed from login page)
  useEffect(() => {
    const emailParam = searchParams.get('email')
    if (emailParam) {
      setEmail(emailParam)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      let result
      
      if (resetMethod === 'password') {
        // Send password reset email
        result = await resetPassword(email)
        if (!result.error) {
          setMessage('Password reset email sent! Check your inbox and click the link to reset your password.')
        }
      } else {
        // Send magic link
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`
          }
        })
        result = { error }
        if (!error) {
          setMessage('Magic link sent! Check your inbox and click the link to sign in.')
        }
      }
      
      if (result.error) {
        setError(result.error.message)
      } else {
        setEmailSent(true)
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Reset your password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Choose how you&apos;d like to reset your password
          </p>
        </div>

        {emailSent ? (
          <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-4">
            <div className="text-sm text-green-800 dark:text-green-400">
              <p className="font-medium">Email sent successfully!</p>
              <p className="mt-1">
                {resetMethod === 'password' 
                  ? 'Check your inbox for a password reset link. If you don\'t see it, check your spam folder.'
                  : 'Check your inbox for a magic link to sign in. If you don\'t see it, check your spam folder.'
                }
              </p>
            </div>
            <div className="mt-4">
              <Link
                href="/signin"
                className="text-sm font-medium text-green-800 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
              >
                ← Back to sign in
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            {/* Method Selection */}
            <div className="space-y-3">
              <Label>Choose reset method:</Label>
              <div className="space-y-2">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="resetMethod"
                    value="password"
                    checked={resetMethod === 'password'}
                    onChange={(e) => setResetMethod(e.target.value as 'password' | 'magic-link')}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      Password Reset Email
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Get a secure link to reset your password
                    </div>
                  </div>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="resetMethod"
                    value="magic-link"
                    checked={resetMethod === 'magic-link'}
                    onChange={(e) => setResetMethod(e.target.value as 'password' | 'magic-link')}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      Magic Link
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Sign in instantly with a secure link
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
                <div className="text-sm text-red-800 dark:text-red-400">
                  {error}
                </div>
              </div>
            )}

            {message && (
              <div className="rounded-md bg-blue-50 dark:bg-blue-900/20 p-4">
                <div className="text-sm text-blue-800 dark:text-blue-400">
                  {message}
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                defaultValue={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                error={!!error}
              />
            </div>

            <div>
              <Button
                type="submit"
                disabled={loading || !email}
                className="w-full"
              >
                {loading 
                  ? 'Sending...' 
                  : resetMethod === 'password' 
                    ? 'Send password reset email' 
                    : 'Send magic link'
                }
              </Button>
            </div>

            <div className="text-center">
              <Link
                href="/signin"
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-500"
              >
                ← Back to sign in
              </Link>
            </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    }>
      <ForgotPasswordContent />
    </Suspense>
  )
}
