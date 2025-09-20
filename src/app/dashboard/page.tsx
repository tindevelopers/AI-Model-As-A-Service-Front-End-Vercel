import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase-server';
import { Metadata } from 'next';
import TenantManagerCard from '@/components/dashboard/TenantManagerCard';
import ActiveActionsCard from '@/components/dashboard/ActiveActionsCard';
import QuickStatsCard from '@/components/dashboard/QuickStatsCard';
import SettingsCard from '@/components/dashboard/SettingsCard';

export const metadata: Metadata = {
  title: 'Super Admin Dashboard | AI Model Service',
  description: 'AI Model Service Super Admin Dashboard',
};

export default async function Dashboard() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/signin');
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Super Admin Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                AI Management System - Multi-tenant platform overview
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Welcome back, {user.email}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Tenant Manager - Full Width */}
          <TenantManagerCard />
          
          {/* Active Actions - 2 columns */}
          <ActiveActionsCard />
          
          {/* Quick Stats - 2 columns */}
          <QuickStatsCard />
          
          {/* Settings - 1 column */}
          <SettingsCard user={user} isAuthenticated={true} />
        </div>
      </div>
    </div>
  );
}
