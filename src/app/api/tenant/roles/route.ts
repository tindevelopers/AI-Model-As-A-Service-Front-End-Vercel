import { NextRequest, NextResponse } from 'next/server'
import { createAuthErrorResponse } from '@/lib/auth-middleware'
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

    // Create Supabase client first
    const supabase = await createServerClient()

    // Check for Authorization header first (for API token auth)
    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7) // Remove 'Bearer ' prefix
      // Set the session using the token
      const { data: { session }, error: sessionError } = await supabase.auth.setSession({
        access_token: token,
        refresh_token: '' // We don't have refresh token from header
      })
      
      if (sessionError || !session) {
        return createAuthErrorResponse('Invalid session token', 401)
      }
    }

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return createAuthErrorResponse('Unauthorized - Please log in to access this resource', 401)
    }

    const userId = user.id

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
