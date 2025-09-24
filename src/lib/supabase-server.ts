import { createServerClient as createSSRClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { CookieMethodsServer } from '@supabase/ssr'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

type CookieSetRemoveOptions = Partial<{
  domain: string
  expires: Date
  httpOnly: boolean
  maxAge: number
  path: string
  sameSite: 'lax' | 'strict' | 'none'
  secure: boolean
}>


export const createServerClient = async (request?: Request) => {
  // Prefer header-based auth for API routes (ensures RLS runs as the user)
  const bearer = request?.headers.get('authorization')
  if (bearer && bearer.startsWith('Bearer ')) {
    const token = bearer.substring(7)
    const headerClient = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    })
    return headerClient
  }

  // Fallback: cookie-based SSR client for pages
  const cookieStore = await cookies()
  const cookieAdapter = {
    async getAll() {
      return cookieStore.getAll().map((c) => ({ name: c.name, value: c.value }))
    },
    async setAll(cookiesToSet: { name: string; value: string; options?: CookieSetRemoveOptions }[]) {
      cookiesToSet.forEach(({ name, value, options }) => {
        try {
          cookieStore.set({ 
            name, 
            value, 
            ...(options || {}),
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/'
          })
        } catch (error) {
          console.error('Failed to set cookie:', name, error)
        }
      })
    },
    async deleteAll(cookiesToDelete: { name: string; options?: CookieSetRemoveOptions }[]) {
      cookiesToDelete.forEach(({ name, options }) => {
        try {
          cookieStore.set({ 
            name, 
            value: '', 
            ...(options || {}), 
            maxAge: 0,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/'
          })
        } catch (error) {
          console.error('Failed to delete cookie:', name, error)
        }
      })
    },
  } as unknown as CookieMethodsServer

  const client = createSSRClient(supabaseUrl, supabaseAnonKey, {
    cookies: cookieAdapter,
    auth: {
      flowType: 'pkce',
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  })
  return client
}

export const createAdminClient = () => {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  return createSupabaseClient(supabaseUrl, serviceKey)
}
