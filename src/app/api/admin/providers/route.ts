import { NextRequest, NextResponse } from 'next/server'
import { apiManager } from '@/lib/api-management/api-manager'
import { AuthMiddleware, createAuthErrorResponse } from '@/lib/auth-middleware'
import { applyRateLimit, rateLimiters } from '@/lib/rate-limiter'
import { errorLogger } from '@/utils/errorLogger'
import { CreateApiProviderRequest } from '@/lib/api-management/types'

// GET: List all API providers
export async function GET(request: NextRequest) {
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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    // List providers
    const result = await apiManager.listProviders(type as 'blog-writing' | 'content-generation' | 'seo-optimization' | 'keyword-research' | undefined)

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 })
    }

    // Simple pagination (in production, implement proper pagination)
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedData = result.data?.slice(startIndex, endIndex) || []

    return NextResponse.json({
      success: true,
      data: paginatedData,
      pagination: {
        page,
        limit,
        total: result.data?.length || 0,
        totalPages: Math.ceil((result.data?.length || 0) / limit),
        hasNext: endIndex < (result.data?.length || 0),
        hasPrev: page > 1
      }
    })

  } catch (error) {
    errorLogger.logError('Failed to list API providers', {
      component: 'admin-providers-route',
      action: 'GET',
      additionalData: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    })

    return NextResponse.json({
      success: false,
      error: 'Failed to list providers'
    }, { status: 500 })
  }
}

// POST: Create a new API provider
export async function POST(request: NextRequest) {
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

    // Parse request body
    const body = await request.json()
    const createRequest: CreateApiProviderRequest = body

    // Validate required fields
    if (!createRequest.name || !createRequest.type || !createRequest.environments?.length) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: name, type, environments'
      }, { status: 400 })
    }

    // Create provider
    const result = await apiManager.createProvider(createRequest)

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 })
    }

    return NextResponse.json(result, { status: 201 })

  } catch (error) {
    errorLogger.logError('Failed to create API provider', {
      component: 'admin-providers-route',
      action: 'POST',
      additionalData: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    })

    return NextResponse.json({
      success: false,
      error: 'Failed to create provider'
    }, { status: 500 })
  }
}
