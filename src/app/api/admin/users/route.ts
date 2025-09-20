import { NextRequest, NextResponse } from 'next/server'
import { AuthMiddleware, createAuthErrorResponse } from '@/lib/auth-middleware'
import { applyRateLimit, rateLimiters } from '@/lib/rate-limiter'
import { errorLogger } from '@/utils/errorLogger'
import { createServerClient } from '@/lib/supabase-server'

// GET: List all users (superadmin only)
export async function GET(request: NextRequest) {
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

    // Create Supabase client
    const supabase = await createServerClient()

    // Call the get_all_users_with_roles function (superadmin only)
    const { data, error } = await supabase.rpc('get_all_users_with_roles')

    if (error) {
      errorLogger.logError('Failed to get all users', {
        component: 'admin-users-route',
        action: 'GET',
        userId,
        additionalData: {
          error: error.message,
          errorCode: error.code
        }
      })

      return NextResponse.json({
        success: false,
        error: 'Failed to get all users'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: data || []
    })

  } catch (error) {
    errorLogger.logError('Failed to get all users', {
      component: 'admin-users-route',
      action: 'GET',
      additionalData: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    })

    return NextResponse.json({
      success: false,
      error: 'Failed to get all users'
    }, { status: 500 })
  }
}

// DELETE: Delete a user (superadmin only)
export async function DELETE(request: NextRequest) {
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

    // Prevent deleting self
    if (targetUserId === userId) {
      return NextResponse.json({
        success: false,
        error: 'Cannot delete your own account'
      }, { status: 400 })
    }

    // Create Supabase client
    const supabase = await createServerClient()

    // Call the delete_user function (superadmin only, with protection)
    const { error } = await supabase.rpc('delete_user', {
      target_user_id: targetUserId
    })

    if (error) {
      errorLogger.logError('Failed to delete user', {
        component: 'admin-users-route',
        action: 'DELETE',
        userId,
        additionalData: {
          error: error.message,
          errorCode: error.code,
          targetUserId
        }
      })

      return NextResponse.json({
        success: false,
        error: 'Failed to delete user'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    })

  } catch (error) {
    errorLogger.logError('Failed to delete user', {
      component: 'admin-users-route',
      action: 'DELETE',
      additionalData: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    })

    return NextResponse.json({
      success: false,
      error: 'Failed to delete user'
    }, { status: 500 })
  }
}
