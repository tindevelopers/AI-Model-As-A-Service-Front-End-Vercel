import { NextRequest, NextResponse } from 'next/server'
import { apiManager } from '@/lib/api-management/api-manager'
import { AuthMiddleware, createAuthErrorResponse } from '@/lib/auth-middleware'
import { applyRateLimit, rateLimiters } from '@/lib/rate-limiter'
import { errorLogger } from '@/utils/errorLogger'

// POST: Analyze existing content
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await applyRateLimit(request, rateLimiters.api)
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
    const { content, analysis_type = 'comprehensive' } = body

    // Validate required fields
    if (!content) {
      return NextResponse.json({
        success: false,
        error: 'Content is required for analysis'
      }, { status: 400 })
    }

    // Create API request for content analysis
    const apiRequest = {
      id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      providerId: 'blog-writer-prod',
      environmentId: '',
      endpoint: '/api/v1/analyze',
      method: 'POST' as const,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'AI-As-A-Service-Frontend/1.0'
      },
      body: {
        content,
        analysis_type,
        include_suggestions: true,
        include_seo_score: true,
        include_readability_score: true
      },
      timestamp: new Date().toISOString(),
      userId
    }

    // Route request through API manager
    const result = await apiManager.routeRequest(apiRequest)

    if (!result.success) {
      errorLogger.logError('Content analysis failed', {
        component: 'blog-writer-analyze-route',
        action: 'POST',
        additionalData: {
          userId,
          analysisType: analysis_type,
          error: result.error
        }
      })

      return NextResponse.json({
        success: false,
        error: result.error || 'Content analysis failed'
      }, { status: 500 })
    }

    errorLogger.logSuccess('Content analyzed successfully', {
      component: 'blog-writer-analyze-route',
      action: 'POST',
      additionalData: {
        userId,
        analysisType: analysis_type,
        contentLength: content.length
      }
    })

    return NextResponse.json({
      success: true,
      data: result.data,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    errorLogger.logError('Content analysis error', {
      component: 'blog-writer-analyze-route',
      action: 'POST',
      additionalData: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    })

    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}
