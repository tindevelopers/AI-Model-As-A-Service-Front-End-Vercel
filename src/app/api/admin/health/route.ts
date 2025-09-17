import { createServerClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { healthMonitor } from '@/lib/services/health-monitor'
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

    // Get system health
    const systemHealth = healthMonitor.getSystemHealth()
    const allHealthStatus = healthMonitor.getAllHealthStatus()
    const allMetrics = healthMonitor.getAllMetrics()

    return NextResponse.json({
      success: true,
      data: {
        system: systemHealth,
        services: allHealthStatus,
        metrics: allMetrics,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    errorLogger.logError('Failed to get system health', {
      component: 'admin-health-route',
      action: 'getHealth',
      additionalData: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    })

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get system health'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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
    const { action, serviceId } = body

    switch (action) {
      case 'start':
        healthMonitor.start(body.intervalMs || 30000)
        break
      
      case 'stop':
        healthMonitor.stop()
        break
      
      case 'check':
        if (serviceId) {
          // Trigger immediate health check for specific service
          const health = healthMonitor.getServiceHealth(serviceId)
          return NextResponse.json({
            success: true,
            data: health
          })
        }
        break
      
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: `Health monitor ${action} completed successfully`
    })

  } catch (error) {
    errorLogger.logError('Failed to manage health monitor', {
      component: 'admin-health-route',
      action: 'manageHealthMonitor',
      additionalData: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    })

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to manage health monitor'
    }, { status: 500 })
  }
}
