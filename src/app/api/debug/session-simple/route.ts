import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    // Try to get session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    // Try to get user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    // Get cookies
    const cookies = request.headers.get('cookie')
    
    return NextResponse.json({
      success: true,
      session: session ? {
        user: {
          id: session.user.id,
          email: session.user.email
        },
        expires_at: session.expires_at
      } : null,
      user: user ? {
        id: user.id,
        email: user.email
      } : null,
      sessionError: sessionError?.message,
      userError: userError?.message,
      cookies: cookies ? 'Present' : 'Missing',
      cookieNames: cookies ? cookies.split(';').map(c => c.split('=')[0].trim()) : []
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
