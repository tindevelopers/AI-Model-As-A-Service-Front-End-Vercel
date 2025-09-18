import { NextRequest, NextResponse } from 'next/server'
import { apiManager } from '@/lib/api-management/api-manager'
import { AuthMiddleware, createAuthErrorResponse } from '@/lib/auth-middleware'
import { applyRateLimit, rateLimiters } from '@/lib/rate-limiter'
import { errorLogger } from '@/utils/errorLogger'
import { BlogWriterRequest, BlogWriterResponse } from '@/lib/api-management/types'

// POST: Generate blog content using the API management system
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await applyRateLimit(request, rateLimiters.blogGeneration)
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
    const blogRequest: BlogWriterRequest = body

    // Validate required fields
    if (!blogRequest.topic) {
      return NextResponse.json({
        success: false,
        error: 'Topic is required'
      }, { status: 400 })
    }

    // Create API request for the blog writer service
    const apiRequest = {
      id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      providerId: 'blog-writer-prod', // Default to production
      environmentId: '', // Will be selected by the API manager
      endpoint: '/api/v1/generate',
      method: 'POST' as const,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'AI-As-A-Service-Frontend/1.0'
      },
      body: blogRequest,
      timestamp: new Date().toISOString(),
      userId
    }

    // Route request through API manager
    const result = await apiManager.routeRequest(apiRequest)

    if (!result.success) {
      errorLogger.logError('Blog generation failed', {
        component: 'blog-writer-generate-route',
        action: 'POST',
        additionalData: {
          userId,
          topic: blogRequest.topic,
          error: result.error
        }
      })

      return NextResponse.json({
        success: false,
        error: result.error || 'Blog generation failed'
      }, { status: 500 })
    }

    // Transform response to BlogWriterResponse format
    const response = result.data as unknown as Record<string, unknown>
    const metadata = response.metadata as unknown as Record<string, unknown> | undefined
    
    const blogResponse: BlogWriterResponse = {
      title: (typeof response.title === 'string' ? response.title : 'Generated Blog Post'),
      content: (typeof response.content === 'string' ? response.content : ''),
      outline: (Array.isArray(response.outline) ? response.outline : []),
      keywords_used: (Array.isArray(response.keywords_used) ? response.keywords_used : blogRequest.keywords || []),
      word_count: (typeof response.word_count === 'number' ? response.word_count : 0),
      estimated_reading_time: (typeof response.estimated_reading_time === 'number' ? response.estimated_reading_time : 0),
      seo_score: (typeof response.seo_score === 'number' ? response.seo_score : undefined),
      readability_score: (typeof response.readability_score === 'number' ? response.readability_score : undefined),
      metadata: {
        generated_at: new Date().toISOString(),
        model_used: (metadata && typeof metadata.model_used === 'string' ? metadata.model_used : 'blog-writer-api'),
        processing_time: (metadata && typeof metadata.processing_time === 'number' ? metadata.processing_time : 0),
        provider_used: (metadata && typeof metadata.provider_used === 'string' ? metadata.provider_used : 'blog-writer-prod'),
        environment_used: (metadata && typeof metadata.environment_used === 'string' ? metadata.environment_used : 'production')
      }
    }

    errorLogger.logSuccess('Blog generated successfully', {
      component: 'blog-writer-generate-route',
      action: 'POST',
      additionalData: {
        userId,
        topic: blogRequest.topic,
        wordCount: blogResponse.word_count,
        processingTime: blogResponse.metadata.processing_time
      }
    })

    return NextResponse.json({
      success: true,
      data: blogResponse,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    errorLogger.logError('Blog generation error', {
      component: 'blog-writer-generate-route',
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

// GET: Get available options for blog generation
export async function GET(request: NextRequest) {
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

    // Return available options for blog generation
    const options = {
      tones: ['professional', 'casual', 'friendly', 'authoritative', 'conversational'],
      lengths: ['short', 'medium', 'long'],
      languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko'],
      styles: ['informative', 'persuasive', 'narrative', 'expository', 'descriptive'],
      features: [
        'seo-optimization',
        'outline-generation',
        'keyword-integration',
        'tone-adaptation',
        'content-analysis',
        'keyword-research'
      ]
    }

    return NextResponse.json({
      success: true,
      data: options,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    errorLogger.logError('Failed to get blog generation options', {
      component: 'blog-writer-generate-route',
      action: 'GET',
      additionalData: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    })

    return NextResponse.json({
      success: false,
      error: 'Failed to get options'
    }, { status: 500 })
  }
}
