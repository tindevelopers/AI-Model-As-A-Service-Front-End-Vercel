import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    // Create Supabase client
    const supabase = await createServerClient()
    
    // Test basic connection
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      return NextResponse.json({
        success: false,
        error: 'Auth error',
        details: authError.message
      }, { status: 401 })
    }

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'No user found'
      }, { status: 401 })
    }

    // Test the function
    const { data, error } = await supabase.rpc('get_user_tenant_roles')

    if (error) {
      return NextResponse.json({
        success: false,
        error: 'Function error',
        details: error.message,
        code: error.code,
        hint: error.hint
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      user: {
        id: user.id,
        email: user.email
      }
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Unexpected error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
