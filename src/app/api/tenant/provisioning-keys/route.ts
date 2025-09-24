import { NextRequest, NextResponse } from 'next/server'
import { AuthMiddleware, createAuthErrorResponse } from '@/lib/auth-middleware'
import { applyRateLimit, rateLimiters } from '@/lib/rate-limiter'
import { errorLogger } from '@/utils/errorLogger'
import { createServerClient } from '@/lib/supabase-server'

// GET: List tenant provisioning keys
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await applyRateLimit(request, rateLimiters.api)
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!
    }

    // Authenticate user
    const authResult = await AuthMiddleware.authenticateUser()
    if (!authResult.success) {
      return createAuthErrorResponse(authResult.error!, authResult.statusCode!)
    }

    const userId = authResult.user!.id
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')

    if (!tenantId) {
      return NextResponse.json({
        success: false,
        error: 'Tenant ID is required'
      }, { status: 400 })
    }

    // Create Supabase client
    const supabase = await createServerClient()

    // Check if user is member of the tenant
    const { data: tenantUser, error: tenantUserError } = await supabase
      .from('tenant_users')
      .select('role, is_active')
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .single()

    if (tenantUserError || !tenantUser || !tenantUser.is_active) {
      return NextResponse.json({
        success: false,
        error: 'Access denied: Not a member of this tenant'
      }, { status: 403 })
    }

    // Get tenant provisioning keys
    const { data: provisioningKeys, error } = await supabase
      .rpc('get_tenant_provisioning_keys', { target_tenant_id: tenantId })

    if (error) {
      errorLogger.logError('Failed to get tenant provisioning keys', {
        component: 'tenant-provisioning-keys-route',
        action: 'GET',
        userId,
        additionalData: {
          error: error.message,
          errorCode: error.code,
          tenantId
        }
      })

      return NextResponse.json({
        success: false,
        error: 'Failed to get provisioning keys'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: provisioningKeys || []
    })

  } catch (error) {
    errorLogger.logError('Failed to get tenant provisioning keys', {
      component: 'tenant-provisioning-keys-route',
      action: 'GET',
      additionalData: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    })

    return NextResponse.json({
      success: false,
      error: 'Failed to get provisioning keys'
    }, { status: 500 })
  }
}

// POST: Create new tenant provisioning key
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await applyRateLimit(request, rateLimiters.api)
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!
    }

    // Authenticate user
    const authResult = await AuthMiddleware.authenticateUser()
    if (!authResult.success) {
      return createAuthErrorResponse(authResult.error!, authResult.statusCode!)
    }

    const userId = authResult.user!.id
    const body = await request.json()
    const { tenantId, name, provider, providerType, endpoint, config } = body

    if (!tenantId || !name || !provider || !providerType) {
      return NextResponse.json({
        success: false,
        error: 'Tenant ID, name, provider, and provider type are required'
      }, { status: 400 })
    }

    // Create Supabase client
    const supabase = await createServerClient()

    // Check if user is admin of the tenant
    const { data: tenantUser, error: tenantUserError } = await supabase
      .from('tenant_users')
      .select('role, is_active')
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .single()

    if (tenantUserError || !tenantUser || !tenantUser.is_active) {
      return NextResponse.json({
        success: false,
        error: 'Access denied: Not a member of this tenant'
      }, { status: 403 })
    }

    if (!['owner', 'admin'].includes(tenantUser.role)) {
      return NextResponse.json({
        success: false,
        error: 'Access denied: Admin privileges required'
      }, { status: 403 })
    }

    // Create provisioning key
    const { data: newProvisioningKey, error } = await supabase
      .rpc('create_tenant_provisioning_key', {
        target_tenant_id: tenantId,
        key_name: name,
        key_provider: provider,
        key_provider_type: providerType,
        key_endpoint: endpoint || null,
        key_config: config || {}
      })

    if (error) {
      errorLogger.logError('Failed to create tenant provisioning key', {
        component: 'tenant-provisioning-keys-route',
        action: 'POST',
        userId,
        additionalData: {
          error: error.message,
          errorCode: error.code,
          tenantId,
          name,
          provider
        }
      })

      return NextResponse.json({
        success: false,
        error: 'Failed to create provisioning key'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: { id: newProvisioningKey }
    }, { status: 201 })

  } catch (error) {
    errorLogger.logError('Failed to create tenant provisioning key', {
      component: 'tenant-provisioning-keys-route',
      action: 'POST',
      additionalData: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    })

    return NextResponse.json({
      success: false,
      error: 'Failed to create provisioning key'
    }, { status: 500 })
  }
}
