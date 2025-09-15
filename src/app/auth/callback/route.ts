import { createServerClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  console.log('Auth callback received:', { code: code ? 'present' : 'missing', next, origin })

  if (code) {
    const supabase = await createServerClient()
    const { error, data } = await supabase.auth.exchangeCodeForSession(code)
    
    console.log('Exchange code result:', { error: error?.message, hasSession: !!data.session })
    
    if (!error && data.session) {
      const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === 'development'
      
      console.log('Redirecting to:', { forwardedHost, isLocalEnv, next })
      
      // Create the redirect response
      let redirectUrl: string
      if (isLocalEnv) {
        redirectUrl = `${origin}${next}`
      } else if (forwardedHost) {
        redirectUrl = `https://${forwardedHost}${next}`
      } else {
        redirectUrl = `${origin}${next}`
      }
      
      // Create response with proper cookies
      const response = NextResponse.redirect(redirectUrl)
      
      // Set the session cookies in the response
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        // The cookies should already be set by the supabase client, but let's ensure they're in the response
        console.log('Session established, redirecting to:', redirectUrl)
      }
      
      return response
    } else {
      console.error('Auth exchange error:', error)
    }
  } else {
    console.log('No code parameter found in request')
  }

  // return the user to an error page with instructions
  console.log('Redirecting to error page')
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
