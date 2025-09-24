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
            // Ensure cookies are set with proper security settings
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

  // If we have a request with Authorization header, use it to set the session
  let authHeaders = {}
  if (request) {
    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      authHeaders = {
        Authorization: `Bearer ${token}`
      }
    }
  }

  return createSSRClient(supabaseUrl, supabaseAnonKey, {
    cookies: cookieAdapter,
    global: {
      headers: authHeaders
    },
    auth: {
      flowType: 'pkce',
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  })
}

export const createAdminClient = () => {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  return createSupabaseClient(supabaseUrl, serviceKey)
}
