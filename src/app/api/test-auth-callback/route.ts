import { createServerClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/'

    console.log('Test auth callback received:', { 
      code: code ? 'present' : 'missing', 
      next, 
      origin,
      searchParams: Object.fromEntries(searchParams.entries())
    })

    if (!code) {
      return NextResponse.json({ 
        error: 'No code parameter found',
        details: { next, origin, searchParams: Object.fromEntries(searchParams.entries()) }
      }, { status: 400 })
    }

    const supabase = createServerClient()
    const { error, data } = await supabase.auth.exchangeCodeForSession(code)
    
    console.log('Test exchange code result:', { 
      error: error?.message, 
      hasSession: !!data.session,
      hasUser: !!data.user,
      sessionId: data.session?.access_token?.substring(0, 20) + '...'
    })
    
    if (error) {
      return NextResponse.json({ 
        error: error.message,
        details: {
          code: code.substring(0, 20) + '...',
          next,
          origin
        }
      }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Code exchanged successfully',
      details: {
        hasSession: !!data.session,
        hasUser: !!data.user,
        userId: data.user?.id,
        email: data.user?.email,
        next,
        origin
      }
    })

  } catch (error) {
    console.error('Test auth callback error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
