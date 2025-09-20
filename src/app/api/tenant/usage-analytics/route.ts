import { NextRequest, NextResponse } from 'next/server'
import { AuthMiddleware, createAuthErrorResponse } from '@/lib/auth-middleware'
import { applyRateLimit, rateLimiters } from '@/lib/rate-limiter'
import { errorLogger } from '@/utils/errorLogger'
import { createServerClient } from '@/lib/supabase-server'

// GET: Get tenant API usage analytics
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
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

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

    // Get usage analytics
    const { data: usageStats, error } = await supabase
      .rpc('get_tenant_api_usage_stats', {
        target_tenant_id: tenantId,
        start_date: startDate || null,
        end_date: endDate || null
      })

    if (error) {
      errorLogger.logError('Failed to get tenant usage analytics', {
        component: 'tenant-usage-analytics-route',
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
        error: 'Failed to get usage analytics'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: usageStats?.[0] || {
        total_requests: 0,
        successful_requests: 0,
        failed_requests: 0,
        avg_response_time_ms: 0,
        total_request_size_bytes: 0,
        total_response_size_bytes: 0,
        unique_users: 0,
        top_endpoints: [],
        hourly_usage: []
      }
    })

  } catch (error) {
    errorLogger.logError('Failed to get tenant usage analytics', {
      component: 'tenant-usage-analytics-route',
      action: 'GET',
      additionalData: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    })

    return NextResponse.json({
      success: false,
      error: 'Failed to get usage analytics'
    }, { status: 500 })
  }
}
