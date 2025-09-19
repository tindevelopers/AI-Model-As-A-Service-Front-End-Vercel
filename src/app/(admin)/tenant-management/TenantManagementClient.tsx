'use client'

import { useState } from 'react'
import Button from '@/components/ui/button/Button'
import { Plus } from 'lucide-react'

interface CreateTenantForm {
  name: string
  slug: string
  description: string
  owner_user_id?: string
}

export default function TenantManagementClient() {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [formData, setFormData] = useState<CreateTenantForm>({
    name: '',
    slug: '',
    description: ''
  })

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

  // Create tenant using server action
  const createTenant = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setCreating(true)
    try {
      const response = await fetch('/api/admin/tenants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (result.success) {
        setShowCreateForm(false)
        setFormData({ name: '', slug: '', description: '' })
        // Refresh the page to show the new tenant
        window.location.reload()
      } else {
        alert('Failed to create tenant: ' + result.error)
      }
    } catch {
      alert('Failed to create tenant. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <>
      <Button
        onClick={() => setShowCreateForm(true)}
        startIcon={<Plus className="h-4 w-4" />}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
      >
        Create Tenant
      </Button>

      {/* Create Tenant Form */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Create New Tenant
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Create a new tenant organization with its own users and settings
                </p>
              </div>
              <form onSubmit={createTenant} className="space-y-4">
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
                <div className="flex space-x-3 pt-4">
                  <Button
                    type="submit"
                    disabled={creating}
                    startIcon={<Plus className="h-4 w-4" />}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2"
                  >
                    {creating ? 'Creating...' : 'Create Tenant'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
