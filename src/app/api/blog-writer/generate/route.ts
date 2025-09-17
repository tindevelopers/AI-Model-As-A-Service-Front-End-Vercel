import { NextRequest, NextResponse } from 'next/server'
import { blogWriterApi, BlogWriterRequest } from '@/lib/services/blog-writer-api'
import { errorLogger } from '@/utils/errorLogger'
import { AuthMiddleware, createAuthErrorResponse, createAuthSuccessResponse } from '@/lib/auth-middleware'
import { applyRateLimit, rateLimiters } from '@/lib/rate-limiter'

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await applyRateLimit(request, rateLimiters.blogGeneration)
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!
    }

    // Authenticate user (flexible: API key or user session)
    const authResult = await AuthMiddleware.authenticateFlexible(request)
    if (!authResult.success) {
      return createAuthErrorResponse(authResult.error!, authResult.statusCode!)
    }

    const user = authResult.user!

    // Parse request body
    const body = await request.json()
    
    // Validate required fields
    if (!body.topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 })
    }

    // Create blog writer request
    const blogRequest: BlogWriterRequest = {
      topic: body.topic,
      keywords: body.keywords || [],
      tone: body.tone || 'professional',
      length: body.length || 'medium',
      target_audience: body.target_audience,
      include_outline: body.include_outline || true,
      language: body.language || 'en',
      style: body.style,
      additional_instructions: body.additional_instructions
    }

    // Generate blog post
    const response = await blogWriterApi.generateBlogPost(blogRequest)

    // Log successful generation
    errorLogger.logSuccess('Blog post generated successfully', {
      component: 'blog-writer-api-route',
      action: 'generate',
      additionalData: {
        userId: user.id,
        topic: blogRequest.topic,
        wordCount: response.word_count,
        hasOutline: !!response.outline
      }
    })

    return createAuthSuccessResponse(response, user)

  } catch (error) {
    errorLogger.logError('Blog generation failed', {
      component: 'blog-writer-api-route',
      action: 'generate',
      additionalData: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    })

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate blog post'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await applyRateLimit(request, rateLimiters.api)
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!
    }

    // Authenticate user (flexible: API key or user session)
    const authResult = await AuthMiddleware.authenticateFlexible(request)
    if (!authResult.success) {
      return createAuthErrorResponse(authResult.error!, authResult.statusCode!)
    }

    const user = authResult.user!

    // Get available options
    const options = await blogWriterApi.getAvailableOptions()

    return NextResponse.json({
      success: true,
      data: options
    })

  } catch (error) {
    errorLogger.logError('Failed to get blog writer options', {
      component: 'blog-writer-api-route',
      action: 'getOptions',
      additionalData: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    })

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get options'
    }, { status: 500 })
  }
}
