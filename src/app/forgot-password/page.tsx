'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import Button from '@/components/ui/button/Button'
import Input from '@/components/form/input/InputField'
import Label from '@/components/form/Label'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  
  const { resetPassword } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const { error } = await resetPassword(email)
      
      if (error) {
        setError(error.message)
      } else {
        setMessage('Password reset email sent! Check your inbox.')
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
            Enter your email address and we&apos;ll send you a link to reset your password
          </p>
        </div>

        {emailSent ? (
          <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-4">
            <div className="text-sm text-green-800 dark:text-green-400">
              <p className="font-medium">Email sent successfully!</p>
              <p className="mt-1">
                Check your inbox for a password reset link. If you don&apos;t see it, check your spam folder.
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
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
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
                {loading ? 'Sending...' : 'Send reset email'}
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
        )}
      </div>
    </div>
  )
}
