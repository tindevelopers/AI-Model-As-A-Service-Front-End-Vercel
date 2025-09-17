import { NextRequest, NextResponse } from 'next/server'
import { blogWriterApi } from '@/lib/services/blog-writer-api'
import { errorLogger } from '@/utils/errorLogger'

export async function GET(request: NextRequest) {
  try {
    // Perform health check
    const healthStatus = await blogWriterApi.healthCheck()

    return NextResponse.json({
      success: true,
      data: {
        service: 'blog-writer-api',
        status: 'healthy',
        timestamp: new Date().toISOString(),
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
