'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTenant } from '@/context/TenantContext'
import { Card, CardTitle, CardDescription } from '@/components/ui/card/Card'
import Button from '@/components/ui/button/Button'
import Badge from '@/components/ui/badge/Badge'
import { 
  Plus, 
  Key, 
  Copy, 
  Eye, 
  EyeOff, 
  Trash2, 
  Edit, 
  Settings,
  RefreshCw,
  ExternalLink,
  Shield,
  Zap
} from 'lucide-react'
import { errorLogger } from '@/utils/errorLogger'

interface TenantApiKey {
  id: string
  name: string
  api_key: string
  key_prefix: string
  is_active: boolean
  expires_at: string | null
  created_at: string
  last_used: string | null
  usage_count: number
  description?: string
}

interface CreateApiKeyForm {
  name: string
  description: string
  expires_at: string
}

interface ProvisioningKey {
  id: string
  name: string
  provider: string
  provider_type: string
  endpoint: string
  is_active: boolean
  usage_count: number
  created_at: string
  last_used: string | null
  config: Record<string, unknown>
}

interface UsageAnalytics {
  total_requests: number
  successful_requests: number
  failed_requests: number
  avg_response_time_ms: number
  total_request_size_bytes: number
  total_response_size_bytes: number
  unique_users: number
  top_endpoints: Array<{ endpoint: string; count: number }>
  hourly_usage: Array<{ hour: string; count: number }>
}

interface CreateProvisioningKeyForm {
  name: string
  provider: string
  provider_type: string
  endpoint: string
  config: Record<string, unknown>
}

export default function TenantApiKeys() {
  const { currentTenant } = useTenant()
  const [apiKeys, setApiKeys] = useState<TenantApiKey[]>([])
  const [provisioningKeys, setProvisioningKeys] = useState<ProvisioningKey[]>([])
  const [usageAnalytics, setUsageAnalytics] = useState<UsageAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showProvisioningForm, setShowProvisioningForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [creatingProvisioning, setCreatingProvisioning] = useState(false)
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState<'api-keys' | 'provisioning' | 'analytics'>('api-keys')
  
  const [formData, setFormData] = useState<CreateApiKeyForm>({
    name: '',
    description: '',
    expires_at: ''
  })

  const [provisioningFormData, setProvisioningFormData] = useState<CreateProvisioningKeyForm>({
    name: '',
    provider: '',
    provider_type: '',
    endpoint: '',
    config: {}
  })

  // Load API keys
  const loadApiKeys = useCallback(async () => {
    if (!currentTenant) return

    setLoading(true)
    try {
      const response = await fetch(`/api/tenant/api-keys?tenantId=${currentTenant.id}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const result = await response.json()

      if (result.success && result.data) {
        // Convert API response to our interface format
        const apiKeysData: TenantApiKey[] = result.data.map((key: Record<string, unknown>) => ({
          id: key.id,
          name: key.name,
          api_key: key.api_key,
          key_prefix: key.key_prefix,
          is_active: key.is_active,
          expires_at: key.expires_at,
          created_at: key.created_at,
          last_used: key.last_used || null,
          usage_count: key.usage_count || 0,
          description: key.description
        }))
        
        setApiKeys(apiKeysData)
      } else {
        errorLogger.logError('Failed to load API keys', {
          component: 'tenant-api-keys',
          action: 'loadApiKeys',
          additionalData: { 
            error: result.error,
            tenantId: currentTenant.id
          }
        })
      }

      // Mock provisioning keys for now (will be implemented later)
      const mockProvisioningKeys: ProvisioningKey[] = [
        {
          id: '1',
          name: 'OpenAI Integration',
          provider: 'OpenAI',
          endpoint: 'https://api.openai.com/v1',
          is_active: true,
          created_at: '2024-01-12T10:00:00Z',
          last_used: '2024-01-20T16:45:00Z'
        },
        {
          id: '2',
          name: 'Anthropic Claude',
          provider: 'Anthropic',
          endpoint: 'https://api.anthropic.com',
          is_active: true,
          created_at: '2024-01-14T15:30:00Z',
          last_used: '2024-01-19T12:30:00Z'
        }
      ]
      
      setProvisioningKeys(mockProvisioningKeys)
      
    } catch (error) {
      errorLogger.logError('Failed to load API keys', {
        component: 'tenant-api-keys',
        action: 'loadApiKeys',
        additionalData: { 
          error: error instanceof Error ? error.message : 'Unknown error',
          tenantId: currentTenant.id
        }
      })
    } finally {
      setLoading(false)
    }
  }, [currentTenant])

  // Load provisioning keys
  const loadProvisioningKeys = useCallback(async () => {
    if (!currentTenant) return

    try {
      const response = await fetch(`/api/tenant/provisioning-keys?tenantId=${currentTenant.id}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const result = await response.json()

      if (result.success && result.data) {
        setProvisioningKeys(result.data)
      } else {
        errorLogger.logError('Failed to load provisioning keys', {
          component: 'tenant-api-keys',
          action: 'loadProvisioningKeys',
          additionalData: { 
            error: result.error,
            tenantId: currentTenant.id
          }
        })
      }
    } catch (error) {
      errorLogger.logError('Failed to load provisioning keys', {
        component: 'tenant-api-keys',
        action: 'loadProvisioningKeys',
        additionalData: { 
          error: error instanceof Error ? error.message : 'Unknown error',
          tenantId: currentTenant.id
        }
      })
    }
  }, [currentTenant])

  // Load usage analytics
  const loadUsageAnalytics = useCallback(async () => {
    if (!currentTenant) return

    try {
      const response = await fetch(`/api/tenant/usage-analytics?tenantId=${currentTenant.id}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const result = await response.json()

      if (result.success && result.data) {
        setUsageAnalytics(result.data)
      } else {
        errorLogger.logError('Failed to load usage analytics', {
          component: 'tenant-api-keys',
          action: 'loadUsageAnalytics',
          additionalData: { 
            error: result.error,
            tenantId: currentTenant.id
          }
        })
      }
    } catch (error) {
      errorLogger.logError('Failed to load usage analytics', {
        component: 'tenant-api-keys',
        action: 'loadUsageAnalytics',
        additionalData: { 
          error: error instanceof Error ? error.message : 'Unknown error',
          tenantId: currentTenant.id
        }
      })
    }
  }, [currentTenant])

  // Create API key
  const createApiKey = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentTenant) return

    setCreating(true)
    try {
      const response = await fetch('/api/tenant/api-keys', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tenantId: currentTenant.id,
          name: formData.name,
          description: formData.description,
          expires_at: formData.expires_at || null
        })
      })

      const result = await response.json()

      if (result.success && result.data) {
        // Convert API response to our interface format
        const newKey: TenantApiKey = {
          id: result.data.id,
          name: result.data.name,
          api_key: result.data.api_key,
          key_prefix: result.data.key_prefix,
          is_active: result.data.is_active,
          expires_at: result.data.expires_at,
          created_at: result.data.created_at,
          last_used: null,
          usage_count: 0,
          description: result.data.description
        }

        setApiKeys(prev => [newKey, ...prev])
        setShowCreateForm(false)
        setFormData({ name: '', description: '', expires_at: '' })
        
        // Show success message with the full API key (only shown once on creation)
        alert(`API Key created successfully!\n\nYour new API key: ${result.data.api_key}\n\nPlease copy and store this key securely. It will not be shown again.`)
      } else {
        errorLogger.logError('Failed to create API key', {
          component: 'tenant-api-keys',
          action: 'createApiKey',
          additionalData: { 
            error: result.error,
            tenantId: currentTenant.id,
            formData
          }
        })
        alert(`Failed to create API key: ${result.error}`)
      }
      
    } catch (error) {
      errorLogger.logError('Failed to create API key', {
        component: 'tenant-api-keys',
        action: 'createApiKey',
        additionalData: { 
          error: error instanceof Error ? error.message : 'Unknown error',
          tenantId: currentTenant.id,
          formData
        }
      })
      alert('Failed to create API key. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  // Create provisioning key
  const createProvisioningKey = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentTenant) return

    setCreatingProvisioning(true)
    try {
      const response = await fetch('/api/tenant/provisioning-keys', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tenantId: currentTenant.id,
          name: provisioningFormData.name,
          provider: provisioningFormData.provider,
          providerType: provisioningFormData.provider_type,
          endpoint: provisioningFormData.endpoint,
          config: provisioningFormData.config
        })
      })

      const result = await response.json()

      if (result.success) {
        setShowProvisioningForm(false)
        setProvisioningFormData({
          name: '',
          provider: '',
          provider_type: '',
          endpoint: '',
          config: {}
        })
        await loadProvisioningKeys()
        alert('Provisioning key created successfully!')
      } else {
        errorLogger.logError('Failed to create provisioning key', {
          component: 'tenant-api-keys',
          action: 'createProvisioningKey',
          additionalData: { 
            error: result.error,
            tenantId: currentTenant.id,
            formData: provisioningFormData
          }
        })
        alert(`Failed to create provisioning key: ${result.error}`)
      }
      
    } catch (error) {
      errorLogger.logError('Failed to create provisioning key', {
        component: 'tenant-api-keys',
        action: 'createProvisioningKey',
        additionalData: { 
          error: error instanceof Error ? error.message : 'Unknown error',
          tenantId: currentTenant.id,
          formData: provisioningFormData
        }
      })
      alert('Failed to create provisioning key. Please try again.')
    } finally {
      setCreatingProvisioning(false)
    }
  }

  // Toggle API key visibility
  const toggleKeyVisibility = (keyId: string) => {
    setRevealedKeys(prev => {
      const newSet = new Set(prev)
      if (newSet.has(keyId)) {
        newSet.delete(keyId)
      } else {
        newSet.add(keyId)
      }
      return newSet
    })
  }

  // Copy API key to clipboard
  const copyToClipboard = async (key: string) => {
    try {
      await navigator.clipboard.writeText(key)
      // TODO: Add toast notification
    } catch (error) {
      errorLogger.logError('Failed to copy API key', {
        component: 'tenant-api-keys',
        action: 'copyToClipboard',
        additionalData: { error: error instanceof Error ? error.message : 'Unknown error' }
      })
    }
  }

  // Toggle API key status
  const toggleApiKeyStatus = async (keyId: string) => {
    try {
      const currentKey = apiKeys.find(key => key.id === keyId)
      if (!currentKey) return

      const response = await fetch(`/api/tenant/api-keys/${keyId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          is_active: !currentKey.is_active
        })
      })

      const result = await response.json()

      if (result.success) {
        setApiKeys(prev => prev.map(key => 
          key.id === keyId ? { ...key, is_active: !key.is_active } : key
        ))
      } else {
        errorLogger.logError('Failed to toggle API key status', {
          component: 'tenant-api-keys',
          action: 'toggleApiKeyStatus',
          additionalData: { 
            error: result.error,
            keyId,
            tenantId: currentTenant?.id
          }
        })
        alert(`Failed to toggle API key status: ${result.error}`)
      }
    } catch (error) {
      errorLogger.logError('Failed to toggle API key status', {
        component: 'tenant-api-keys',
        action: 'toggleApiKeyStatus',
        additionalData: { 
          error: error instanceof Error ? error.message : 'Unknown error',
          keyId,
          tenantId: currentTenant?.id
        }
      })
      alert('Failed to toggle API key status. Please try again.')
    }
  }

  // Delete API key
  const deleteApiKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      return
    }

    try {
      // TODO: Replace with actual API call
      // await fetch(`/api/tenant/${currentTenant?.id}/api-keys/${keyId}`, {
      //   method: 'DELETE'
      // })

      setApiKeys(prev => prev.filter(key => key.id !== keyId))
    } catch (error) {
      errorLogger.logError('Failed to delete API key', {
        component: 'tenant-api-keys',
        action: 'deleteApiKey',
        additionalData: { 
          error: error instanceof Error ? error.message : 'Unknown error',
          keyId,
          tenantId: currentTenant?.id
        }
      })
    }
  }

  const getStatusColor = (status: boolean) => {
    return status ? 'success' : 'error'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatUsageCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
    return count.toString()
  }

  useEffect(() => {
    if (currentTenant) {
      loadApiKeys()
      loadProvisioningKeys()
      loadUsageAnalytics()
    }
  }, [currentTenant, loadApiKeys, loadProvisioningKeys, loadUsageAnalytics])

  if (!currentTenant) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            No Tenant Selected
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Please select a tenant to manage API keys.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            API Keys & Provisioning
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage API keys and external service integrations for {currentTenant.name}
          </p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          startIcon={<Plus className="h-4 w-4" />}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          Create API Key
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('api-keys')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'api-keys'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Key className="h-4 w-4" />
              <span>API Keys</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('provisioning')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'provisioning'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <ExternalLink className="h-4 w-4" />
              <span>Provisioning Keys</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'analytics'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4" />
              <span>Usage Analytics</span>
            </div>
          </button>
        </nav>
      </div>

      {/* API Keys Tab */}
      {activeTab === 'api-keys' && (
        <>
          {/* Create API Key Form */}
          {showCreateForm && (
            <Card>
              <CardTitle>Create New API Key</CardTitle>
              <CardDescription>
                Create a new API key for your applications and integrations
              </CardDescription>
              <form onSubmit={createApiKey} className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Key Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    placeholder="e.g., Production App, Webhook Service"
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
                    placeholder="Brief description of how this key will be used"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Expiration Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={formData.expires_at}
                    onChange={(e) => setFormData(prev => ({ ...prev, expires_at: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="flex space-x-3">
                  <Button
                    type="submit"
                    disabled={creating}
                    startIcon={<Plus className="h-4 w-4" />}
                  >
                    {creating ? 'Creating...' : 'Create API Key'}
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

          {/* API Keys List */}
          <Card>
            <CardTitle>API Keys</CardTitle>
            <CardDescription>
              Manage your tenant API keys for application integration
            </CardDescription>
            
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
                <span className="ml-3 text-gray-600 dark:text-gray-400">Loading API keys...</span>
              </div>
            ) : apiKeys.length === 0 ? (
              <div className="text-center py-8">
                <Key className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No API keys found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Create your first API key to start integrating with your applications
                </p>
                <Button
                  onClick={() => setShowCreateForm(true)}
                  startIcon={<Plus className="h-4 w-4" />}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Create First API Key
                </Button>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                {apiKeys.map((apiKey) => (
                  <div key={apiKey.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                            {apiKey.name}
                          </h4>
                          <Badge variant="solid" color={getStatusColor(apiKey.is_active)}>
                            {apiKey.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          {apiKey.expires_at && (
                            <Badge variant="light" color="warning">
                              Expires {formatDate(apiKey.expires_at)}
                            </Badge>
                          )}
                        </div>
                        
                        {apiKey.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            {apiKey.description}
                          </p>
                        )}

                        <div className="flex items-center space-x-4 mb-3">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-500 dark:text-gray-400">API Key:</span>
                            <code className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded font-mono">
                              {revealedKeys.has(apiKey.id) ? apiKey.api_key : apiKey.key_prefix}
                            </code>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleKeyVisibility(apiKey.id)}
                              startIcon={revealedKeys.has(apiKey.id) ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                            >
                              {revealedKeys.has(apiKey.id) ? 'Hide' : 'Show'}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(apiKey.api_key)}
                              startIcon={<Copy className="h-3 w-3" />}
                            >
                              Copy
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Created:</span>
                            <span className="ml-2 text-gray-900 dark:text-white">
                              {formatDate(apiKey.created_at)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Last Used:</span>
                            <span className="ml-2 text-gray-900 dark:text-white">
                              {apiKey.last_used ? formatDate(apiKey.last_used) : 'Never'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Usage Count:</span>
                            <span className="ml-2 text-gray-900 dark:text-white">
                              {formatUsageCount(apiKey.usage_count)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleApiKeyStatus(apiKey.id)}
                          startIcon={apiKey.is_active ? <Shield className="h-3 w-3" /> : <Zap className="h-3 w-3" />}
                        >
                          {apiKey.is_active ? 'Disable' : 'Enable'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          startIcon={<Edit className="h-3 w-3" />}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteApiKey(apiKey.id)}
                          startIcon={<Trash2 className="h-3 w-3" />}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}

      {/* Provisioning Keys Tab */}
      {activeTab === 'provisioning' && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <CardTitle>Provisioning Keys</CardTitle>
              <CardDescription>
                Connect external LLM providers and services to your tenant
              </CardDescription>
            </div>
            <Button
              onClick={() => setShowProvisioningForm(true)}
              startIcon={<Plus className="h-4 w-4" />}
              variant="outline"
            >
              Add Provider
            </Button>
          </div>

          {provisioningKeys.length === 0 ? (
            <div className="text-center py-8">
              <ExternalLink className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No provisioning keys configured
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Add external LLM providers to expand your AI capabilities
              </p>
              <Button
                onClick={() => setShowProvisioningForm(true)}
                startIcon={<Plus className="h-4 w-4" />}
                variant="outline"
              >
                Add First Provider
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {provisioningKeys.map((key) => (
                <div key={key.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                        <Settings className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                          {key.name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {key.provider} • {key.endpoint}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="solid" color={getStatusColor(key.is_active)}>
                        {key.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Button variant="outline" size="sm" startIcon={<Edit className="h-3 w-3" />}>
                        Configure
                      </Button>
                    </div>
                  </div>
                  <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                    Last used: {key.last_used ? formatDate(key.last_used) : 'Never'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {usageAnalytics?.total_requests.toLocaleString() || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {usageAnalytics?.successful_requests.toLocaleString() || 0} successful
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {usageAnalytics ? 
                    ((usageAnalytics.successful_requests / usageAnalytics.total_requests) * 100).toFixed(1) : 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {usageAnalytics?.failed_requests || 0} failed requests
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {usageAnalytics?.avg_response_time_ms.toFixed(0) || 0}ms
                </div>
                <p className="text-xs text-muted-foreground">
                  Average response time
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {usageAnalytics?.unique_users || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Active users
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Data Transfer Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Data Transfer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Requests Sent</span>
                    <span className="text-sm text-muted-foreground">
                      {usageAnalytics ? 
                        `${(usageAnalytics.total_request_size_bytes / 1024 / 1024).toFixed(2)} MB` : '0 MB'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Responses Received</span>
                    <span className="text-sm text-muted-foreground">
                      {usageAnalytics ? 
                        `${(usageAnalytics.total_response_size_bytes / 1024 / 1024).toFixed(2)} MB` : '0 MB'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Endpoints</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {usageAnalytics?.top_endpoints?.slice(0, 5).map((endpoint, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm truncate">{endpoint.endpoint}</span>
                      <span className="text-sm text-muted-foreground">{endpoint.count}</span>
                    </div>
                  )) || (
                    <p className="text-sm text-muted-foreground">No endpoint data available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Usage Chart Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>Usage Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Usage chart visualization coming soon</p>
                  <p className="text-sm mt-2">
                    {usageAnalytics?.hourly_usage?.length || 0} data points available
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
