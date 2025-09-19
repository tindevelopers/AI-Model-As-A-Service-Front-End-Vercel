import { NextRequest, NextResponse } from 'next/server'
import { AuthMiddleware, createAuthErrorResponse } from '@/lib/auth-middleware'
import { applyRateLimit, rateLimiters } from '@/lib/rate-limiter'
import { errorLogger } from '@/utils/errorLogger'
import { createServerClient } from '@/lib/supabase-server'

// GET: Get tenant admin menu structure
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await applyRateLimit(request, rateLimiters.admin)
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!
    }

    // Authenticate user
    const authResult = await AuthMiddleware.authenticateUser()
    if (!authResult.success) {
      return createAuthErrorResponse(authResult.error!, authResult.statusCode!)
    }

    const userId = authResult.user!.id

    // Get tenant_id from query parameters
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenant_id')

    if (!tenantId) {
      return NextResponse.json({
        success: false,
        error: 'tenant_id is required'
      }, { status: 400 })
    }

    // Create Supabase client
    const supabase = await createServerClient()

    // Call the get_tenant_admin_menu function
    const { data, error } = await supabase.rpc('get_tenant_admin_menu', {
      target_tenant_id: tenantId
    })

    if (error) {
      errorLogger.logError('Failed to get tenant admin menu', {
        component: 'tenant-menu-route',
        action: 'GET',
        userId,
        additionalData: {
          tenantId,
          error: error.message,
          errorCode: error.code
        }
      })

      return NextResponse.json({
        success: false,
        error: 'Failed to get tenant admin menu'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: data
    })

  } catch (error) {
    errorLogger.logError('Failed to get tenant admin menu', {
      component: 'tenant-menu-route',
      action: 'GET',
      additionalData: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    })

    return NextResponse.json({
      success: false,
      error: 'Failed to get tenant admin menu'
    }, { status: 500 })
  }
}
