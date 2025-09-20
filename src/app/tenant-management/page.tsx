import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase-server';
import { Metadata } from 'next';
import ServerSidebar from '@/components/sidebar/ServerSidebar';
import TenantManagementClient from './TenantManagementClient';

export const metadata: Metadata = {
  title: 'Tenant Management | AI Model Service',
  description: 'Manage tenants in the AI Model Service platform',
};

export default async function TenantManagementPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/signin');
  }

  // Check if user is super admin
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (profile?.role !== 'superadmin') {
    redirect('/dashboard');
  }

  // Fetch tenants data
  const { data: tenants, error } = await supabase
    .from('tenants')
    .select(`
      *,
      tenant_users(count)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching tenants:', error);
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ServerSidebar currentPath="/tenant-management" />
      
      {/* Main Content */}
      <div className="ml-64">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Tenant Management
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Manage all tenants in your multi-tenant system
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Total Tenants: {tenants?.length || 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <TenantManagementClient 
            initialTenants={tenants || []} 
            user={user}
          />
        </div>
      </div>
    </div>
  );
}
