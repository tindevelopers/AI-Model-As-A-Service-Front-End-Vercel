import { NextRequest, NextResponse } from 'next/server'
import { apiManager } from '@/lib/api-management/api-manager'
import { AuthMiddleware, createAuthErrorResponse } from '@/lib/auth-middleware'
import { applyRateLimit, rateLimiters } from '@/lib/rate-limiter'
import { errorLogger } from '@/utils/errorLogger'
import { UpdateApiProviderRequest } from '@/lib/api-management/types'

// GET: Get a specific API provider
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Apply rate limiting
    const rateLimitResult = await applyRateLimit(request, rateLimiters.admin)
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!
    }

    // Authenticate user (admin only)
    const authResult = await AuthMiddleware.requireAdmin(request)
    if (!authResult.success) {
      return createAuthErrorResponse(authResult.error!, authResult.statusCode!)
    }

    const { id } = await params

    // Get provider
    const result = await apiManager.getProvider(id)

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: result.error === 'Provider not found' ? 404 : 500 })
    }

    return NextResponse.json(result)

  } catch (error) {
    errorLogger.logError('Failed to get API provider', {
      component: 'admin-providers-id-route',
      action: 'GET',
      additionalData: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    })

    return NextResponse.json({
      success: false,
      error: 'Failed to get provider'
    }, { status: 500 })
  }
}

// PUT: Update an API provider
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Apply rate limiting
    const rateLimitResult = await applyRateLimit(request, rateLimiters.admin)
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!
    }

    // Authenticate user (admin only)
    const authResult = await AuthMiddleware.requireAdmin(request)
    if (!authResult.success) {
      return createAuthErrorResponse(authResult.error!, authResult.statusCode!)
    }

    const { id } = await params

    // Parse request body
    const body = await request.json()
    const updateRequest: UpdateApiProviderRequest = body

    // Update provider
    const result = await apiManager.updateProvider(id, updateRequest)

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: result.error === 'Provider not found' ? 404 : 500 })
    }

    return NextResponse.json(result)

  } catch (error) {
    errorLogger.logError('Failed to update API provider', {
      component: 'admin-providers-id-route',
      action: 'PUT',
      additionalData: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    })

    return NextResponse.json({
      success: false,
      error: 'Failed to update provider'
    }, { status: 500 })
  }
}

// DELETE: Delete an API provider
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Apply rate limiting
    const rateLimitResult = await applyRateLimit(request, rateLimiters.admin)
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!
    }

    // Authenticate user (admin only)
    const authResult = await AuthMiddleware.requireAdmin(request)
    if (!authResult.success) {
      return createAuthErrorResponse(authResult.error!, authResult.statusCode!)
    }

    const { id } = await params

    // Delete provider
    const result = await apiManager.deleteProvider(id)

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: result.error === 'Provider not found' ? 404 : 500 })
    }

    return NextResponse.json(result)

  } catch (error) {
    errorLogger.logError('Failed to delete API provider', {
      component: 'admin-providers-id-route',
      action: 'DELETE',
      additionalData: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    })

    return NextResponse.json({
      success: false,
      error: 'Failed to delete provider'
    }, { status: 500 })
  }
}
