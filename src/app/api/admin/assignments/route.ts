import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { apiManager } from '@/lib/api-management/api-manager'
import { AuthMiddleware, createAuthErrorResponse } from '@/lib/auth-middleware'
import { applyRateLimit, rateLimiters } from '@/lib/rate-limiter'
import { errorLogger } from '@/utils/errorLogger'
import { CreateApiAssignmentRequest } from '@/lib/api-management/types'

// GET: List API assignments for the authenticated user
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await applyRateLimit(request, rateLimiters.adminOperations)
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

    // List user's assignments (in production, implement proper assignment listing)
    // For now, return empty array as assignments are not yet fully implemented
    const assignments: any[] = []

    // Simple pagination
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedData = assignments.slice(startIndex, endIndex)

    return NextResponse.json({
      success: true,
      data: paginatedData,
      pagination: {
        page,
        limit,
        total: assignments.length,
        totalPages: Math.ceil(assignments.length / limit),
        hasNext: endIndex < assignments.length,
        hasPrev: page > 1
      }
    })

  } catch (error) {
    errorLogger.logError('Failed to list API assignments', {
      component: 'admin-assignments-route',
      action: 'GET',
      additionalData: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    })

    return NextResponse.json({
      success: false,
      error: 'Failed to list assignments'
    }, { status: 500 })
  }
}

// POST: Create a new API assignment
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await applyRateLimit(request, rateLimiters.adminOperations)
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
    const createRequest: CreateApiAssignmentRequest = body

    // Validate required fields
    if (!createRequest.name || !createRequest.providerIds?.length) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: name, providerIds'
      }, { status: 400 })
    }

    // Create assignment
    const result = await apiManager.createAssignment(userId, createRequest)

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 })
    }

    return NextResponse.json(result, { status: 201 })

  } catch (error) {
    errorLogger.logError('Failed to create API assignment', {
      component: 'admin-assignments-route',
      action: 'POST',
      additionalData: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    })

    return NextResponse.json({
      success: false,
      error: 'Failed to create assignment'
    }, { status: 500 })
  }
}
