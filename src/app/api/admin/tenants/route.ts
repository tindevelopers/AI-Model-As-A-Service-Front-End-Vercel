import { NextRequest, NextResponse } from 'next/server'
import { AuthMiddleware, createAuthErrorResponse } from '@/lib/auth-middleware'
import { applyRateLimit, rateLimiters } from '@/lib/rate-limiter'
import { errorLogger } from '@/utils/errorLogger'
import { createClient } from '@/lib/supabase-server'

// GET: List all tenants (superadmin only)
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

    // Create Supabase client
    const supabase = createClient()

    // Call the get_all_tenants function (superadmin only)
    const { data, error } = await supabase.rpc('get_all_tenants')

    if (error) {
      errorLogger.logError('Failed to get all tenants', {
        component: 'admin-tenants-route',
        action: 'GET',
        userId,
        additionalData: {
          error: error.message,
          errorCode: error.code
        }
      })

      return NextResponse.json({
        success: false,
        error: 'Failed to get all tenants'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: data || []
    })

  } catch (error) {
    errorLogger.logError('Failed to get all tenants', {
      component: 'admin-tenants-route',
      action: 'GET',
      additionalData: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    })

    return NextResponse.json({
      success: false,
      error: 'Failed to get all tenants'
    }, { status: 500 })
  }
}

// POST: Create a new tenant (superadmin only)
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
    const { name, slug, description, owner_user_id } = body

    // Validate required fields
    if (!name || !slug) {
      return NextResponse.json({
        success: false,
        error: 'name and slug are required'
      }, { status: 400 })
    }

    // Create Supabase client
    const supabase = createClient()

    // Call the create_tenant function (superadmin only)
    const { data, error } = await supabase.rpc('create_tenant', {
      tenant_name: name,
      tenant_slug: slug,
      tenant_description: description || null,
      owner_user_id: owner_user_id || null
    })

    if (error) {
      errorLogger.logError('Failed to create tenant', {
        component: 'admin-tenants-route',
        action: 'POST',
        userId,
        additionalData: {
          error: error.message,
          errorCode: error.code,
          tenantName: name,
          tenantSlug: slug
        }
      })

      return NextResponse.json({
        success: false,
        error: 'Failed to create tenant'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: { tenant_id: data }
    }, { status: 201 })

  } catch (error) {
    errorLogger.logError('Failed to create tenant', {
      component: 'admin-tenants-route',
      action: 'POST',
      additionalData: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    })

    return NextResponse.json({
      success: false,
      error: 'Failed to create tenant'
    }, { status: 500 })
  }
}
