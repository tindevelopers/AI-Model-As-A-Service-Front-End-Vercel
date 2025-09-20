import { createServerClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import ServerSidebar from '@/components/sidebar/ServerSidebar';

export const metadata: Metadata = {
  title: 'Settings | AI Model Service',
  description: 'Manage your account settings',
};

export default async function SettingsPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/signin');
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ServerSidebar currentPath="/settings" />
      
      {/* Main Content */}
      <div className="ml-64">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Settings
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Manage your account settings and preferences
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Profile Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Profile
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Manage your personal information and account details.
              </p>
              <a
                href="/settings/profile"
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
              >
                Manage Profile
              </a>
            </div>

            {/* Security Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Security
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Update your password and security settings.
              </p>
              <button
                className="inline-flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-md transition-colors"
                disabled
              >
                Coming Soon
              </button>
            </div>

            {/* API Keys */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                API Keys
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Manage your API keys and access tokens.
              </p>
              <a
                href="/admin/api-keys"
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
              >
                Manage API Keys
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
