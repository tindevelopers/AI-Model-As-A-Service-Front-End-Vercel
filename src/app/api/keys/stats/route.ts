import { createServerClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

interface UsageStats {
  total_requests: number;
  requests_today: number;
  requests_this_month: number;
  active_keys: number;
  total_keys: number;
}

export async function GET() {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // In a real implementation, you would fetch from your analytics database
    // For now, we'll return mock data
    const mockStats: UsageStats = {
      total_requests: 125430,
      requests_today: 1240,
      requests_this_month: 45670,
      active_keys: 2,
      total_keys: 3
    };

    return NextResponse.json(mockStats);
  } catch (error) {
    console.error('Error fetching usage stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
