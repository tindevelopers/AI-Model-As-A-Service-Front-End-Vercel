'use client'

import { useState, useEffect } from 'react'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button/Button'
import { Badge } from '@/components/ui/badge/Badge'
import { CheckCircle, XCircle, RefreshCw, Settings, Activity } from 'lucide-react'

interface BlogWriterHealthStatus {
  service: string
  status: 'healthy' | 'unhealthy'
  timestamp: string
  error?: string
}

interface BlogWriterConfig {
  baseUrl: string
  timeout: number
  retryAttempts: number
}

export default function BlogWriterServiceManager() {
  const [healthStatus, setHealthStatus] = useState<BlogWriterHealthStatus | null>(null)
  const [config, setConfig] = useState<BlogWriterConfig | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load initial data
  useEffect(() => {
    loadHealthStatus()
    loadConfig()
  }, [])

  const loadHealthStatus = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/blog-writer/health')
      const data = await response.json()
      
      if (data.success) {
        setHealthStatus(data.data)
        setError(null)
      } else {
        setError(data.error || 'Failed to load health status')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load health status')
    } finally {
      setLoading(false)
    }
  }


  const loadConfig = async () => {
    try {
      const response = await fetch('/api/admin/services/blog-writer/config')
      const data = await response.json()
      
      if (data.success) {
        setConfig(data.data)
      }
    } catch (err) {
      console.error('Failed to load config:', err)
    }
  }


  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'unhealthy':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Activity className="h-5 w-5 text-yellow-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge variant="default" className="bg-green-500">Healthy</Badge>
      case 'unhealthy':
        return <Badge variant="destructive">Unhealthy</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Service Status */}
      <Card>
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Blog Writer Service
              </CardTitle>
              <CardDescription>
                Manage and monitor the AI Blog Writer API service
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadHealthStatus}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
        <div className="space-y-4">
          {healthStatus && (
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(healthStatus.status)}
                <div>
                  <p className="font-medium">Service Status</p>
                  <p className="text-sm text-muted-foreground">
                    Last checked: {new Date(healthStatus.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
              {getStatusBadge(healthStatus.status)}
            </div>
          )}

          {config && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 border rounded-lg">
                <p className="text-sm font-medium">Base URL</p>
                <p className="text-sm text-muted-foreground truncate">{config.baseUrl}</p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="text-sm font-medium">Timeout</p>
                <p className="text-sm text-muted-foreground">{config.timeout}ms</p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="text-sm font-medium">Retry Attempts</p>
                <p className="text-sm text-muted-foreground">{config.retryAttempts}</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Test Generation */}
      <Card>
        <div className="mb-4">
          <CardTitle>Test Blog Generation</CardTitle>
          <CardDescription>
            Test the blog writer service with sample data
          </CardDescription>
        </div>
        <div className="space-y-4">
          <div className="p-4 border rounded-lg">
            <h3 className="font-medium mb-2">Service Status</h3>
            <p className="text-sm text-gray-600">
              The Blog Writer API service is integrated and ready to use.
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Use the API endpoints to generate blog posts with proper authentication.
            </p>
          </div>

          <div className="p-4 border rounded-lg">
            <h3 className="font-medium mb-2">Available Endpoints</h3>
            <ul className="text-sm space-y-1">
              <li>• <code>POST /api/blog-writer/generate</code> - Generate blog posts</li>
              <li>• <code>GET /api/blog-writer/health</code> - Check service health</li>
              <li>• <code>GET /api/blog-writer/generate</code> - Get available options</li>
            </ul>
          </div>

          {error && (
            <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            </div>
          )}

        </div>
      </Card>
    </div>
  )
}
