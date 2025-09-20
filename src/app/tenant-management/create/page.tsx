import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase-server';
import { Metadata } from 'next';
import ServerSidebar from '@/components/sidebar/ServerSidebar';
import CreateTenantForm from './CreateTenantForm';

export const metadata: Metadata = {
  title: 'Create Tenant | AI Model Service',
  description: 'Create a new tenant in the AI Model Service platform',
};

export default async function CreateTenantPage() {
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ServerSidebar currentPath="/tenant-management/create" />
      
      {/* Main Content */}
      <div className="ml-64">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Create New Tenant
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Set up a new tenant in your multi-tenant system
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <CreateTenantForm user={user} />
        </div>
      </div>
    </div>
  );
}
