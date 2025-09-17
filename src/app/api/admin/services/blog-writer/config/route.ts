import { createServerClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { blogWriterApi } from '@/lib/services/blog-writer-api'
import { errorLogger } from '@/utils/errorLogger'

export async function GET() {
  try {
    // Authenticate user (admin only)
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // TODO: Add admin role check here
    // For now, allow any authenticated user to access admin endpoints

    // Get current configuration
    const config = blogWriterApi.getConfig()

    return NextResponse.json({
      success: true,
      data: config
    })

  } catch (error) {
    errorLogger.logError('Failed to get blog writer config', {
      component: 'admin-blog-writer-config',
      action: 'getConfig',
      additionalData: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    })

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get configuration'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Authenticate user (admin only)
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // TODO: Add admin role check here
    // For now, allow any authenticated user to access admin endpoints

    // Parse request body
    const body = await request.json()
    
    // Validate configuration
    if (!body.baseUrl) {
      return NextResponse.json({ error: 'Base URL is required' }, { status: 400 })
    }

    // Update configuration
    blogWriterApi.updateConfig({
      baseUrl: body.baseUrl,
      timeout: body.timeout,
      retryAttempts: body.retryAttempts
    })

    errorLogger.logSuccess('Blog writer configuration updated', {
      component: 'admin-blog-writer-config',
      action: 'updateConfig',
      additionalData: {
        userId: user.id,
        baseUrl: body.baseUrl
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Configuration updated successfully'
    })

  } catch (error) {
    errorLogger.logError('Failed to update blog writer config', {
      component: 'admin-blog-writer-config',
      action: 'updateConfig',
      additionalData: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    })

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update configuration'
    }, { status: 500 })
  }
}
