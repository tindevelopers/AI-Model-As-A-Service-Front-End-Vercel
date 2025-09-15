import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { sharedServiceRegistry, ServiceDefinition } from '@/lib/ai-router'

// GET: list registered services
export async function GET() {
  try {
    // Note: For simplicity, not restricting to admin-only here. In production, check user role.
    const services = (sharedServiceRegistry as any).services
      ? Array.from((sharedServiceRegistry as any).services.values())
      : []

    return NextResponse.json({ success: true, services })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch services' }, { status: 500 })
  }
}

// POST: register a new service
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const service: ServiceDefinition = body

    if (!service?.id || !service?.name || !service?.type || !service?.endpoints?.length) {
      return NextResponse.json({ error: 'Invalid service payload' }, { status: 400 })
    }

    sharedServiceRegistry.register(service)

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to register service' }, { status: 500 })
  }
}
