'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { Card, CardTitle, CardDescription } from '@/components/ui/card/Card'
import Button from '@/components/ui/button/Button'
import Badge from '@/components/ui/badge/Badge'
import { Plus, Building2, Users, Eye, Edit, Trash2 } from 'lucide-react'
import { errorLogger } from '@/utils/errorLogger'

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

interface CreateTenantForm {
  name: string
  slug: string
  description: string
  owner_user_id?: string
}

export default function TenantManagement() {
  const { session } = useAuth()
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [formData, setFormData] = useState<CreateTenantForm>({
    name: '',
    slug: '',
    description: ''
  })

  // Load tenants
  const loadTenants = useCallback(async () => {
    if (!session) return

    setLoading(true)
    try {
      const response = await fetch('/api/admin/tenants', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      const result = await response.json()

      if (result.success) {
        setTenants(result.data || [])
      } else {
        errorLogger.logError('Failed to load tenants', {
          component: 'tenant-management',
          action: 'loadTenants',
          additionalData: { error: result.error }
        })
      }
    } catch (error) {
      errorLogger.logError('Failed to load tenants', {
        component: 'tenant-management',
        action: 'loadTenants',
        additionalData: { error: error instanceof Error ? error.message : 'Unknown error' }
      })
    } finally {
      setLoading(false)
    }
  }, [session])

  // Create tenant
  const createTenant = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session) return

    setCreating(true)
    try {
      const response = await fetch('/api/admin/tenants', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (result.success) {
        setShowCreateForm(false)
        setFormData({ name: '', slug: '', description: '' })
        await loadTenants() // Reload the list
      } else {
        errorLogger.logError('Failed to create tenant', {
          component: 'tenant-management',
          action: 'createTenant',
          additionalData: { error: result.error, formData }
        })
        alert('Failed to create tenant: ' + result.error)
      }
    } catch (error) {
      errorLogger.logError('Failed to create tenant', {
        component: 'tenant-management',
        action: 'createTenant',
        additionalData: { error: error instanceof Error ? error.message : 'Unknown error' }
      })
      alert('Failed to create tenant')
    } finally {
      setCreating(false)
    }
  }

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: generateSlug(name)
    }))
  }

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

  useEffect(() => {
    if (session) {
      loadTenants()
    }
  }, [session, loadTenants])

  return (
    <ProtectedRoute>
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
          <Button
            onClick={() => setShowCreateForm(true)}
            startIcon={<Plus className="h-4 w-4" />}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Create Tenant
          </Button>
        </div>

        {/* Create Tenant Form */}
        {showCreateForm && (
          <Card>
            <CardTitle>Create New Tenant</CardTitle>
            <CardDescription>
              Create a new tenant organization with its own users and settings
            </CardDescription>
            <form onSubmit={createTenant} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tenant Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., Acme Corporation"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Slug (URL-friendly identifier)
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., acme-corporation"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="Brief description of the tenant"
                  rows={3}
                />
              </div>
              <div className="flex space-x-3">
                <Button
                  type="submit"
                  disabled={creating}
                  startIcon={<Plus className="h-4 w-4" />}
                >
                  {creating ? 'Creating...' : 'Create Tenant'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Tenants List */}
        <Card>
          <CardTitle>All Tenants</CardTitle>
          <CardDescription>
            Manage existing tenants and their configurations
          </CardDescription>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : tenants.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No tenants found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Get started by creating your first tenant
              </p>
              <div className="space-y-2">
                <Button
                  onClick={() => setShowCreateForm(true)}
                  startIcon={<Plus className="h-4 w-4" />}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                >
                  Create First Tenant
                </Button>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="block mx-auto bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm"
                >
                  Alternative Create Button
                </button>
              </div>
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
                          <Button
                            variant="outline"
                            size="sm"
                            startIcon={<Eye className="h-4 w-4" />}
                            onClick={() => window.open(`/tenant/dashboard?tenant=${tenant.slug}`, '_blank')}
                          >
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            startIcon={<Edit className="h-4 w-4" />}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            startIcon={<Trash2 className="h-4 w-4" />}
                          >
                            Delete
                          </Button>
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
    </ProtectedRoute>
  )
}
