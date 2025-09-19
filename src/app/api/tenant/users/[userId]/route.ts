import { NextRequest, NextResponse } from 'next/server'
import { AuthMiddleware, createAuthErrorResponse } from '@/lib/auth-middleware'
import { applyRateLimit, rateLimiters } from '@/lib/rate-limiter'
import { errorLogger } from '@/utils/errorLogger'
import { createServerClient } from '@/lib/supabase-server'

// DELETE: Remove user from tenant
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
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
    const { userId: targetUserId } = await params

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

    // Call the remove_user_from_tenant function
    const { data, error } = await supabase.rpc('remove_user_from_tenant', {
      target_tenant_id: tenantId,
      target_user_id: targetUserId
    })

    if (error) {
      errorLogger.logError('Failed to remove user from tenant', {
        component: 'tenant-users-route',
        action: 'DELETE',
        userId,
        tenantId,
        targetUserId,
        additionalData: {
          error: error.message,
          errorCode: error.code
        }
      })

      return NextResponse.json({
        success: false,
        error: 'Failed to remove user from tenant'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: { removed: data }
    })

  } catch (error) {
    errorLogger.logError('Failed to remove user from tenant', {
      component: 'tenant-users-route',
      action: 'DELETE',
      additionalData: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    })

    return NextResponse.json({
      success: false,
      error: 'Failed to remove user from tenant'
    }, { status: 500 })
  }
}
