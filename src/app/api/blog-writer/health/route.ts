import { NextRequest, NextResponse } from 'next/server'
import { blogWriterApi } from '@/lib/services/blog-writer-api'
import { errorLogger } from '@/utils/errorLogger'
import { AuthMiddleware, createAuthErrorResponse } from '@/lib/auth-middleware'
import { applyRateLimit, rateLimiters } from '@/lib/rate-limiter'

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await applyRateLimit(request, rateLimiters.healthCheck)
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!
    }

    // Authenticate user (admin or authenticated user)
    const authResult = await AuthMiddleware.authenticateFlexible(request)
    if (!authResult.success) {
      return createAuthErrorResponse(authResult.error!, authResult.statusCode!)
    }

    // Perform health check
    const healthStatus = await blogWriterApi.healthCheck()

    return NextResponse.json({
      success: true,
      data: {
        service: 'blog-writer-api',
        ...healthStatus
      }
    })

  } catch (error) {
    errorLogger.logError('Blog writer health check failed', {
      component: 'blog-writer-health-route',
      action: 'healthCheck',
      additionalData: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    })

    return NextResponse.json({
      success: false,
      data: {
        service: 'blog-writer-api',
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Health check failed'
      }
    }, { status: 503 })
  }
}
