import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

// GET: Check database state and apply migration if needed
export async function GET() {
  try {
    const supabase = await createServerClient()

    // Check if tenant admin user exists in auth.users
    const { data: authUsers, error: authError } = await supabase
      .from('auth.users')
      .select('id, email, created_at')
      .eq('email', 'tenantadmin@tin.info')

    // Check if tenant admin user profile exists
    const { data: userProfiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', 'tenantadmin@tin.info')

    // Check if test tenant exists
    const { data: tenants, error: tenantError } = await supabase
      .from('tenants')
      .select('*')
      .eq('slug', 'test-tenant')

    // Check if tenant admin has tenant access
    const { data: tenantUsers, error: tenantUserError } = await supabase
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
      .eq('user_id', userProfiles?.[0]?.id || 'none')

    // Try to apply the migration
    const { data: migrationResult, error: migrationError } = await supabase
      .rpc('ensure_tenant_admin_user_exists')

    return NextResponse.json({
      success: true,
      data: {
        authUsers: authUsers || [],
        authError: authError?.message,
        userProfiles: userProfiles || [],
        profileError: profileError?.message,
        tenants: tenants || [],
        tenantError: tenantError?.message,
        tenantUsers: tenantUsers || [],
        tenantUserError: tenantUserError?.message,
        migrationResult: migrationResult || [],
        migrationError: migrationError?.message
      }
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
