import { createServerClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { aiRouter, UnifiedRequest } from '@/lib/ai-router'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    if (!body.prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

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

    const response = await aiRouter.routeRequest(unifiedRequest)
    return NextResponse.json(response)

  } catch (error) {
    console.error('AI v1 process error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}
