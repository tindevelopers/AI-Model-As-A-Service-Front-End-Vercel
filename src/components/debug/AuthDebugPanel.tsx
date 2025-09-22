'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { User, Session } from '@supabase/supabase-js';

interface AuthDebugInfo {
  hasSession: boolean;
  hasUser: boolean;
  user: User | null;
  session: Session | null;
  userProfile: any;
  profileError: string | null;
  tenantRoles: any[];
  rolesError: string | null;
}

export default function AuthDebugPanel() {
  const [debugInfo, setDebugInfo] = useState<AuthDebugInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    const fetchDebugInfo = async () => {
      try {
        // Get session and user
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        let userProfile = null;
        let profileError = null;
        let tenantRoles = [];
        let rolesError = null;

        if (user) {
          // Get user profile
          const { data: profile, error: profileErr } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          
          userProfile = profile;
          profileError = profileErr?.message || null;

          // Get tenant roles
          try {
            const response = await fetch('/api/tenant/roles');
            if (response.ok) {
              const data = await response.json();
              tenantRoles = data.data || [];
            } else {
              rolesError = `HTTP ${response.status}: ${response.statusText}`;
            }
          } catch (err) {
            rolesError = err instanceof Error ? err.message : 'Unknown error';
          }
        }

        setDebugInfo({
          hasSession: !!session,
          hasUser: !!user,
          user,
          session,
          userProfile,
          profileError,
          tenantRoles,
          rolesError
        });
      } catch (error) {
        console.error('Error fetching debug info:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDebugInfo();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session);
      fetchDebugInfo();
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
        Loading debug info...
      </div>
    );
  }

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg z-50"
      >
        {isVisible ? 'Hide' : 'Show'} Auth Debug
      </button>

      {/* Debug Panel */}
      {isVisible && debugInfo && (
        <div className="fixed bottom-20 right-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 max-w-md max-h-96 overflow-auto z-50">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Auth Debug Info
          </h3>
          
          <div className="space-y-3 text-sm">
            <div>
              <strong>Session:</strong> {debugInfo.hasSession ? '✅' : '❌'}
            </div>
            <div>
              <strong>User:</strong> {debugInfo.hasUser ? '✅' : '❌'}
            </div>
            
            {debugInfo.user && (
              <div>
                <strong>User ID:</strong> {debugInfo.user.id}
              </div>
            )}
            
            {debugInfo.user && (
              <div>
                <strong>Email:</strong> {debugInfo.user.email}
              </div>
            )}

            <div>
              <strong>Profile:</strong> {debugInfo.userProfile ? '✅' : '❌'}
            </div>
            
            {debugInfo.userProfile && (
              <div>
                <strong>Role:</strong> {debugInfo.userProfile.role}
              </div>
            )}

            {debugInfo.profileError && (
              <div className="text-red-600">
                <strong>Profile Error:</strong> {debugInfo.profileError}
              </div>
            )}

            <div>
              <strong>Tenant Roles:</strong> {debugInfo.tenantRoles.length > 0 ? '✅' : '❌'}
            </div>

            {debugInfo.rolesError && (
              <div className="text-red-600">
                <strong>Roles Error:</strong> {debugInfo.rolesError}
              </div>
            )}

            {debugInfo.tenantRoles.length > 0 && (
              <div>
                <strong>Roles Count:</strong> {debugInfo.tenantRoles.length}
              </div>
            )}

            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <strong>Can Access Tenant Management:</strong>{' '}
              {debugInfo.userProfile && ['superadmin', 'tenant_admin'].includes(debugInfo.userProfile.role) ? '✅' : '❌'}
            </div>
          </div>

          <div className="mt-4 pt-2 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => {
                console.log('Full debug info:', debugInfo);
                alert('Debug info logged to console');
              }}
              className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded"
            >
              Log to Console
            </button>
          </div>
        </div>
      )}
    </>
  );
}
