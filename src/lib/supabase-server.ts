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


export const createServerClient = async () => {
  const cookieStore = await cookies()
  const cookieAdapter = {
    getAll() {
      return cookieStore.getAll().map((c) => ({ name: c.name, value: c.value }))
    },
    setAll(cookiesToSet: { name: string; value: string; options?: CookieSetRemoveOptions }[]) {
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
    deleteAll(cookiesToDelete: { name: string; options?: CookieSetRemoveOptions }[]) {
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

  return createSSRClient(supabaseUrl, supabaseAnonKey, {
    cookies: cookieAdapter,
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
