import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

async function sendReset(formData: FormData) {
  'use server'
  const email = String(formData.get('email') || '')
  const method = (String(formData.get('method') || 'password') === 'magic-link') ? 'magic-link' : 'password'
  const supabase = await createServerClient()

  const hdrs = await headers()
  const host = hdrs.get('x-forwarded-host') || hdrs.get('host') || '127.0.0.1:3000'
  const proto = hdrs.get('x-forwarded-proto') || 'http'
  const computedOrigin = `${proto}://${host}`
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || computedOrigin).trim()

  if (!email) {
    redirect('/forgot-password?error=missing_email')
  }

  if (method === 'password') {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${baseUrl}/reset-password` })
    if (error) redirect(`/forgot-password?error=${encodeURIComponent(error.message)}`)
    redirect('/forgot-password?sent=1&method=password')
  } else {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { 
        emailRedirectTo: `${baseUrl}/auth/callback?next=/`,
        shouldCreateUser: false
      }
    })
    if (error) redirect(`/forgot-password?error=${encodeURIComponent(error.message)}`)
    redirect('/forgot-password?sent=1&method=magic-link')
  }
}

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const sp = await searchParams
  const sent = sp?.sent === '1'
  const method = (sp?.method as string) || 'password'
  const error = (sp?.error as string) || ''

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">Reset your password</h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">Choose how you&apos;d like to reset your password</p>
        </div>

        {sent ? (
          <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-4">
            <div className="text-sm text-green-800 dark:text-green-400">
              <p className="font-medium">Email sent successfully!</p>
              <p className="mt-1">{method === 'password' ? "Check your inbox for a password reset link. If you don't see it, check your spam folder." : "Check your inbox for a magic link to sign in. If you don't see it, check your spam folder."}</p>
            </div>
            <div className="mt-4">
              <Link href="/signin" className="text-sm font-medium text-green-800 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300">← Back to sign in</Link>
            </div>
          </div>
        ) : (
          <form className="mt-8 space-y-6" action={sendReset}>
            {error && (
              <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
                <div className="text-sm text-red-800 dark:text-red-400">{decodeURIComponent(error)}</div>
              </div>
            )}

            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Choose reset method:</label>
              <div className="space-y-2">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input type="radio" name="method" value="password" defaultChecked className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" />
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">Password Reset Email</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Get a secure link to reset your password</div>
                  </div>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input type="radio" name="method" value="magic-link" className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" />
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">Magic Link</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Sign in instantly with a secure link</div>
                  </div>
                </label>
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email address</label>
              <input id="email" name="email" type="email" required placeholder="Enter your email" className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white dark:border-gray-700" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button type="submit" name="method" value="password" className="w-full inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">Send password reset email</button>
              <button type="submit" name="method" value="magic-link" className="w-full inline-flex items-center justify-center rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-700">Send magic link</button>
            </div>

            <div className="text-center">
              <Link href="/signin" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-500">← Back to sign in</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
