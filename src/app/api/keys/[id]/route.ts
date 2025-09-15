import { createServerClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const keyId = resolvedParams.id;
    console.log('Deleting API key:', keyId);

    // In a real implementation, you would:
    // 1. Verify the API key belongs to the user
    // 2. Delete it from your database
    // 3. Invalidate any cached keys

    // For now, we'll just return success
    return NextResponse.json({ message: 'API key deleted successfully' });
  } catch (error) {
    console.error('Error deleting API key:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const keyId = resolvedParams.id;
    const body = await request.json();
    const { name, rate_limit, is_active } = body;
    console.log('Updating API key:', keyId, { name, rate_limit, is_active });

    // In a real implementation, you would:
    // 1. Verify the API key belongs to the user
    // 2. Update it in your database
    // 3. Update any cached keys

    // For now, we'll just return success
    return NextResponse.json({ message: 'API key updated successfully' });
  } catch (error) {
    console.error('Error updating API key:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
