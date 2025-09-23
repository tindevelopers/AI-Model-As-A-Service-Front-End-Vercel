import { NextRequest, NextResponse } from 'next/server'
import { AuthMiddleware, createAuthErrorResponse } from '@/lib/auth-middleware'
import { applyRateLimit, rateLimiters } from '@/lib/rate-limiter'
import { errorLogger } from '@/utils/errorLogger'
import { createServerClient } from '@/lib/supabase-server'

// GET: Get user's tenant roles
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await applyRateLimit(request, rateLimiters.admin)
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!
    }

    // Create Supabase client first
    const supabase = await createServerClient()

    // Get session first
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return NextResponse.json({
        success: false,
        error: 'No valid session found',
        details: sessionError?.message || 'No session'
      }, { status: 401 })
    }

    const userId = session.user.id
    const userEmail = session.user.email

    // Check if user profile exists
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileError || !userProfile) {
      // If no profile exists, create one for tenantadmin@tin.info
      if (userEmail === 'tenantadmin@tin.info') {
        const { data: newProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert({
            id: userId,
            email: userEmail,
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

        // Also create test tenant and tenant user relationship
        const { data: existingTenant } = await supabase
          .from('tenants')
          .select('*')
          .eq('slug', 'test-tenant')
          .single()

        let tenantId: string
        if (existingTenant) {
          tenantId = existingTenant.id
        } else {
          const { data: newTenant, error: tenantError } = await supabase
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

          if (tenantError) {
            return NextResponse.json({
              success: false,
              error: 'Failed to create test tenant',
              details: tenantError.message
            }, { status: 500 })
          }
          tenantId = newTenant.id
        }

        // Create tenant user relationship
        const { error: tenantUserError } = await supabase
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

        if (tenantUserError) {
          return NextResponse.json({
            success: false,
            error: 'Failed to create tenant user relationship',
            details: tenantUserError.message
          }, { status: 500 })
        }
      } else {
        return NextResponse.json({
          success: false,
          error: 'User profile not found',
          details: 'Please contact administrator to set up your account'
        }, { status: 404 })
      }
    }

    // Check if user has tenant admin role
    if (userProfile.role !== 'tenant_admin' && userProfile.role !== 'superadmin') {
      return NextResponse.json({
        success: false,
        error: 'Insufficient permissions',
        details: `User role '${userProfile.role}' does not have access to tenant management`
      }, { status: 403 })
    }

    // Call the get_user_tenant_roles function (no parameters needed - uses auth.uid())
    const { data, error } = await supabase.rpc('get_user_tenant_roles')

    if (error) {
      errorLogger.logError('Failed to get user tenant roles', {
        component: 'tenant-roles-route',
        action: 'GET',
        userId,
        additionalData: {
          error: error.message,
          errorCode: error.code
        }
      })

      return NextResponse.json({
        success: false,
        error: 'Failed to get user tenant roles'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: data || []
    })

  } catch (error) {
    errorLogger.logError('Failed to get user tenant roles', {
      component: 'tenant-roles-route',
      action: 'GET',
      additionalData: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    })

    return NextResponse.json({
      success: false,
      error: 'Failed to get user tenant roles'
    }, { status: 500 })
  }
}
