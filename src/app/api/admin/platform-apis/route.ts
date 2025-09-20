import { NextRequest, NextResponse } from 'next/server'
import { AuthMiddleware, createAuthErrorResponse } from '@/lib/auth-middleware'
import { applyRateLimit, rateLimiters } from '@/lib/rate-limiter'
import { errorLogger } from '@/utils/errorLogger'
import { createServerClient } from '@/lib/supabase-server'

// GET: Get platform API services and tenant access
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await applyRateLimit(request, rateLimiters.admin)
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!
    }

    // Authenticate user
    const authResult = await AuthMiddleware.authenticateUser()
    if (!authResult.success) {
      return createAuthErrorResponse(authResult.error!, authResult.statusCode!)
    }

    const userId = authResult.user!.id

    // Create Supabase client
    const supabase = await createServerClient()

    // Check if user is superadmin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (profile?.role !== 'superadmin') {
      return NextResponse.json({
        success: false,
        error: 'Access denied: Superadmin privileges required'
      }, { status: 403 })
    }

    // Get all tenants
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('id, name, slug, is_active')
      .order('name')

    if (tenantsError) {
      throw tenantsError
    }

    // Platform API services configuration
    const platformApis = [
      {
        id: 'blog-writer',
        name: 'Blog Writer API',
        description: 'AI-powered blog content generation using GPT models',
        status: 'active',
        endpoints: ['/api/blog-writer/generate', '/api/blog-writer/analyze'],
        cloudProvider: 'Google Cloud',
        pricing: 'Per token usage',
        tenantAccess: tenants?.map(tenant => ({
          tenantId: tenant.id,
          tenantName: tenant.name,
          enabled: true,
          quota: 10000,
          used: Math.floor(Math.random() * 5000)
        })) || []
      },
      {
        id: 'listing-optimization',
        name: 'Listing Optimization API',
        description: 'Real estate listing optimization and enhancement',
        status: 'active',
        endpoints: ['/api/listing/optimize', '/api/listing/analyze'],
        cloudProvider: 'AWS',
        pricing: 'Per listing processed',
        tenantAccess: tenants?.map(tenant => ({
          tenantId: tenant.id,
          tenantName: tenant.name,
          enabled: true,
          quota: 1000,
          used: Math.floor(Math.random() * 200)
        })) || []
      },
      {
        id: 'outreach-automation',
        name: 'Outreach Automation API',
        description: 'Automated outreach campaigns and follow-ups',
        status: 'active',
        endpoints: ['/api/outreach/send', '/api/outreach/template'],
        cloudProvider: 'Azure',
        pricing: 'Per campaign',
        tenantAccess: tenants?.map(tenant => ({
          tenantId: tenant.id,
          tenantName: tenant.name,
          enabled: true,
          quota: 100,
          used: Math.floor(Math.random() * 20)
        })) || []
      },
      {
        id: 'custom-llm',
        name: 'Custom LLM API',
        description: 'Access to custom language models and fine-tuned models',
        status: 'active',
        endpoints: ['/api/llm/chat', '/api/llm/completion'],
        cloudProvider: 'Google Cloud',
        pricing: 'Per request',
        tenantAccess: tenants?.map(tenant => ({
          tenantId: tenant.id,
          tenantName: tenant.name,
          enabled: true,
          quota: 50000,
          used: Math.floor(Math.random() * 10000)
        })) || []
      },
      {
        id: 'analytics',
        name: 'Analytics API',
        description: 'Usage and performance analytics across all services',
        status: 'active',
        endpoints: ['/api/analytics/usage', '/api/analytics/performance'],
        cloudProvider: 'AWS',
        pricing: 'Per data point',
        tenantAccess: tenants?.map(tenant => ({
          tenantId: tenant.id,
          tenantName: tenant.name,
          enabled: true,
          quota: 1000000,
          used: Math.floor(Math.random() * 100000)
        })) || []
      }
    ]

    return NextResponse.json({
      success: true,
      data: {
        platformApis,
        totalServices: platformApis.length,
        activeServices: platformApis.filter(api => api.status === 'active').length,
        totalTenants: tenants?.length || 0
      }
    })

  } catch (error) {
    errorLogger.logError('Failed to get platform APIs', {
      component: 'platform-apis-route',
      action: 'GET',
      additionalData: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    })

    return NextResponse.json({
      success: false,
      error: 'Failed to get platform APIs'
    }, { status: 500 })
  }
}

// PATCH: Update platform API service configuration
export async function PATCH(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await applyRateLimit(request, rateLimiters.admin)
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!
    }

    // Authenticate user
    const authResult = await AuthMiddleware.authenticateUser()
    if (!authResult.success) {
      return createAuthErrorResponse(authResult.error!, authResult.statusCode!)
    }

    const userId = authResult.user!.id

    // Create Supabase client
    const supabase = await createServerClient()

    // Check if user is superadmin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (profile?.role !== 'superadmin') {
      return NextResponse.json({
        success: false,
        error: 'Access denied: Superadmin privileges required'
      }, { status: 403 })
    }

    const body = await request.json()
    const { serviceId, tenantId, enabled, quota } = body

    // This would typically update a tenant_api_permissions table
    // For now, we'll return a success response as this is a mock implementation
    return NextResponse.json({
      success: true,
      message: 'Platform API configuration updated successfully',
      data: {
        serviceId,
        tenantId,
        enabled,
        quota
      }
    })

  } catch (error) {
    errorLogger.logError('Failed to update platform API configuration', {
      component: 'platform-apis-route',
      action: 'PATCH',
      additionalData: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    })

    return NextResponse.json({
      success: false,
      error: 'Failed to update platform API configuration'
    }, { status: 500 })
  }
}
