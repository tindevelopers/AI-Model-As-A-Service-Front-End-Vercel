import { NextRequest, NextResponse } from 'next/server'
import { AuthMiddleware, createAuthErrorResponse } from '@/lib/auth-middleware'
import { applyRateLimit, rateLimiters } from '@/lib/rate-limiter'
import { errorLogger } from '@/utils/errorLogger'
import { createServerClient } from '@/lib/supabase-server'

// POST: Promote user to tenant admin (superadmin only)
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await applyRateLimit(request, rateLimiters.admin)
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!
    }

    // Authenticate user and check superadmin role
    const authResult = await AuthMiddleware.requireSuperAdmin()
    if (!authResult.success) {
      return createAuthErrorResponse(authResult.error!, authResult.statusCode!)
    }

    const userId = authResult.user!.id

    // Parse request body
    const body = await request.json()
    const { userId: targetUserId } = body

    // Validate required fields
    if (!targetUserId) {
      return NextResponse.json({
        success: false,
        error: 'userId is required'
      }, { status: 400 })
    }

    // Create Supabase client
    const supabase = await createServerClient()

    // Call the promote_user_to_tenant_admin function (superadmin only)
    const { data, error } = await supabase.rpc('promote_user_to_tenant_admin', {
      target_user_id: targetUserId
    })

    if (error) {
      errorLogger.logError('Failed to promote user to tenant admin', {
        component: 'admin-users-promote-tenant-admin-route',
        action: 'POST',
        userId,
        additionalData: {
          error: error.message,
          errorCode: error.code,
          targetUserId
        }
      })

      return NextResponse.json({
        success: false,
        error: 'Failed to promote user to tenant admin'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'User promoted to tenant admin successfully'
    })

  } catch (error) {
    errorLogger.logError('Failed to promote user to tenant admin', {
      component: 'admin-users-promote-tenant-admin-route',
      action: 'POST',
      additionalData: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    })

    return NextResponse.json({
      success: false,
      error: 'Failed to promote user to tenant admin'
    }, { status: 500 })
  }
}
