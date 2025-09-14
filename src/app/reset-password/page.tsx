import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

async function updatePassword(formData: FormData) {
  'use server'
  const password = String(formData.get('password') || '')
  const confirm = String(formData.get('confirmPassword') || '')
  if (!password || password.length < 6) redirect('/reset-password?error=weak_password')
  if (password !== confirm) redirect('/reset-password?error=mismatch')

  const supabase = createServerClient()
  const hdrs = await headers()
  const host = hdrs.get('x-forwarded-host') || hdrs.get('host') || '127.0.0.1:3000'
  const proto = hdrs.get('x-forwarded-proto') || 'http'
  const origin = `${proto}://${host}`
  const currentUrl = `${origin}/reset-password`
  await supabase.auth.exchangeCodeForSession(currentUrl).catch(() => {})

  const { error } = await supabase.auth.updateUser({ password })
  if (error) redirect(`/reset-password?error=${encodeURIComponent(error.message)}`)
  redirect('/reset-password?success=1')
}

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const sp = await searchParams
  const error = (sp?.error as string) || ''
  const success = sp?.success === '1'

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w_full space-y-8">
          <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-4">
            <div className="text-center">
              <div className="text-lg font-medium text-green-800 dark:text-green-400">Password updated successfully!</div>
              <p className="mt-2 text-sm text-green-700 dark:text-green-300">You can now sign in.</p>
              <div className="mt-4"><Link href="/signin" className="text-sm text-green-800 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300">← Go to sign in</Link></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">Set new password</h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">Enter your new password below</p>
        </div>

        <form className="mt-8 space-y-6" action={updatePassword}>
          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
              <div className="text-sm text-red-800 dark:text-red-400">{decodeURIComponent(error)}</div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">New Password</label>
              <input id="password" name="password" type="password" placeholder="Enter new password" className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white dark:border-gray-700" />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm New Password</label>
              <input id="confirmPassword" name="confirmPassword" type="password" placeholder="Confirm new password" className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white dark:border-gray-700" />
            </div>
          </div>

          <div>
            <button type="submit" className="w-full inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">Update password</button>
          </div>

          <div className="text-center">
            <Link href="/signin" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-500">← Back to sign in</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
