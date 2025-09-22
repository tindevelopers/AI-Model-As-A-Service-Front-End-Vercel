import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase-server';
import { Metadata } from 'next';
import ServerSidebar from '@/components/sidebar/ServerSidebar';

export const metadata: Metadata = {
  title: 'Tenant Management Debug | AI Model Service',
  description: 'Debug tenant management authentication issues',
};

export default async function TenantManagementDebugPage() {
  const supabase = await createServerClient();
  
  // Get session first
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  // Get user
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  // Debug information
  const debugInfo = {
    hasSession: !!session,
    hasUser: !!user,
    sessionError: sessionError?.message,
    userError: userError?.message,
    userId: user?.id,
    userEmail: user?.email,
    sessionExpiry: session?.expires_at,
    sessionAccessToken: session?.access_token ? 'Present' : 'Missing',
    sessionRefreshToken: session?.refresh_token ? 'Present' : 'Missing',
  };

  // Try to get user profile
  let profile = null;
  let profileError = null;
  if (user) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    profile = data;
    profileError = error?.message;
  }

  // Try to get all user profiles to see what's in the database
  const { data: allProfiles, error: allProfilesError } = await supabase
    .from('user_profiles')
    .select('*')
    .limit(10);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ServerSidebar currentPath="/tenant-management/debug" />
      
      <div className="ml-64 p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Tenant Management Debug
          </h1>
          
          <div className="space-y-6">
            {/* Authentication Debug */}
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Authentication Debug
              </h2>
              <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>

            {/* User Profile Debug */}
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                User Profile Debug
              </h2>
              <div className="space-y-2">
                <p><strong>Profile Found:</strong> {profile ? 'Yes' : 'No'}</p>
                <p><strong>Profile Error:</strong> {profileError || 'None'}</p>
                {profile && (
                  <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {JSON.stringify(profile, null, 2)}
                  </pre>
                )}
              </div>
            </div>

            {/* All Profiles Debug */}
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                All User Profiles in Database
              </h2>
              <p><strong>Error:</strong> {allProfilesError?.message || 'None'}</p>
              <p><strong>Count:</strong> {allProfiles?.length || 0}</p>
              {allProfiles && (
                <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {JSON.stringify(allProfiles, null, 2)}
                </pre>
              )}
            </div>

            {/* Role Check Debug */}
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Role Check Debug
              </h2>
              <div className="space-y-2">
                <p><strong>User Role:</strong> {profile?.role || 'Not found'}</p>
                <p><strong>Has Superadmin Role:</strong> {profile?.role === 'superadmin' ? 'Yes' : 'No'}</p>
                <p><strong>Has Tenant Admin Role:</strong> {profile?.role === 'tenant_admin' ? 'Yes' : 'No'}</p>
                <p><strong>Can Access Tenant Management:</strong> {profile && ['superadmin', 'tenant_admin'].includes(profile.role) ? 'Yes' : 'No'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
