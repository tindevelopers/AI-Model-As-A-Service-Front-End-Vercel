import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export default async function AuthCallbackPage() {
  const hdrs = await headers()
  const host = hdrs.get('x-forwarded-host') || hdrs.get('host') || '127.0.0.1:3000'
  const proto = hdrs.get('x-forwarded-proto') || 'http'
  const computedOrigin = `${proto}://${host}`
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || computedOrigin

  const requestUrl = `${baseUrl}${hdrs.get('x-invoke-path') || '/auth/callback'}${hdrs.get('x-invoke-query') || ''}`
  const supabase = await createServerClient()
  const { error } = await supabase.auth.exchangeCodeForSession(requestUrl)

  if (error) {
    redirect('/signin?error=auth_exchange_failed')
  }

  redirect('/')
}

