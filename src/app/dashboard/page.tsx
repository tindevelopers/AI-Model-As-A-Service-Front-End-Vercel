import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase-server';
import { Metadata } from 'next';
import ServerSidebar from '@/components/sidebar/ServerSidebar';
import DashboardHeader from '@/components/header/DashboardHeader';
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

  // Fetch real tenant statistics from database
  const [tenantsResult, usersResult] = await Promise.all([
    supabase.from('tenants').select('*'),
    supabase.rpc('get_all_users_with_roles')
  ]);

  const tenants = tenantsResult.data || [];
  const users = usersResult.data || [];

  // Calculate real statistics
  const totalTenants = tenants.length;
  const activeTenants = tenants.filter(t => t.status === 'active').length;
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const newTenantsThisMonth = tenants.filter(t => {
    const createdDate = new Date(t.created_at);
    return createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear;
  }).length;
  const totalUsers = users.length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ServerSidebar currentPath="/dashboard" />
      
      {/* Main Content */}
      <div className="ml-64">
        {/* Header */}
        <DashboardHeader user={user} />
        
        {/* Dashboard Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="px-6 py-6">
            <div className="flex justify-between items-center">
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

        {/* Dashboard Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Tenant Manager - Full Width */}
            <TenantManagerCard 
              totalTenants={totalTenants}
              activeTenants={activeTenants}
              newTenantsThisMonth={newTenantsThisMonth}
              totalUsers={totalUsers}
            />
            
            {/* Active Actions - 2 columns */}
            <ActiveActionsCard />
            
            {/* Quick Stats - 2 columns */}
            <QuickStatsCard />
            
            {/* Settings - 1 column */}
            <SettingsCard user={user} isAuthenticated={true} />
          </div>
        </div>
      </div>
    </div>
  );
}
