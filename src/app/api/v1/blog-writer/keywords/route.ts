import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { apiManager } from '@/lib/api-management/api-manager'
import { AuthMiddleware, createAuthErrorResponse } from '@/lib/auth-middleware'
import { applyRateLimit, rateLimiters } from '@/lib/rate-limiter'
import { errorLogger } from '@/utils/errorLogger'

// POST: Analyze keywords
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await applyRateLimit(request, rateLimiters.keywordAnalysis)
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
    const { keywords, content, analysis_type = 'comprehensive' } = body

    // Validate required fields
    if (!keywords && !content) {
      return NextResponse.json({
        success: false,
        error: 'Either keywords or content is required for analysis'
      }, { status: 400 })
    }

    // Create API request for keyword analysis
    const apiRequest = {
      id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      providerId: 'blog-writer-prod',
      environmentId: '',
      endpoint: '/api/v1/keywords/analyze',
      method: 'POST' as const,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'AI-As-A-Service-Frontend/1.0'
      },
      body: {
        keywords,
        content,
        analysis_type,
        include_competition: true,
        include_search_volume: true,
        include_suggestions: true
      },
      timestamp: new Date().toISOString(),
      userId
    }

    // Route request through API manager
    const result = await apiManager.routeRequest(apiRequest)

    if (!result.success) {
      errorLogger.logError('Keyword analysis failed', {
        component: 'blog-writer-keywords-route',
        action: 'POST',
        additionalData: {
          userId,
          analysisType: analysis_type,
          hasKeywords: !!keywords,
          hasContent: !!content,
          error: result.error
        }
      })

      return NextResponse.json({
        success: false,
        error: result.error || 'Keyword analysis failed'
      }, { status: 500 })
    }

    errorLogger.logSuccess('Keywords analyzed successfully', {
      component: 'blog-writer-keywords-route',
      action: 'POST',
      additionalData: {
        userId,
        analysisType: analysis_type,
        keywordCount: keywords?.length || 0
      }
    })

    return NextResponse.json({
      success: true,
      data: result.data,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    errorLogger.logError('Keyword analysis error', {
      component: 'blog-writer-keywords-route',
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

// GET: Get keyword suggestions
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await applyRateLimit(request, rateLimiters.keywordAnalysis)
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
    const topic = searchParams.get('topic')
    const seed_keywords = searchParams.get('seed_keywords')
    const limit = parseInt(searchParams.get('limit') || '10')

    // Validate required fields
    if (!topic && !seed_keywords) {
      return NextResponse.json({
        success: false,
        error: 'Either topic or seed_keywords is required'
      }, { status: 400 })
    }

    // Create API request for keyword suggestions
    const apiRequest = {
      id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      providerId: 'blog-writer-prod',
      environmentId: '',
      endpoint: '/api/v1/keywords/suggest',
      method: 'GET' as const,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'AI-As-A-Service-Frontend/1.0'
      },
      queryParams: {
        topic: topic || '',
        seed_keywords: seed_keywords || '',
        limit: limit.toString()
      },
      timestamp: new Date().toISOString(),
      userId
    }

    // Route request through API manager
    const result = await apiManager.routeRequest(apiRequest)

    if (!result.success) {
      errorLogger.logError('Keyword suggestions failed', {
        component: 'blog-writer-keywords-route',
        action: 'GET',
        additionalData: {
          userId,
          topic,
          seedKeywords: seed_keywords,
          error: result.error
        }
      })

      return NextResponse.json({
        success: false,
        error: result.error || 'Keyword suggestions failed'
      }, { status: 500 })
    }

    errorLogger.logSuccess('Keyword suggestions retrieved successfully', {
      component: 'blog-writer-keywords-route',
      action: 'GET',
      additionalData: {
        userId,
        topic,
        limit
      }
    })

    return NextResponse.json({
      success: true,
      data: result.data,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    errorLogger.logError('Keyword suggestions error', {
      component: 'blog-writer-keywords-route',
      action: 'GET',
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
