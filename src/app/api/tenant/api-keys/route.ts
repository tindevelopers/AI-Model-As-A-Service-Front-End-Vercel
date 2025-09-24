import { NextRequest, NextResponse } from 'next/server'
import { AuthMiddleware, createAuthErrorResponse } from '@/lib/auth-middleware'
import { applyRateLimit, rateLimiters } from '@/lib/rate-limiter'
import { errorLogger } from '@/utils/errorLogger'
import { createServerClient } from '@/lib/supabase-server'

// GET: List tenant API keys
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

    // Get tenant API keys
    const { data: apiKeys, error } = await supabase
      .from('tenant_api_keys')
      .select(`
        id,
        name,
        api_key,
        key_prefix,
        is_active,
        expires_at,
        created_at,
        created_by,
        description
      `)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (error) {
      errorLogger.logError('Failed to get tenant API keys', {
        component: 'tenant-api-keys-route',
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
        error: 'Failed to get API keys'
      }, { status: 500 })
    }

    // Mask API keys for security (only show prefix)
    const maskedApiKeys = apiKeys?.map(key => ({
      ...key,
      api_key: key.key_prefix // Show only prefix, not full key
    })) || []

    return NextResponse.json({
      success: true,
      data: maskedApiKeys
    })

  } catch (error) {
    errorLogger.logError('Failed to get tenant API keys', {
      component: 'tenant-api-keys-route',
      action: 'GET',
      additionalData: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    })

    return NextResponse.json({
      success: false,
      error: 'Failed to get API keys'
    }, { status: 500 })
  }
}

// POST: Create new tenant API key
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
    const { tenantId, name, description, expires_at } = body

    if (!tenantId || !name) {
      return NextResponse.json({
        success: false,
        error: 'Tenant ID and name are required'
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

    // Generate API key
    const timestamp = Date.now()
    const randomPart = Math.random().toString(36).substring(2, 34)
    const apiKey = `tn_${timestamp}_sk_${randomPart}`
    const keyPrefix = `tn_${timestamp}_sk_...`

    // Create API key
    const { data: newApiKey, error } = await supabase
      .from('tenant_api_keys')
      .insert({
        tenant_id: tenantId,
        name,
        api_key: apiKey,
        key_prefix: keyPrefix,
        description,
        expires_at: expires_at || null,
        created_by: userId,
        is_active: true
      })
      .select()
      .single()

    if (error) {
      errorLogger.logError('Failed to create tenant API key', {
        component: 'tenant-api-keys-route',
        action: 'POST',
        userId,
        additionalData: {
          error: error.message,
          errorCode: error.code,
          tenantId,
          name
        }
      })

      return NextResponse.json({
        success: false,
        error: 'Failed to create API key'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        ...newApiKey,
        api_key: apiKey // Return full key only on creation
      }
    }, { status: 201 })

  } catch (error) {
    errorLogger.logError('Failed to create tenant API key', {
      component: 'tenant-api-keys-route',
      action: 'POST',
      additionalData: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    })

    return NextResponse.json({
      success: false,
      error: 'Failed to create API key'
    }, { status: 500 })
  }
}
