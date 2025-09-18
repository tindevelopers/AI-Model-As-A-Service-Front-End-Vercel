'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Plus, 
  Settings, 
  Key, 
  Activity, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  Edit
} from 'lucide-react'
import { errorLogger } from '@/utils/errorLogger'

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

interface ApiAssignment {
  id: string
  name: string
  description: string
  providerIds: string[]
  environmentIds: string[]
  isActive: boolean
  createdAt: string
}

export default function ApiManagementDashboard() {
  const [providers, setProviders] = useState<ApiProvider[]>([])
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [assignments, setAssignments] = useState<ApiAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('providers')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)
  const [showAssignmentModal, setShowAssignmentModal] = useState(false)
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

  const [newAssignment, setNewAssignment] = useState({
    name: '',
    description: '',
    providerIds: [] as string[],
    environmentIds: [] as string[]
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        fetchProviders(),
        fetchApiKeys(),
        fetchAssignments()
      ])
    } catch (error) {
      setError('Failed to load data')
      errorLogger.logError('Failed to fetch API management data', {
        component: 'api-management-dashboard',
        action: 'fetchData',
        additionalData: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      })
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

  const fetchAssignments = async () => {
    try {
      const response = await fetch('/api/admin/assignments')
      const data = await response.json()
      if (data.success) {
        setAssignments(data.data)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Failed to fetch assignments:', error)
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
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'degraded':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case 'unhealthy':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800'
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800'
      case 'unhealthy':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
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
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="providers" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">API Providers</h2>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Provider
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {providers.map((provider) => (
              <Card key={provider.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{provider.name}</CardTitle>
                    <Badge className={getHealthStatusColor(provider.status.healthStatus)}>
                      {getHealthStatusIcon(provider.status.healthStatus)}
                      <span className="ml-1 capitalize">{provider.status.healthStatus}</span>
                    </Badge>
                  </div>
                  <CardDescription>{provider.metadata.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Type:</span>
                      <Badge variant="outline">{provider.type}</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Environments:</span>
                      <span>{provider.environments.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Total Requests:</span>
                      <span>{provider.status.totalRequests}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Success Rate:</span>
                      <span>
                        {provider.status.totalRequests > 0
                          ? Math.round((provider.status.successfulRequests / provider.status.totalRequests) * 100)
                          : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Avg Response Time:</span>
                      <span>{Math.round(provider.status.averageResponseTime)}ms</span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" variant="outline">
                      <Settings className="h-4 w-4 mr-1" />
                      Configure
                    </Button>
                    <Button size="sm" variant="outline">
                      <Activity className="h-4 w-4 mr-1" />
                      Monitor
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="api-keys" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">API Keys</h2>
            <Button onClick={() => setShowApiKeyModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Key
            </Button>
          </div>

          <div className="space-y-4">
            {apiKeys.map((apiKey) => (
              <Card key={apiKey.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h3 className="font-semibold">{apiKey.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {apiKey.providerIds.length} provider(s) • Created {new Date(apiKey.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={apiKey.isActive ? 'default' : 'secondary'}>
                        {apiKey.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleKeyVisibility(apiKey.id)}
                      >
                        {visibleKeys.has(apiKey.id) ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(apiKey.key, apiKey.id)}
                      >
                        {copiedKey === apiKey.id ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  {visibleKeys.has(apiKey.id) && (
                    <div className="mt-4 p-3 bg-muted rounded-md">
                      <code className="text-sm break-all">{apiKey.key}</code>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">API Assignments</h2>
            <Button onClick={() => setShowAssignmentModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Assignment
            </Button>
          </div>

          <div className="space-y-4">
            {assignments.map((assignment) => (
              <Card key={assignment.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h3 className="font-semibold">{assignment.name}</h3>
                      <p className="text-sm text-muted-foreground">{assignment.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {assignment.providerIds.length} provider(s) • {assignment.environmentIds.length} environment(s)
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={assignment.isActive ? 'default' : 'secondary'}>
                        {assignment.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <h2 className="text-2xl font-semibold">Analytics</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Providers</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{providers.length}</div>
                <p className="text-xs text-muted-foreground">
                  {providers.filter(p => p.status.isActive).length} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total API Keys</CardTitle>
                <Key className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{apiKeys.length}</div>
                <p className="text-xs text-muted-foreground">
                  {apiKeys.filter(k => k.isActive).length} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {providers.reduce((sum, p) => sum + p.status.totalRequests, 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Across all providers
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(() => {
                    const totalRequests = providers.reduce((sum, p) => sum + p.status.totalRequests, 0)
                    const totalSuccessful = providers.reduce((sum, p) => sum + p.status.successfulRequests, 0)
                    return totalRequests > 0 ? Math.round((totalSuccessful / totalRequests) * 100) : 0
                  })()}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Overall success rate
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Provider Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Create API Provider</CardTitle>
              <CardDescription>
                Add a new API provider to the system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newProvider.name}
                  onChange={(e) => setNewProvider(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Provider name"
                />
              </div>
              <div>
                <Label htmlFor="type">Type</Label>
                <Select value={newProvider.type} onValueChange={(value) => setNewProvider(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blog-writing">Blog Writing</SelectItem>
                    <SelectItem value="content-generation">Content Generation</SelectItem>
                    <SelectItem value="seo-optimization">SEO Optimization</SelectItem>
                    <SelectItem value="keyword-research">Keyword Research</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="baseUrl">Base URL</Label>
                <Input
                  id="baseUrl"
                  value={newProvider.baseUrl}
                  onChange={(e) => setNewProvider(prev => ({ ...prev, baseUrl: e.target.value }))}
                  placeholder="https://api.example.com"
                />
              </div>
              <div>
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={newProvider.apiKey}
                  onChange={(e) => setNewProvider(prev => ({ ...prev, apiKey: e.target.value }))}
                  placeholder="API key"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newProvider.description}
                  onChange={(e) => setNewProvider(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Provider description"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={createProvider} className="flex-1">
                  Create
                </Button>
                <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create API Key Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Create API Key</CardTitle>
              <CardDescription>
                Generate a new API key for accessing services
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="keyName">Name</Label>
                <Input
                  id="keyName"
                  value={newApiKey.name}
                  onChange={(e) => setNewApiKey(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="API key name"
                />
              </div>
              <div>
                <Label>Providers</Label>
                <div className="space-y-2">
                  {providers.map((provider) => (
                    <div key={provider.id} className="flex items-center space-x-2">
                      <Switch
                        checked={newApiKey.providerIds.includes(provider.id)}
                        onCheckedChange={(checked) => {
                          setNewApiKey(prev => ({
                            ...prev,
                            providerIds: checked
                              ? [...prev.providerIds, provider.id]
                              : prev.providerIds.filter(id => id !== provider.id)
                          }))
                        }}
                      />
                      <Label>{provider.name}</Label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={createApiKey} className="flex-1">
                  Create
                </Button>
                <Button variant="outline" onClick={() => setShowApiKeyModal(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create Assignment Modal */}
      {showAssignmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Create API Assignment</CardTitle>
              <CardDescription>
                Create a new assignment for routing requests
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="assignmentName">Name</Label>
                <Input
                  id="assignmentName"
                  value={newAssignment.name}
                  onChange={(e) => setNewAssignment(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Assignment name"
                />
              </div>
              <div>
                <Label htmlFor="assignmentDescription">Description</Label>
                <Textarea
                  id="assignmentDescription"
                  value={newAssignment.description}
                  onChange={(e) => setNewAssignment(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Assignment description"
                />
              </div>
              <div>
                <Label>Providers</Label>
                <div className="space-y-2">
                  {providers.map((provider) => (
                    <div key={provider.id} className="flex items-center space-x-2">
                      <Switch
                        checked={newAssignment.providerIds.includes(provider.id)}
                        onCheckedChange={(checked) => {
                          setNewAssignment(prev => ({
                            ...prev,
                            providerIds: checked
                              ? [...prev.providerIds, provider.id]
                              : prev.providerIds.filter(id => id !== provider.id)
                          }))
                        }}
                      />
                      <Label>{provider.name}</Label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setShowAssignmentModal(false)} className="flex-1">
                  Create
                </Button>
                <Button variant="outline" onClick={() => setShowAssignmentModal(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
