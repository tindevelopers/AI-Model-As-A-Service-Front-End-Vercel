import { NextRequest, NextResponse } from 'next/server'
import { AuthMiddleware, createAuthErrorResponse } from '@/lib/auth-middleware'
import { applyRateLimit, rateLimiters } from '@/lib/rate-limiter'
import { errorLogger } from '@/utils/errorLogger'
import { createServerClient } from '@/lib/supabase-server'

// GET: Get specific API key details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ keyId: string }> }
) {
  try {
    const { keyId } = await params
    
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

    // Create Supabase client
    const supabase = await createServerClient()

    // Get API key with tenant info
    const { data: apiKey, error } = await supabase
      .from('tenant_api_keys')
      .select(`
        *,
        tenants!inner(id, name)
      `)
      .eq('id', keyId)
      .single()

    if (error || !apiKey) {
      return NextResponse.json({
        success: false,
        error: 'API key not found'
      }, { status: 404 })
    }

    // Check if user is member of the tenant
    const { data: tenantUser, error: tenantUserError } = await supabase
      .from('tenant_users')
      .select('role, is_active')
      .eq('tenant_id', apiKey.tenant_id)
      .eq('user_id', userId)
      .single()

    if (tenantUserError || !tenantUser || !tenantUser.is_active) {
      return NextResponse.json({
        success: false,
        error: 'Access denied: Not a member of this tenant'
      }, { status: 403 })
    }

    // Mask the API key for security
    const maskedApiKey = {
      ...apiKey,
      api_key: apiKey.key_prefix
    }

    return NextResponse.json({
      success: true,
      data: maskedApiKey
    })

  } catch (error) {
    errorLogger.logError('Failed to get API key', {
      component: 'tenant-api-key-detail-route',
      action: 'GET',
      additionalData: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    })

    return NextResponse.json({
      success: false,
      error: 'Failed to get API key'
    }, { status: 500 })
  }
}

// PATCH: Update API key (toggle status, update details)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ keyId: string }> }
) {
  try {
    const { keyId } = await params
    
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
    const { is_active, name, description, expires_at } = body

    // Create Supabase client
    const supabase = await createServerClient()

    // Get API key with tenant info
    const { data: apiKey, error: getError } = await supabase
      .from('tenant_api_keys')
      .select(`
        *,
        tenants!inner(id, name)
      `)
      .eq('id', keyId)
      .single()

    if (getError || !apiKey) {
      return NextResponse.json({
        success: false,
        error: 'API key not found'
      }, { status: 404 })
    }

    // Check if user is admin of the tenant
    const { data: tenantUser, error: tenantUserError } = await supabase
      .from('tenant_users')
      .select('role, is_active')
      .eq('tenant_id', apiKey.tenant_id)
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

    // Prepare update data
    const updateData: any = {}
    if (is_active !== undefined) updateData.is_active = is_active
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (expires_at !== undefined) updateData.expires_at = expires_at

    // Update API key
    const { data: updatedApiKey, error } = await supabase
      .from('tenant_api_keys')
      .update(updateData)
      .eq('id', keyId)
      .select()
      .single()

    if (error) {
      errorLogger.logError('Failed to update API key', {
        component: 'tenant-api-key-detail-route',
        action: 'PATCH',
        userId,
        additionalData: {
          error: error.message,
          errorCode: error.code,
          keyId,
          updateData
        }
      })

      return NextResponse.json({
        success: false,
        error: 'Failed to update API key'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: updatedApiKey
    })

  } catch (error) {
    errorLogger.logError('Failed to update API key', {
      component: 'tenant-api-key-detail-route',
      action: 'PATCH',
      additionalData: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    })

    return NextResponse.json({
      success: false,
      error: 'Failed to update API key'
    }, { status: 500 })
  }
}

// DELETE: Delete API key
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ keyId: string }> }
) {
  try {
    const { keyId } = await params
    
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

    // Create Supabase client
    const supabase = await createServerClient()

    // Get API key with tenant info
    const { data: apiKey, error: getError } = await supabase
      .from('tenant_api_keys')
      .select(`
        *,
        tenants!inner(id, name)
      `)
      .eq('id', keyId)
      .single()

    if (getError || !apiKey) {
      return NextResponse.json({
        success: false,
        error: 'API key not found'
      }, { status: 404 })
    }

    // Check if user is admin of the tenant
    const { data: tenantUser, error: tenantUserError } = await supabase
      .from('tenant_users')
      .select('role, is_active')
      .eq('tenant_id', apiKey.tenant_id)
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

    // Delete API key
    const { error } = await supabase
      .from('tenant_api_keys')
      .delete()
      .eq('id', keyId)

    if (error) {
      errorLogger.logError('Failed to delete API key', {
        component: 'tenant-api-key-detail-route',
        action: 'DELETE',
        userId,
        additionalData: {
          error: error.message,
          errorCode: error.code,
          keyId
        }
      })

      return NextResponse.json({
        success: false,
        error: 'Failed to delete API key'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'API key deleted successfully'
    })

  } catch (error) {
    errorLogger.logError('Failed to delete API key', {
      component: 'tenant-api-key-detail-route',
      action: 'DELETE',
      additionalData: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    })

    return NextResponse.json({
      success: false,
      error: 'Failed to delete API key'
    }, { status: 500 })
  }
}
