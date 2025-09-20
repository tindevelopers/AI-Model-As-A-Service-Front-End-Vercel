import { createServerClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import ServerSidebar from '@/components/sidebar/ServerSidebar';
import SuperAdminApiKeysClient from './SuperAdminApiKeysClient';

export const metadata: Metadata = {
  title: 'API Keys Management | AI Model Service',
  description: 'Super Admin API Keys Management - Platform-wide oversight and tenant management',
};

export default async function SuperAdminApiKeysPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/signin');
  }

  // Check if user is super admin
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'superadmin') {
    redirect('/dashboard');
  }

  // Fetch all API keys across all tenants
  const { data: allApiKeys, error: apiKeysError } = await supabase
    .from('tenant_api_keys')
    .select(`
      *,
      tenants!inner(name, slug, is_active),
      user_profiles!tenant_api_keys_created_by_fkey(email, full_name)
    `)
    .order('created_at', { ascending: false });

  // Fetch all tenants for the tenant selector
  const { data: allTenants, error: tenantsError } = await supabase
    .from('tenants')
    .select('id, name, slug, is_active')
    .order('name');

  // Fetch platform API services (this would come from your API management system)
  const platformApis = [
    { id: 'blog-writer', name: 'Blog Writer API', description: 'AI-powered blog content generation', status: 'active' },
    { id: 'listing-optimization', name: 'Listing Optimization API', description: 'Real estate listing optimization', status: 'active' },
    { id: 'outreach-automation', name: 'Outreach Automation API', description: 'Automated outreach campaigns', status: 'active' },
    { id: 'custom-llm', name: 'Custom LLM API', description: 'Custom language model access', status: 'active' },
    { id: 'analytics', name: 'Analytics API', description: 'Usage and performance analytics', status: 'active' }
  ];

  if (apiKeysError) {
    console.error('Error fetching API keys:', apiKeysError);
  }

  if (tenantsError) {
    console.error('Error fetching tenants:', tenantsError);
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ServerSidebar currentPath="/admin/api-keys" />
      
      {/* Main Content */}
      <div className="ml-64">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  API Keys Management
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Platform-wide API oversight and tenant access management
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Total API Keys: {allApiKeys?.length || 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <SuperAdminApiKeysClient 
            initialApiKeys={allApiKeys || []}
            initialTenants={allTenants || []}
            platformApis={platformApis}
          />
        </div>
      </div>
    </div>
  );
}
