import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { apiManager } from '@/lib/api-management/api-manager'
import { AuthMiddleware, createAuthErrorResponse } from '@/lib/auth-middleware'
import { applyRateLimit, rateLimiters } from '@/lib/rate-limiter'
import { errorLogger } from '@/utils/errorLogger'
import { CreateApiKeyRequest } from '@/lib/api-management/types'

// GET: List API keys for the authenticated user
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await applyRateLimit(request, rateLimiters.apiKeyOperations)
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!
    }

    // Authenticate user
    const authResult = await AuthMiddleware.authenticateUser(request)
    if (!authResult.success) {
      return createAuthErrorResponse(authResult.error!, authResult.statusCode!)
    }

    const userId = authResult.user!.id

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    // List user's API keys
    const result = await apiManager.listApiKeys(userId)

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
    errorLogger.logError('Failed to list API keys', {
      component: 'admin-api-keys-route',
      action: 'GET',
      additionalData: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    })

    return NextResponse.json({
      success: false,
      error: 'Failed to list API keys'
    }, { status: 500 })
  }
}

// POST: Create a new API key
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await applyRateLimit(request, rateLimiters.apiKeyOperations)
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!
    }

    // Authenticate user
    const authResult = await AuthMiddleware.authenticateUser(request)
    if (!authResult.success) {
      return createAuthErrorResponse(authResult.error!, authResult.statusCode!)
    }

    const userId = authResult.user!.id

    // Parse request body
    const body = await request.json()
    const createRequest: CreateApiKeyRequest = body

    // Validate required fields
    if (!createRequest.name || !createRequest.providerIds?.length) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: name, providerIds'
      }, { status: 400 })
    }

    // Create API key
    const result = await apiManager.createApiKey(userId, createRequest)

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 })
    }

    return NextResponse.json(result, { status: 201 })

  } catch (error) {
    errorLogger.logError('Failed to create API key', {
      component: 'admin-api-keys-route',
      action: 'POST',
      additionalData: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    })

    return NextResponse.json({
      success: false,
      error: 'Failed to create API key'
    }, { status: 500 })
  }
}
