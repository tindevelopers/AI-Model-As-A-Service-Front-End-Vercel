import { createServerClient as createSSRClient } from '@supabase/ssr'
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

export const createServerClient = () => {
  const cookieAdapter = {
    getAll() {
      const store = cookies()
      // Map Next cookies to the shape expected by @supabase/ssr
      return store.getAll().map((c) => ({ name: c.name, value: c.value }))
    },
    setAll(cookiesToSet: { name: string; value: string; options?: CookieSetRemoveOptions }[]) {
      const store = cookies()
      cookiesToSet.forEach(({ name, value, options }) => {
        try {
          store.set({ name, value, ...(options || {}) })
        } catch {}
      })
    },
    deleteAll(cookiesToDelete: { name: string; options?: CookieSetRemoveOptions }[]) {
      const store = cookies()
      cookiesToDelete.forEach(({ name, options }) => {
        try {
          store.set({ name, value: '', ...(options || {}), maxAge: 0 })
        } catch {}
      })
    },
  } as unknown as CookieMethodsServer

  return createSSRClient(supabaseUrl, supabaseAnonKey, { cookies: cookieAdapter })
}
