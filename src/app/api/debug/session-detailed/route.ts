import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { errorLogger } from '@/utils/errorLogger';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient(request);

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    let userProfile = null;
    if (user) {
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      userProfile = profileData;
      if (profileError) {
        errorLogger.logError('Error fetching user profile in debug session-detailed', {
          component: 'debug-session-detailed',
          action: 'GET',
          userId: user.id,
          additionalData: { error: profileError.message }
        });
      }
    }

    return NextResponse.json({
      success: true,
      session: session,
      sessionError: sessionError?.message,
      user: user,
      userError: userError?.message,
      userProfile: userProfile,
      cookies: request.headers.get('cookie'),
      authorizationHeader: request.headers.get('authorization'),
    });
  } catch (error) {
    errorLogger.logError('Debug session-detailed API error', {
      component: 'debug-session-detailed',
      action: 'GET',
      additionalData: { error: error instanceof Error ? error.message : 'Unknown error' }
    });
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
