import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerClient } from '@/lib/supabase-server'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
import { Card, CardTitle, CardDescription } from '@/components/ui/card/Card'
import Button from '@/components/ui/button/Button'
import Badge from '@/components/ui/badge/Badge'
import { Building2, Users, Eye, Edit, Trash2 } from 'lucide-react'
import TenantManagementClient from './TenantManagementClient'

interface Tenant {
  id: string
  name: string
  slug: string
  description: string
  subscription_plan: string
  subscription_status: string
  max_users: number
  max_api_calls_per_month: number
  is_active: boolean
  created_at: string
  owner_email: string
  member_count: number
}


// Server-side data fetching function
async function getTenants(): Promise<Tenant[]> {
  try {
    const supabase = await createServerClient()
    
    // Check if user is authenticated and has admin role
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      redirect('/signin')
    }

    // Check user role
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (profileError || !userProfile || !['admin', 'superadmin'].includes(userProfile.role)) {
      redirect('/unauthorized')
    }

    // Call the get_all_tenants function
    const { data, error } = await supabase.rpc('get_all_tenants')

    if (error) {
      console.error('Failed to fetch tenants:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching tenants:', error)
    return []
  }
}

export default async function TenantManagement() {
  // Fetch tenants on the server
  const tenants = await getTenants()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success'
      case 'trial': return 'warning'
      case 'suspended': return 'error'
      case 'cancelled': return 'error'
      default: return 'light'
    }
  }

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'enterprise': return 'success'
      case 'pro': return 'primary'
      case 'basic': return 'warning'
      case 'free': return 'light'
      default: return 'light'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Tenant Management
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Create and manage tenants for your AI Model as a Service platform
          </p>
        </div>
        <TenantManagementClient />
      </div>

      {/* Tenants List */}
      <Card>
        <CardTitle>All Tenants</CardTitle>
        <CardDescription>
          Manage existing tenants and their configurations
        </CardDescription>
        
        {tenants.length === 0 ? (
          <div className="text-center py-8">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No tenants found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Get started by creating your first tenant
            </p>
            <TenantManagementClient />
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Tenant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Members
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Owner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {tenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {tenant.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {tenant.slug}
                        </div>
                        {tenant.description && (
                          <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {tenant.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="solid" color={getPlanColor(tenant.subscription_plan)}>
                        {tenant.subscription_plan}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="solid" color={getStatusColor(tenant.subscription_status)}>
                        {tenant.subscription_status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {tenant.member_count} / {tenant.max_users}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {tenant.owner_email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(tenant.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Link href={`/tenant/dashboard?tenant=${tenant.slug}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            startIcon={<Eye className="h-4 w-4" />}
                          >
                            View
                          </Button>
                        </Link>
                        <Link href={`/admin/tenant/edit/${tenant.slug}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            startIcon={<Edit className="h-4 w-4" />}
                          >
                            Edit
                          </Button>
                        </Link>
                        <Link href={`/admin/tenant/delete/${tenant.slug}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            startIcon={<Trash2 className="h-4 w-4" />}
                          >
                            Delete
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
