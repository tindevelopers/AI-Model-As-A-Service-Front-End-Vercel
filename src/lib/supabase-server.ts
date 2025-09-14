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

type NextCookiesWritable = {
  getAll: () => { name: string; value: string }[]
  set: (init: { name: string; value: string } & CookieSetRemoveOptions) => void
}

export const createServerClient = () => {
  const cookieAdapter = {
    getAll() {
      const store = cookies() as unknown as NextCookiesWritable
      return store.getAll().map((c) => ({ name: c.name, value: c.value }))
    },
    setAll(cookiesToSet: { name: string; value: string; options?: CookieSetRemoveOptions }[]) {
      const store = cookies() as unknown as NextCookiesWritable
      cookiesToSet.forEach(({ name, value, options }) => {
        try {
          store.set({ name, value, ...(options || {}) })
        } catch {}
      })
    },
    deleteAll(cookiesToDelete: { name: string; options?: CookieSetRemoveOptions }[]) {
      const store = cookies() as unknown as NextCookiesWritable
      cookiesToDelete.forEach(({ name, options }) => {
        try {
          store.set({ name, value: '', ...(options || {}), maxAge: 0 })
        } catch {}
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
