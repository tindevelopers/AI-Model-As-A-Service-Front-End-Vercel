import { createServerClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  masked_key: string;
  user_id: string;
  created_at: string;
  last_used: string | null;
  is_active: boolean;
  rate_limit: number;
  usage_count: number;
  expires_at: string | null;
}

// Generate a secure API key
function generateApiKey(): string {
  const prefix = 'ai_';
  const randomPart = randomBytes(32).toString('hex');
  return `${prefix}${randomPart}`;
}

// Create masked version of API key for display
function maskApiKey(key: string): string {
  const prefix = key.substring(0, 8);
  const suffix = key.substring(key.length - 4);
  const masked = '*'.repeat(key.length - 12);
  return `${prefix}${masked}${suffix}`;
}

export async function GET() {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // In a real implementation, you would fetch from your database
    // For now, we'll return mock data
    const mockApiKeys: ApiKey[] = [
      {
        id: '1',
        name: 'Production App',
        key: 'ai_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        masked_key: 'ai_1234******************************cdef',
        user_id: user.id,
        created_at: new Date().toISOString(),
        last_used: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        is_active: true,
        rate_limit: 1000,
        usage_count: 15420,
        expires_at: null
      },
      {
        id: '2',
        name: 'Development',
        key: 'ai_abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        masked_key: 'ai_abcd******************************7890',
        user_id: user.id,
        created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        last_used: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        is_active: true,
        rate_limit: 100,
        usage_count: 2340,
        expires_at: null
      }
    ];

    return NextResponse.json(mockApiKeys);
  } catch (error) {
    console.error('Error fetching API keys:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, rate_limit } = body;

    if (!name || !rate_limit) {
      return NextResponse.json({ error: 'Name and rate limit are required' }, { status: 400 });
    }

    // Generate new API key
    const apiKey = generateApiKey();
    const maskedKey = maskApiKey(apiKey);

    const newApiKey: ApiKey = {
      id: Date.now().toString(),
      name,
      key: apiKey,
      masked_key: maskedKey,
      user_id: user.id,
      created_at: new Date().toISOString(),
      last_used: null,
      is_active: true,
      rate_limit: parseInt(rate_limit),
      usage_count: 0,
      expires_at: null
    };

    // In a real implementation, you would save to your database
    // For now, we'll just return the new key

    return NextResponse.json(newApiKey, { status: 201 });
  } catch (error) {
    console.error('Error creating API key:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
