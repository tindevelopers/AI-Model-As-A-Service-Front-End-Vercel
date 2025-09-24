import { createServerClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import ServerSidebar from '@/components/sidebar/ServerSidebar';
import UserManagementClient from './UserManagementClient';

export const metadata: Metadata = {
  title: 'User Management | AI Model Service',
  description: 'Manage users in the AI Model Service platform',
};

export default async function UserManagementPage() {
  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/auth/signin');
  }

  // Fetch user profile to check role
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || profile?.role !== 'superadmin') {
    console.error('Unauthorized access to user management:', profileError?.message);
    redirect('/dashboard?error=unauthorized');
  }

  // Fetch all users using the new function
  const { data: users, error: fetchError } = await supabase
    .rpc('get_all_users_with_roles');

  if (fetchError) {
    console.error('Error fetching users:', fetchError.message);
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
        <ServerSidebar currentPath="/admin/users" />
        <div className="flex-1 ml-64 p-8">
          <div className="max-w-2xl mx-auto text-center py-16">
            <h1 className="text-4xl font-bold text-red-600 dark:text-red-400 mb-4">Error</h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Error loading users: {fetchError.message}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      <ServerSidebar currentPath="/admin/users" />
      <div className="flex-1 ml-64 p-8">
        <UserManagementClient initialUsers={users || []} currentUser={user} />
      </div>
    </div>
  );
}
