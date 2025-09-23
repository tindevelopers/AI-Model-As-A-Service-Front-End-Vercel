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

    // Authenticate user and check tenant admin role
    const authResult = await AuthMiddleware.requireTenantAdmin()
    if (!authResult.success) {
      return createAuthErrorResponse(authResult.error!, authResult.statusCode!)
    }

    const userId = authResult.user!.id

    // Create Supabase client
    const supabase = await createServerClient()

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
