'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import Button from '@/components/ui/button/Button'
import Input from '@/components/form/input/InputField'
import Label from '@/components/form/Label'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  
  const { signUp } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    try {
      const { error } = await signUp(email, password, { full_name: fullName })
      if (error) {
        setError(error.message)
      } else {
        setMessage('Check your email for the confirmation link!')
        setTimeout(() => {
          router.push('/signin')
        }, 3000)
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
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Or{' '}
            <Link
              href="/signin"
              className="font-medium text-brand-600 hover:text-brand-500 dark:text-brand-400"
            >
              sign in to your existing account
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
              <div className="text-sm text-red-800 dark:text-red-400">
                {error}
              </div>
            </div>
          )}

          {message && (
            <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-4">
              <div className="text-sm text-green-800 dark:text-green-400">
                {message}
              </div>
            </div>
          )}

          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <Label htmlFor="full-name">Full Name</Label>
              <Input
                id="full-name"
                name="fullName"
                type="text"
                placeholder="John Doe"
                defaultValue={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={loading}
                error={!!error}
              />
            </div>
            <div>
              <Label htmlFor="email-address">Email address</Label>
              <Input
                id="email-address"
                name="email"
                type="email"
                placeholder="you@example.com"
                defaultValue={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                error={!!error}
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                defaultValue={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                error={!!error}
              />
            </div>
            <div>
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                name="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                defaultValue={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                error={!!error}
              />
            </div>
          </div>

          <div>
            <Button
              type="submit"
              disabled={loading || !email || !password || !confirmPassword || !fullName}
              className="w-full"
            >
              {loading ? 'Creating account...' : 'Sign up'}
            </Button>
          </div>

          <div className="text-center">
            <Link
              href="/"
              className="font-medium text-gray-600 hover:text-gray-500 dark:text-gray-400"
            >
              ← Back to Home
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
