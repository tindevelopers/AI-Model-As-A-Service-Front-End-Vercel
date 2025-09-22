import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase-server';
import { Metadata } from 'next';
import ServerSidebar from '@/components/sidebar/ServerSidebar';
import { 
  Building2, 
  Users, 
  Calendar, 
  MoreVertical,
  Plus,
  Eye,
  Edit,
  CheckCircle,
  XCircle
} from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Tenant Management | AI Model Service',
  description: 'Manage tenants in the AI Model Service platform',
};


export default async function TenantManagementPage() {
  const supabase = await createServerClient();
  
  // First try to get the session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  // Then get the user
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  // Debug logging
  console.log('Tenant Management Debug:', {
    hasSession: !!session,
    hasUser: !!user,
    sessionError: sessionError?.message,
    userError: userError?.message,
    userId: user?.id,
    userEmail: user?.email
  });

  if (!user) {
    console.log('No user found, redirecting to signin');
    redirect('/auth/signin');
  }

  // Check if user has admin privileges (superadmin or tenant_admin)
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('role, email, full_name')
    .eq('id', user.id)
    .single();

  console.log('Profile check:', {
    profile,
    profileError: profileError?.message,
    userRole: profile?.role
  });

  if (!profile || !['superadmin', 'tenant_admin'].includes(profile.role)) {
    console.log('User does not have required role, redirecting to dashboard');
    redirect('/dashboard');
  }

  // Fetch tenants data using server-side rendering
  const { data: tenants, error } = await supabase
    .from('tenants')
    .select(`
      id,
      name,
      slug,
      description,
      is_active,
      created_at,
      updated_at,
      tenant_users(count)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching tenants:', error);
  }

  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
  };

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />;
  };

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
                {profile.role === 'superadmin' && (
                  <Link
                    href="/tenant-management/create"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Tenant
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-6">
            {/* Actions Bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  All Tenants
                </h2>
                <span className="px-3 py-1 text-sm font-medium text-gray-600 bg-gray-100 rounded-full dark:text-gray-400 dark:bg-gray-700">
                  {tenants?.length || 0} tenants
                </span>
              </div>
            </div>

            {/* Tenants Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tenants?.map((tenant) => (
                <div key={tenant.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {tenant.name}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {tenant.slug}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(tenant.is_active)}`}>
                          {getStatusIcon(tenant.is_active)}
                          <span className="ml-1">{tenant.is_active ? 'Active' : 'Inactive'}</span>
                        </span>
                        
                        <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                          <MoreVertical className="h-4 w-4 text-gray-500" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600 dark:text-gray-400">Users</span>
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {tenant.tenant_users?.[0]?.count || 0}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600 dark:text-gray-400">Created</span>
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {new Date(tenant.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/tenant-management/${tenant.id}`}
                          className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Link>
                        <Link
                          href={`/tenant-management/${tenant.id}/edit`}
                          className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {(!tenants || tenants.length === 0) && (
              <div className="text-center py-12">
                <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No tenants found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Get started by creating your first tenant.
                </p>
                {profile.role === 'superadmin' && (
                  <Link
                    href="/tenant-management/create"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Tenant
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
