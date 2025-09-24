import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const cookieHeader = request.headers.get('cookie')
    
    // Create Supabase client with request
    const supabase = await createServerClient(request)
    
    // Try to get session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    // Try to get user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    return NextResponse.json({
      success: true,
      authHeader: authHeader ? 'Present' : 'Missing',
      authToken: authHeader ? authHeader.substring(0, 20) + '...' : null,
      cookieHeader: cookieHeader ? 'Present' : 'Missing',
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
      userError: userError?.message
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
