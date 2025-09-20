import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { errorLogger } from '@/utils/errorLogger'

// POST: Log API key usage
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      tenantId,
      apiKeyId,
      userId,
      endpoint,
      method,
      statusCode,
      responseTimeMs,
      requestSizeBytes,
      responseSizeBytes,
      ipAddress,
      userAgent
    } = body

    if (!tenantId || !apiKeyId || !endpoint || !method || !statusCode) {
      return NextResponse.json({
        success: false,
        error: 'Required fields: tenantId, apiKeyId, endpoint, method, statusCode'
      }, { status: 400 })
    }

    // Create Supabase client
    const supabase = await createServerClient()

    // Log the usage
    const { data: usageId, error } = await supabase
      .rpc('log_api_key_usage', {
        target_tenant_id: tenantId,
        target_api_key_id: apiKeyId,
        target_user_id: userId || null,
        request_endpoint: endpoint,
        request_method: method,
        status_code: statusCode,
        response_time_ms: responseTimeMs || null,
        request_size_bytes: requestSizeBytes || null,
        response_size_bytes: responseSizeBytes || null,
        ip_address: ipAddress || null,
        user_agent: userAgent || null
      })

    if (error) {
      errorLogger.logError('Failed to log API key usage', {
        component: 'tenant-log-usage-route',
        action: 'POST',
        additionalData: {
          error: error.message,
          errorCode: error.code,
          tenantId,
          apiKeyId,
          endpoint
        }
      })

      return NextResponse.json({
        success: false,
        error: 'Failed to log usage'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: { usageId }
    })

  } catch (error) {
    errorLogger.logError('Failed to log API key usage', {
      component: 'tenant-log-usage-route',
      action: 'POST',
      additionalData: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    })

    return NextResponse.json({
      success: false,
      error: 'Failed to log usage'
    }, { status: 500 })
  }
}
