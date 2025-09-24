import { NextRequest, NextResponse } from 'next/server';
import { AuthMiddleware, AuthResult } from '@/lib/auth-middleware';
import { createServerClient } from '@/lib/supabase-server';
import { errorLogger } from '@/utils/errorLogger';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient(request);
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    let profile = null;
    if (user) {
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('role, permissions')
        .eq('id', user.id)
        .single();
      profile = userProfile;
      if (profileError) {
        errorLogger.logError('Error fetching user profile in debug auth-flow', {
          component: 'debug-auth-flow',
          action: 'GET',
          userId: user.id,
          additionalData: { error: profileError.message }
        });
      }
    }

    const authResult: AuthResult = await AuthMiddleware.authenticateUser(request);

    return NextResponse.json({
      success: true,
      debugInfo: {
        session: session ? {
          expires_at: session.expires_at,
          user_id: session.user.id,
          user_email: session.user.email,
          token_type: session.token_type,
          access_token_prefix: session.access_token.substring(0, 12) + '...',
        } : null,
        sessionError: sessionError?.message,
        user: user ? {
          id: user.id,
          email: user.email,
          app_metadata_role: user.app_metadata.role,
          user_metadata_role: user.user_metadata.role,
        } : null,
        userError: userError?.message,
        userProfile: profile,
        authMiddlewareResult: authResult,
      }
    });
  } catch (error) {
    errorLogger.logError('Debug auth-flow API error', {
      component: 'debug-auth-flow',
      action: 'GET',
      additionalData: { error: error instanceof Error ? error.message : 'Unknown error' }
    });
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
