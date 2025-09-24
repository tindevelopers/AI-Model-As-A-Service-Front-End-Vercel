import { NextRequest, NextResponse } from 'next/server';
import { AuthMiddleware, createAuthErrorResponse } from '@/lib/auth-middleware';
import { createServerClient } from '@/lib/supabase-server';
import { errorLogger } from '@/utils/errorLogger';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user and check superadmin role
    const authResult = await AuthMiddleware.requireSuperAdmin(request);
    if (!authResult.success) {
      errorLogger.logError('Debug tenant creation failed: Superadmin access required', {
        component: 'debug-tenant-creation',
        action: 'POST',
        additionalData: { error: authResult.error, statusCode: authResult.statusCode }
      });
      return createAuthErrorResponse(authResult.error!, authResult.statusCode!);
    }

    const userId = authResult.user!.id;

    const { name, slug, description, owner_user_id } = await request.json();

    if (!name) {
      return NextResponse.json({ success: false, error: 'name is required' }, { status: 400 });
    }

    const generatedSlug = slug || name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const supabase = await createServerClient(request);

    const { data, error } = await supabase.rpc('create_tenant', {
      tenant_name: name,
      tenant_slug: generatedSlug,
      tenant_description: description || null,
      owner_user_id: owner_user_id || null
    });

    if (error) {
      errorLogger.logError('Debug tenant creation failed', {
        component: 'debug-tenant-creation',
        action: 'POST',
        userId,
        additionalData: { error: error.message, errorCode: error.code, tenantName: name, tenantSlug: generatedSlug }
      });
      return NextResponse.json({ success: false, error: 'Failed to create tenant', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: { tenant_id: data } }, { status: 201 });

  } catch (error) {
    errorLogger.logError('Debug tenant creation API error', {
      component: 'debug-tenant-creation',
      action: 'POST',
      additionalData: { error: error instanceof Error ? error.message : 'Unknown error' }
    });
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}