import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

// GET: Debug endpoint to check tenant admin setup
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return NextResponse.json({
        success: false,
        error: 'No session found',
        sessionError: sessionError?.message
      }, { status: 401 })
    }

    const userId = session.user.id

    // Check if user profile exists
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    // Check if user has tenant roles
    const { data: tenantRoles, error: rolesError } = await supabase
      .from('tenant_users')
      .select(`
        *,
        tenants (
          id,
          name,
          slug,
          is_active
        )
      `)
      .eq('user_id', userId)

    // Check all user profiles with tenant_admin role
    const { data: allTenantAdmins, error: allAdminsError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('role', 'tenant_admin')

    // Check if tenantadmin@tin.info exists in auth.users
    const { data: authUser, error: authUserError } = await supabase
      .from('auth.users')
      .select('id, email, created_at')
      .eq('email', 'tenantadmin@tin.info')
      .single()

    return NextResponse.json({
      success: true,
      data: {
        currentUser: {
          id: userId,
          email: session.user.email,
          profile: userProfile,
          profileError: profileError?.message,
          tenantRoles: tenantRoles,
          rolesError: rolesError?.message
        },
        allTenantAdmins: allTenantAdmins,
        allAdminsError: allAdminsError?.message,
        authUser: authUser,
        authUserError: authUserError?.message
      }
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
