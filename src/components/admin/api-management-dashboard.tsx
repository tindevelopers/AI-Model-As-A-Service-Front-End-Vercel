'use client'

import React, { useState, useEffect } from 'react'
import Button from '@/components/ui/button/Button'
import Badge from '@/components/ui/badge/Badge'
import { PlusIcon, EyeIcon, EyeCloseIcon, CopyIcon, DownloadIcon } from '@/icons'

interface ApiProvider {
  id: string
  name: string
  type: string
  environments: ApiEnvironment[]
  status: {
    isActive: boolean
    healthStatus: 'healthy' | 'degraded' | 'unhealthy'
    errorRate: number
    averageResponseTime: number
    totalRequests: number
    successfulRequests: number
    failedRequests: number
  }
  metadata: {
    provider: string
    version: string
    description: string
  }
  createdAt: string
  updatedAt: string
}

interface ApiEnvironment {
  id: string
  name: string
  baseUrl: string
  isActive: boolean
  priority: number
  healthStatus: 'healthy' | 'degraded' | 'unhealthy'
  lastHealthCheck: string
}

interface ApiKey {
  id: string
  name: string
  key: string
  keyPrefix: string
  providerIds: string[]
  environmentIds: string[]
  isActive: boolean
  expiresAt?: string
  lastUsedAt?: string
  createdAt: string
}

export default function ApiManagementDashboard() {
  const [providers, setProviders] = useState<ApiProvider[]>([])
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('providers')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Form states
  const [newProvider, setNewProvider] = useState({
    name: '',
    type: '',
    baseUrl: '',
    apiKey: '',
    description: ''
  })

  const [newApiKey, setNewApiKey] = useState({
    name: '',
    providerIds: [] as string[],
    environmentIds: [] as string[],
    permissions: [] as string[]
  })

  useEffect(() => {
    fetchData()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        fetchProviders(),
        fetchApiKeys()
      ])
    } catch (error) {
      setError('Failed to load data')
      console.error('Failed to fetch API management data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProviders = async () => {
    try {
      const response = await fetch('/api/admin/providers')
      const data = await response.json()
      if (data.success) {
        setProviders(data.data)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Failed to fetch providers:', error)
    }
  }

  const fetchApiKeys = async () => {
    try {
      const response = await fetch('/api/admin/api-keys')
      const data = await response.json()
      if (data.success) {
        setApiKeys(data.data)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Failed to fetch API keys:', error)
    }
  }

  const createProvider = async () => {
    try {
      const response = await fetch('/api/admin/providers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newProvider.name,
          type: newProvider.type,
          environments: [{
            name: 'Default Environment',
            baseUrl: newProvider.baseUrl,
            isActive: true,
            priority: 1,
            healthCheck: {
              endpoint: '/health',
              interval: 30000,
              timeout: 5000,
              expectedStatus: 200
            },
            rateLimits: {
              requestsPerMinute: 60,
              requestsPerHour: 1000,
              requestsPerDay: 10000,
              burstLimit: 10
            },
            timeout: 30000,
            retryAttempts: 3
          }],
          credentials: {
            apiKey: newProvider.apiKey
          },
          capabilities: {
            supportedEndpoints: ['/api/v1/generate', '/health'],
            supportedFormats: ['text', 'json'],
            maxTokens: 4000,
            supportedLanguages: ['en'],
            specialFeatures: ['content-generation'],
            quality: {
              relevance: 0.8,
              coherence: 0.8,
              creativity: 0.8,
              accuracy: 0.8,
              overall: 0.8
            }
          },
          limits: {
            maxRequestsPerMinute: 60,
            maxRequestsPerHour: 1000,
            maxRequestsPerDay: 10000,
            maxTokensPerRequest: 4000,
            maxConcurrentRequests: 10,
            costPerToken: 0.001,
            currency: 'USD'
          },
          metadata: {
            provider: 'Custom Provider',
            version: '1.0.0',
            description: newProvider.description,
            documentation: '',
            supportContact: '',
            tags: []
          }
        })
      })

      const data = await response.json()
      if (data.success) {
        setProviders(prev => [data.data, ...prev])
        setShowCreateModal(false)
        setNewProvider({ name: '', type: '', baseUrl: '', apiKey: '', description: '' })
      } else {
        setError(data.error)
      }
    } catch (error) {
      setError('Failed to create provider')
      console.error('Failed to create provider:', error)
    }
  }

  const createApiKey = async () => {
    try {
      const response = await fetch('/api/admin/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newApiKey.name,
          providerIds: newApiKey.providerIds,
          environmentIds: newApiKey.environmentIds,
          permissions: newApiKey.permissions,
          rateLimits: {
            requestsPerMinute: 60,
            requestsPerHour: 1000,
            requestsPerDay: 10000,
            burstLimit: 10
          }
        })
      })

      const data = await response.json()
      if (data.success) {
        setApiKeys(prev => [data.data, ...prev])
        setShowApiKeyModal(false)
        setNewApiKey({ name: '', providerIds: [], environmentIds: [], permissions: [] })
      } else {
        setError(data.error)
      }
    } catch (error) {
      setError('Failed to create API key')
      console.error('Failed to create API key:', error)
    }
  }

  const toggleKeyVisibility = (keyId: string) => {
    setVisibleKeys(prev => {
      const newSet = new Set(prev)
      if (newSet.has(keyId)) {
        newSet.delete(keyId)
      } else {
        newSet.add(keyId)
      }
      return newSet
    })
  }

  const copyToClipboard = async (text: string, keyId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedKey(keyId)
      setTimeout(() => setCopiedKey(null), 2000)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  const getHealthStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <span className="text-green-500">●</span>
      case 'degraded':
        return <span className="text-yellow-500">●</span>
      case 'unhealthy':
        return <span className="text-red-500">●</span>
      default:
        return <span className="text-gray-500">●</span>
    }
  }

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'success'
      case 'degraded':
        return 'warning'
      case 'unhealthy':
        return 'error'
      default:
        return 'light'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">API Management</h1>
          <p className="text-muted-foreground">
            Manage API providers, keys, and assignments
          </p>
        </div>
        <Button onClick={fetchData} variant="outline">
          <DownloadIcon className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('providers')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'providers'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Providers
          </button>
          <button
            onClick={() => setActiveTab('api-keys')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'api-keys'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            API Keys
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'analytics'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Analytics
          </button>
        </nav>
      </div>

      {/* Providers Tab */}
      {activeTab === 'providers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">API Providers</h2>
            <Button onClick={() => setShowCreateModal(true)}>
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Provider
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {providers.map((provider) => (
              <div key={provider.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">{provider.name}</h3>
                  <Badge color={getHealthStatusColor(provider.status.healthStatus)}>
                    {getHealthStatusIcon(provider.status.healthStatus)}
                    <span className="ml-1 capitalize">{provider.status.healthStatus}</span>
                  </Badge>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">{provider.metadata.description}</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Type:</span>
                    <Badge variant="light" color="info">{provider.type}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Environments:</span>
                    <span>{provider.environments.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Requests:</span>
                    <span>{provider.status.totalRequests}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Success Rate:</span>
                    <span>
                      {provider.status.totalRequests > 0
                        ? Math.round((provider.status.successfulRequests / provider.status.totalRequests) * 100)
                        : 0}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* API Keys Tab */}
      {activeTab === 'api-keys' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">API Keys</h2>
            <Button onClick={() => setShowApiKeyModal(true)}>
              <PlusIcon className="w-4 h-4 mr-2" />
              Create Key
            </Button>
          </div>

          <div className="space-y-4">
            {apiKeys.map((apiKey) => (
              <div key={apiKey.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="font-semibold">{apiKey.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {apiKey.providerIds.length} provider(s) • Created {new Date(apiKey.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge color={apiKey.isActive ? 'success' : 'light'}>
                      {apiKey.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleKeyVisibility(apiKey.id)}
                    >
                      {visibleKeys.has(apiKey.id) ? (
                        <EyeCloseIcon className="w-4 h-4" />
                      ) : (
                        <EyeIcon className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(apiKey.key, apiKey.id)}
                    >
                      {copiedKey === apiKey.id ? (
                        <span className="text-green-600 text-xs">Copied!</span>
                      ) : (
                        <CopyIcon className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
                {visibleKeys.has(apiKey.id) && (
                  <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-md">
                    <code className="text-sm break-all">{apiKey.key}</code>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Analytics</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <DownloadIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Providers</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{providers.length}</p>
                  <p className="text-xs text-gray-500">
                    {providers.filter(p => p.status.isActive).length} active
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <DownloadIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total API Keys</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{apiKeys.length}</p>
                  <p className="text-xs text-gray-500">
                    {apiKeys.filter(k => k.isActive).length} active
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                  <DownloadIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Requests</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {providers.reduce((sum, p) => sum + p.status.totalRequests, 0)}
                  </p>
                  <p className="text-xs text-gray-500">Across all providers</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <DownloadIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Success Rate</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {(() => {
                      const totalRequests = providers.reduce((sum, p) => sum + p.status.totalRequests, 0)
                      const totalSuccessful = providers.reduce((sum, p) => sum + p.status.successfulRequests, 0)
                      return totalRequests > 0 ? Math.round((totalSuccessful / totalRequests) * 100) : 0
                    })()}%
                  </p>
                  <p className="text-xs text-gray-500">Overall success rate</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Provider Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create API Provider</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Name</label>
                <input
                  type="text"
                  value={newProvider.name}
                  onChange={(e) => setNewProvider(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Provider name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Type</label>
                <select
                  value={newProvider.type}
                  onChange={(e) => setNewProvider(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select type</option>
                  <option value="blog-writing">Blog Writing</option>
                  <option value="content-generation">Content Generation</option>
                  <option value="seo-optimization">SEO Optimization</option>
                  <option value="keyword-research">Keyword Research</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Base URL</label>
                <input
                  type="text"
                  value={newProvider.baseUrl}
                  onChange={(e) => setNewProvider(prev => ({ ...prev, baseUrl: e.target.value }))}
                  placeholder="https://api.example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">API Key</label>
                <input
                  type="password"
                  value={newProvider.apiKey}
                  onChange={(e) => setNewProvider(prev => ({ ...prev, apiKey: e.target.value }))}
                  placeholder="API key"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={newProvider.description}
                  onChange={(e) => setNewProvider(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Provider description"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button onClick={createProvider} className="flex-1">
                Create
              </Button>
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create API Key Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create API Key</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Name</label>
                <input
                  type="text"
                  value={newApiKey.name}
                  onChange={(e) => setNewApiKey(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="API key name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Providers</label>
                <div className="space-y-2">
                  {providers.map((provider) => (
                    <div key={provider.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={newApiKey.providerIds.includes(provider.id)}
                        onChange={(e) => {
                          setNewApiKey(prev => ({
                            ...prev,
                            providerIds: e.target.checked
                              ? [...prev.providerIds, provider.id]
                              : prev.providerIds.filter(id => id !== provider.id)
                          }))
                        }}
                      />
                      <label>{provider.name}</label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button onClick={createApiKey} className="flex-1">
                Create
              </Button>
              <Button variant="outline" onClick={() => setShowApiKeyModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}