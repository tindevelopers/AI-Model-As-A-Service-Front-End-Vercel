import { NextRequest, NextResponse } from 'next/server'
import { AuthMiddleware, createAuthErrorResponse } from '@/lib/auth-middleware'
import { applyRateLimit, rateLimiters } from '@/lib/rate-limiter'
import { errorLogger } from '@/utils/errorLogger'
import { createServerClient } from '@/lib/supabase-server'

// GET: List all tenants (superadmin only)
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await applyRateLimit(request, rateLimiters.admin)
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!
    }

    // Authenticate user and check superadmin role
    const authResult = await AuthMiddleware.requireSuperAdmin(request)
    if (!authResult.success) {
      return createAuthErrorResponse(authResult.error!, authResult.statusCode!)
    }

    const userId = authResult.user!.id

    // Create Supabase client
    const supabase = await createServerClient(request)

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

    // Authenticate user and check superadmin role
    const authResult = await AuthMiddleware.requireSuperAdmin(request)
    if (!authResult.success) {
      return createAuthErrorResponse(authResult.error!, authResult.statusCode!)
    }

    const userId = authResult.user!.id

    // Parse request body (handle both JSON and form data)
    let body
    const contentType = request.headers.get('content-type')
    
    if (contentType?.includes('application/json')) {
      body = await request.json()
    } else {
      // Handle form data
      const formData = await request.formData()
      body = {
        name: formData.get('name'),
        description: formData.get('description')
      }
    }

    const { name, slug, description, owner_user_id } = body

    // Validate required fields
    if (!name) {
      return NextResponse.json({
        success: false,
        error: 'name is required'
      }, { status: 400 })
    }

    // Generate slug if not provided
    const generatedSlug = slug || name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

    // Create Supabase client
    const supabase = await createServerClient(request)

    // Call the create_tenant function (superadmin only)
    const { data, error } = await supabase.rpc('create_tenant', {
      tenant_name: name,
      tenant_slug: generatedSlug,
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
          tenantSlug: generatedSlug
        }
      })

      return NextResponse.json({
        success: false,
        error: 'Failed to create tenant'
      }, { status: 500 })
    }

    // If this is a form submission, redirect to tenant management
    if (contentType?.includes('application/x-www-form-urlencoded') || contentType?.includes('multipart/form-data')) {
      return NextResponse.redirect(new URL('/tenant-management', request.url), { status: 303 })
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
