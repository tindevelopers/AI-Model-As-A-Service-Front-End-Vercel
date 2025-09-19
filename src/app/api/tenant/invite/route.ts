import { NextRequest, NextResponse } from 'next/server'
import { AuthMiddleware, createAuthErrorResponse } from '@/lib/auth-middleware'
import { applyRateLimit, rateLimiters } from '@/lib/rate-limiter'
import { errorLogger } from '@/utils/errorLogger'
import { createClient } from '@/lib/supabase-server'

// POST: Invite user to tenant
export async function POST(request: NextRequest) {
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

    // Parse request body
    const body = await request.json()
    const { tenant_id, user_id, role = 'member' } = body

    // Validate required fields
    if (!tenant_id || !user_id) {
      return NextResponse.json({
        success: false,
        error: 'tenant_id and user_id are required'
      }, { status: 400 })
    }

    // Validate role
    const validRoles = ['owner', 'admin', 'member', 'viewer']
    if (!validRoles.includes(role)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid role. Must be one of: owner, admin, member, viewer'
      }, { status: 400 })
    }

    // Create Supabase client
    const supabase = createClient()

    // Call the invite_user_to_tenant function
    const { data, error } = await supabase.rpc('invite_user_to_tenant', {
      target_tenant_id: tenant_id,
      target_user_id: user_id,
      target_role: role
    })

    if (error) {
      errorLogger.logError('Failed to invite user to tenant', {
        component: 'tenant-invite-route',
        action: 'POST',
        userId,
        tenantId: tenant_id,
        targetUserId: user_id,
        role,
        additionalData: {
          error: error.message,
          errorCode: error.code
        }
      })

      return NextResponse.json({
        success: false,
        error: 'Failed to invite user to tenant'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: { invited: data }
    })

  } catch (error) {
    errorLogger.logError('Failed to invite user to tenant', {
      component: 'tenant-invite-route',
      action: 'POST',
      additionalData: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    })

    return NextResponse.json({
      success: false,
      error: 'Failed to invite user to tenant'
    }, { status: 500 })
  }
}
