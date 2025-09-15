import { createServerClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { aiRouter, UnifiedRequest } from '@/lib/ai-router'

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    
    // Validate request
    if (!body.prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    // Create unified request
    const unifiedRequest: UnifiedRequest = {
      prompt: body.prompt,
      context: {
        userId: user.id,
        projectId: body.projectId,
        sessionId: body.sessionId,
        brandVoice: body.brandVoice,
        targetAudience: body.targetAudience
      },
      serviceType: body.serviceType,
      preferences: {
        costPreference: body.costPreference || 'balanced',
        qualityPreference: body.qualityPreference || 'balanced',
        language: body.language,
        style: body.style,
        preferredServices: body.preferredServices
      },
      constraints: {
        maxCost: body.maxCost,
        maxTokens: body.maxTokens,
        maxResponseTime: body.maxResponseTime,
        requiredFeatures: body.requiredFeatures,
        excludedServices: body.excludedServices
      },
      options: {
        stream: body.stream || false,
        format: body.format || 'text',
        temperature: body.temperature,
        maxTokens: body.maxTokens,
        model: body.model
      }
    }

    // Route request through AI router
    const response = await aiRouter.routeRequest(unifiedRequest)

    // Return response
    return NextResponse.json(response)

  } catch (error) {
    console.error('AI process error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}
