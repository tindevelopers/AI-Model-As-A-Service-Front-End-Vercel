import { createServerClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const supabase = await createServerClient()
    
    // Get the base URL
    const headers = await import('next/headers')
    const hdrs = await headers.headers()
    const host = hdrs.get('x-forwarded-host') || hdrs.get('host') || '127.0.0.1:3000'
    const proto = hdrs.get('x-forwarded-proto') || 'http'
    const computedOrigin = `${proto}://${host}`
    const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || computedOrigin).trim()
    
    console.log('🔧 Testing auth fix - URL computation:', { 
      host, 
      proto, 
      computedOrigin, 
      baseUrl, 
      emailRedirectTo: `${baseUrl}/auth/callback?next=/`
    })

    // Generate magic link
    const { error, data } = await supabase.auth.signInWithOtp({
      email,
      options: { 
        emailRedirectTo: `${baseUrl}/auth/callback?next=/`,
        shouldCreateUser: false
      }
    })
    
    console.log('🔧 Auth fix test result:', { 
      error: error?.message, 
      emailRedirectTo: `${baseUrl}/auth/callback?next=/`,
      email: email.substring(0, 3) + '***',
      hasData: !!data
    })

    if (error) {
      return NextResponse.json({ 
        error: error.message,
        details: {
          host,
          proto,
          computedOrigin,
          baseUrl,
          emailRedirectTo: `${baseUrl}/auth/callback?next=/`
        }
      }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Magic link sent successfully - Auth fix applied!',
      details: {
        host,
        proto,
        computedOrigin,
        baseUrl,
        emailRedirectTo: `${baseUrl}/auth/callback?next=/`,
        improvements: [
          'Enhanced cookie setting in auth callback',
          'Improved session recovery logic',
          'Added direct token cookie support',
          'Better PKCE flow configuration'
        ]
      }
    })

  } catch (error) {
    console.error('🔧 Auth fix test error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
