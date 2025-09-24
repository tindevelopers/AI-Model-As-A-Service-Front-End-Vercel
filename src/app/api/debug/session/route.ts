import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

// GET: Debug session information
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Get session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    // Get all cookies
    const cookies = request.headers.get('cookie')

    return NextResponse.json({
      success: true,
      data: {
        hasSession: !!session,
        sessionError: sessionError?.message,
        hasUser: !!user,
        userError: userError?.message,
        userEmail: user?.email,
        userId: user?.id,
        cookies: cookies,
        sessionData: session ? {
          access_token: session.access_token ? 'present' : 'missing',
          refresh_token: session.refresh_token ? 'present' : 'missing',
          expires_at: session.expires_at,
          user_id: session.user?.id
        } : null
      }
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
