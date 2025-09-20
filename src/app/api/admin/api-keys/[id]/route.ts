import { NextRequest, NextResponse } from 'next/server'
import { AuthMiddleware, createAuthErrorResponse } from '@/lib/auth-middleware'
import { applyRateLimit, rateLimiters } from '@/lib/rate-limiter'
import { errorLogger } from '@/utils/errorLogger'
import { createServerClient } from '@/lib/supabase-server'

// PATCH: Update API key (superadmin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // Create Supabase client
    const supabase = await createServerClient()

    // Check if user is superadmin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (profile?.role !== 'superadmin') {
      return NextResponse.json({
        success: false,
        error: 'Access denied: Superadmin privileges required'
      }, { status: 403 })
    }

    const keyId = params.id
    const body = await request.json()

    // Update the API key
    const { data, error } = await supabase
      .from('tenant_api_keys')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', keyId)
      .select(`
        *,
        tenants!inner(name, slug, is_active),
        user_profiles!tenant_api_keys_created_by_fkey(email, full_name)
      `)
      .single()

    if (error) {
      errorLogger.logError('Failed to update API key', {
        component: 'admin-api-keys-route',
        action: 'PATCH',
        userId,
        keyId,
        additionalData: {
          error: error.message,
          errorCode: error.code
        }
      })

      return NextResponse.json({
        success: false,
        error: 'Failed to update API key'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data
    })

  } catch (error) {
    errorLogger.logError('Failed to update API key', {
      component: 'admin-api-keys-route',
      action: 'PATCH',
      additionalData: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    })

    return NextResponse.json({
      success: false,
      error: 'Failed to update API key'
    }, { status: 500 })
  }
}

// DELETE: Delete API key (superadmin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // Create Supabase client
    const supabase = await createServerClient()

    // Check if user is superadmin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (profile?.role !== 'superadmin') {
      return NextResponse.json({
        success: false,
        error: 'Access denied: Superadmin privileges required'
      }, { status: 403 })
    }

    const keyId = params.id

    // Delete the API key
    const { error } = await supabase
      .from('tenant_api_keys')
      .delete()
      .eq('id', keyId)

    if (error) {
      errorLogger.logError('Failed to delete API key', {
        component: 'admin-api-keys-route',
        action: 'DELETE',
        userId,
        keyId,
        additionalData: {
          error: error.message,
          errorCode: error.code
        }
      })

      return NextResponse.json({
        success: false,
        error: 'Failed to delete API key'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'API key deleted successfully'
    })

  } catch (error) {
    errorLogger.logError('Failed to delete API key', {
      component: 'admin-api-keys-route',
      action: 'DELETE',
      additionalData: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    })

    return NextResponse.json({
      success: false,
      error: 'Failed to delete API key'
    }, { status: 500 })
  }
}
