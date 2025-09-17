'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle, XCircle, RefreshCw, Settings, Activity } from 'lucide-react'
import { errorLogger } from '@/utils/errorLogger'

interface BlogWriterHealthStatus {
  service: string
  status: 'healthy' | 'unhealthy'
  timestamp: string
  error?: string
}

interface BlogWriterOptions {
  tones: string[]
  lengths: string[]
  languages: string[]
  styles: string[]
}

interface BlogWriterConfig {
  baseUrl: string
  timeout: number
  retryAttempts: number
}

export default function BlogWriterServiceManager() {
  const [healthStatus, setHealthStatus] = useState<BlogWriterHealthStatus | null>(null)
  const [options, setOptions] = useState<BlogWriterOptions | null>(null)
  const [config, setConfig] = useState<BlogWriterConfig | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [testRequest, setTestRequest] = useState({
    topic: '',
    tone: 'professional',
    length: 'medium',
    target_audience: '',
    include_outline: true
  })
  const [testResult, setTestResult] = useState<{
    title: string
    content: string
    word_count: number
    outline?: string[]
  } | null>(null)

  // Load initial data
  useEffect(() => {
    loadHealthStatus()
    loadOptions()
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

  const loadOptions = async () => {
    try {
      const response = await fetch('/api/blog-writer/generate')
      const data = await response.json()
      
      if (data.success) {
        setOptions(data.data)
      }
    } catch (err) {
      console.error('Failed to load options:', err)
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

  const testBlogGeneration = async () => {
    if (!testRequest.topic.trim()) {
      setError('Please enter a topic for testing')
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/blog-writer/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testRequest)
      })
      
      const data = await response.json()
      
      if (data.success) {
        setTestResult(data.data)
        errorLogger.logSuccess('Blog generation test successful', {
          component: 'blog-writer-service-manager',
          action: 'testGeneration',
          additionalData: {
            topic: testRequest.topic,
            wordCount: data.data.word_count
          }
        })
      } else {
        setError(data.error || 'Test generation failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Test generation failed')
    } finally {
      setLoading(false)
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
        <CardHeader>
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
        </CardHeader>
        <CardContent className="space-y-4">
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
        </CardContent>
      </Card>

      {/* Test Generation */}
      <Card>
        <CardHeader>
          <CardTitle>Test Blog Generation</CardTitle>
          <CardDescription>
            Test the blog writer service with sample data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="topic">Topic *</Label>
              <Input
                id="topic"
                placeholder="Enter blog topic..."
                value={testRequest.topic}
                onChange={(e) => setTestRequest({ ...testRequest, topic: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tone">Tone</Label>
              <Select
                value={testRequest.tone}
                onValueChange={(value) => setTestRequest({ ...testRequest, tone: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {options?.tones.map((tone) => (
                    <SelectItem key={tone} value={tone}>
                      {tone.charAt(0).toUpperCase() + tone.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="length">Length</Label>
              <Select
                value={testRequest.length}
                onValueChange={(value) => setTestRequest({ ...testRequest, length: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {options?.lengths.map((length) => (
                    <SelectItem key={length} value={length}>
                      {length.charAt(0).toUpperCase() + length.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="audience">Target Audience</Label>
              <Input
                id="audience"
                placeholder="e.g., developers, marketers..."
                value={testRequest.target_audience}
                onChange={(e) => setTestRequest({ ...testRequest, target_audience: e.target.value })}
              />
            </div>
          </div>

          <Button
            onClick={testBlogGeneration}
            disabled={loading || !testRequest.topic.trim()}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              'Test Blog Generation'
            )}
          </Button>

          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {testResult && (
            <div className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Blog post generated successfully! Word count: {testResult.word_count}
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <Label>Generated Title</Label>
                <p className="font-medium">{testResult.title}</p>
              </div>
              
              <div className="space-y-2">
                <Label>Content Preview</Label>
                <Textarea
                  value={testResult.content.substring(0, 500) + '...'}
                  readOnly
                  className="min-h-[100px]"
                />
              </div>

              {testResult.outline && (
                <div className="space-y-2">
                  <Label>Outline</Label>
                  <ul className="list-disc list-inside space-y-1">
                    {testResult.outline.map((item: string, index: number) => (
                      <li key={index} className="text-sm">{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
