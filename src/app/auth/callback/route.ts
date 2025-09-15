import { createServerClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  console.log('🔐 Auth callback received:', { 
    code: code ? 'present' : 'missing', 
    next, 
    origin,
    userAgent: request.headers.get('user-agent'),
    referer: request.headers.get('referer')
  })

  if (code) {
    const supabase = await createServerClient()
    
    // Log cookies before exchange
    const cookieStore = await cookies()
    const cookiesBefore = cookieStore.getAll()
    console.log('🍪 Cookies before exchange:', cookiesBefore.map(c => ({ 
      name: c.name, 
      hasValue: !!c.value,
      valueLength: c.value?.length || 0
    })))
    
    const { error, data } = await supabase.auth.exchangeCodeForSession(code)
    
    console.log('🔄 Exchange code result:', { 
      error: error?.message, 
      hasSession: !!data.session,
      hasUser: !!data.user,
      userId: data.session?.user?.id || data.user?.id,
      expiresAt: data.session?.expires_at,
      accessToken: data.session?.access_token ? 'present' : 'missing',
      refreshToken: data.session?.refresh_token ? 'present' : 'missing'
    })
    
    // Log cookies after exchange
    const cookiesAfter = cookieStore.getAll()
    console.log('🍪 Cookies after exchange:', cookiesAfter.map(c => ({ 
      name: c.name, 
      hasValue: !!c.value,
      valueLength: c.value?.length || 0
    })))
    
    if (!error && (data.session || data.user)) {
      const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === 'development'
      
      console.log('🎯 Redirecting to:', { forwardedHost, isLocalEnv, next })
      
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
      
      // Use the session from the exchange result
      const session = data.session
      if (session) {
        console.log('✅ Session established, redirecting to:', redirectUrl)
        
        // Get all cookies from the supabase client and set them in the response
        const allCookies = cookieStore.getAll()
        
        console.log('🍪 All cookies for response:', allCookies.map(c => ({ 
          name: c.name, 
          hasValue: !!c.value,
          valueLength: c.value?.length || 0
        })))
        
        // Set each cookie in the response with more robust settings
        allCookies.forEach(cookie => {
          if (cookie.name.includes('supabase') || cookie.name.includes('auth')) {
            response.cookies.set(cookie.name, cookie.value, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              path: '/',
              // Add domain for production
              ...(process.env.NODE_ENV === 'production' && {
                domain: process.env.NEXT_PUBLIC_COOKIE_DOMAIN || undefined
              }),
              // Ensure cookies persist
              maxAge: 60 * 60 * 24 * 7 // 7 days
            })
            console.log('🍪 Set cookie in response:', cookie.name, 'length:', cookie.value?.length)
          }
        })
        
        // Also ensure the session is properly set in the Supabase client
        // This is crucial for client-side session detection
        await supabase.auth.setSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token
        })
        
        // Also set a client-side session indicator
        response.cookies.set('auth-session-established', 'true', {
          httpOnly: false, // Allow client-side access
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 7 // 7 days
        })
      }
      
      return response
    } else {
      console.error('❌ Auth exchange error:', error)
    }
  } else {
    console.log('❌ No code parameter found in request')
  }

  // return the user to an error page with instructions
  console.log('Redirecting to error page')
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
