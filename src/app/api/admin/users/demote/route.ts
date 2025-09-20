import { NextRequest, NextResponse } from 'next/server'
import { AuthMiddleware, createAuthErrorResponse } from '@/lib/auth-middleware'
import { applyRateLimit, rateLimiters } from '@/lib/rate-limiter'
import { errorLogger } from '@/utils/errorLogger'
import { createServerClient } from '@/lib/supabase-server'

// POST: Demote admin to user (superadmin only)
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

    // Call the demote_admin_to_user function (superadmin only)
    const { error } = await supabase.rpc('demote_admin_to_user', {
      target_user_id: targetUserId
    })

    if (error) {
      errorLogger.logError('Failed to demote admin to user', {
        component: 'admin-users-demote-route',
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
        error: 'Failed to demote admin to user'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Admin demoted to user successfully'
    })

  } catch (error) {
    errorLogger.logError('Failed to demote admin to user', {
      component: 'admin-users-demote-route',
      action: 'POST',
      additionalData: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    })

    return NextResponse.json({
      success: false,
      error: 'Failed to demote admin to user'
    }, { status: 500 })
  }
}
