import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

// POST: Setup tenant admin user
export async function POST() {
  try {
    const supabase = await createServerClient()

    // First, check if we have any user with tenantadmin@tin.info email
    const { data: existingUsers, error: userError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', 'tenantadmin@tin.info')

    if (userError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to check existing users',
        details: userError.message
      }, { status: 500 })
    }

    let userId: string

    if (existingUsers && existingUsers.length > 0) {
      // User exists, update their role
      userId = existingUsers[0].id
      
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          role: 'tenant_admin',
          full_name: 'Tenant Admin',
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (updateError) {
        return NextResponse.json({
          success: false,
          error: 'Failed to update user profile',
          details: updateError.message
        }, { status: 500 })
      }
    } else {
      // Create new user profile (we'll use a random UUID for now)
      // In a real scenario, this would be created when the user signs up
      const { data: newUser, error: createError } = await supabase
        .from('user_profiles')
        .insert({
          id: crypto.randomUUID(),
          email: 'tenantadmin@tin.info',
          full_name: 'Tenant Admin',
          role: 'tenant_admin',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (createError) {
        return NextResponse.json({
          success: false,
          error: 'Failed to create user profile',
          details: createError.message
        }, { status: 500 })
      }

      userId = newUser.id
    }

    // Ensure test tenant exists
    const { data: existingTenants, error: tenantCheckError } = await supabase
      .from('tenants')
      .select('*')
      .eq('slug', 'test-tenant')

    if (tenantCheckError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to check existing tenants',
        details: tenantCheckError.message
      }, { status: 500 })
    }

    let tenantId: string

    if (existingTenants && existingTenants.length > 0) {
      tenantId = existingTenants[0].id
    } else {
      // Create test tenant
      const { data: newTenant, error: createTenantError } = await supabase
        .from('tenants')
        .insert({
          id: crypto.randomUUID(),
          name: 'Test Tenant',
          slug: 'test-tenant',
          description: 'Test tenant for tenant admin testing',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (createTenantError) {
        return NextResponse.json({
          success: false,
          error: 'Failed to create test tenant',
          details: createTenantError.message
        }, { status: 500 })
      }

      tenantId = newTenant.id
    }

    // Ensure tenant admin has access to the tenant
    const { data: existingTenantUsers, error: tenantUserCheckError } = await supabase
      .from('tenant_users')
      .select('*')
      .eq('user_id', userId)
      .eq('tenant_id', tenantId)

    if (tenantUserCheckError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to check tenant user access',
        details: tenantUserCheckError.message
      }, { status: 500 })
    }

    if (!existingTenantUsers || existingTenantUsers.length === 0) {
      // Create tenant user relationship
      const { error: createTenantUserError } = await supabase
        .from('tenant_users')
        .insert({
          id: crypto.randomUUID(),
          tenant_id: tenantId,
          user_id: userId,
          role: 'tenant_admin',
          permissions: ['tenant:read', 'tenant:write', 'tenant:delete', 'users:read', 'users:write', 'api_keys:read', 'api_keys:write'],
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (createTenantUserError) {
        return NextResponse.json({
          success: false,
          error: 'Failed to create tenant user relationship',
          details: createTenantUserError.message
        }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Tenant admin setup completed successfully',
      data: {
        userId,
        tenantId,
        email: 'tenantadmin@tin.info',
        role: 'tenant_admin'
      }
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
