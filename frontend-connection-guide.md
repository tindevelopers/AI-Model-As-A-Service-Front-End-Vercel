# Frontend to Google Cloud Run Connection Guide

## Step 1: Deploy Your Gateway (If Not Already Done)

### 1.1 Build and Deploy to Cloud Run
```bash
# Build and deploy your gateway
gcloud run deploy ai-gateway \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8000 \
  --memory 2Gi \
  --cpu 2 \
  --max-instances 10 \
  --set-env-vars="ENVIRONMENT=development"

# Get the service URL
gcloud run services describe ai-gateway --region=us-central1 --format="value(status.url)"
```

## Step 2: Update CORS Configuration

### 2.1 Update your settings for frontend domains
In `src/core/config.py`, add your frontend domains:

```python
# Add to your settings class
ALLOWED_HOSTS = [
    "localhost:3000",  # Local development
    "*.vercel.app",    # Vercel preview deployments
    "yourdomain.com",  # Production domain
    "*.yourdomain.com" # Subdomains
]
```

## Step 3: Create Frontend API Client

### 3.1 Install Required Dependencies
```bash
cd your-frontend-project
npm install axios @supabase/supabase-js
```

### 3.2 Create API Client Service
Create `lib/api-client.ts`:

```typescript
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { createClient } from '@supabase/supabase-js';

// Supabase client
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// API Client class
class APIClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_GATEWAY_URL!;
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      async (config) => {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.access_token) {
          config.headers.Authorization = `Bearer ${session.access_token}`;
        }
        
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  // Health check
  async healthCheck() {
    const response = await this.client.get('/health');
    return response.data;
  }

  // API Key Management
  async getApiKeys() {
    const response = await this.client.get('/v1/api-keys');
    return response.data;
  }

  async createApiKey(data: {
    name: string;
    description?: string;
    allowed_models?: string[];
    rate_limit_per_minute?: number;
  }) {
    const response = await this.client.post('/v1/api-keys', data);
    return response.data;
  }

  async deleteApiKey(keyId: string) {
    const response = await this.client.delete(`/v1/api-keys/${keyId}`);
    return response.data;
  }

  // Models
  async getAvailableModels() {
    const response = await this.client.get('/v1/models');
    return response.data;
  }

  // Chat Completions (for testing)
  async createChatCompletion(data: {
    model: string;
    messages: Array<{ role: string; content: string }>;
    temperature?: number;
    max_tokens?: number;
  }, apiKey?: string) {
    const config: AxiosRequestConfig = {};
    
    if (apiKey) {
      config.headers = { 'Authorization': `Bearer ${apiKey}` };
    }
    
    const response = await this.client.post('/v1/chat/completions', data, config);
    return response.data;
  }

  // Usage Analytics
  async getUsageAnalytics(params?: {
    start_date?: string;
    end_date?: string;
    api_key_id?: string;
  }) {
    const response = await this.client.get('/admin/usage-analytics', { params });
    return response.data;
  }
}

// Export singleton instance
export const apiClient = new APIClient();
```

### 3.3 Create React Hooks for API Operations
Create `hooks/useApi.ts`:

```typescript
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

// Hook for API Keys
export function useApiKeys() {
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApiKeys = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getApiKeys();
      setApiKeys(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch API keys');
    } finally {
      setLoading(false);
    }
  };

  const createApiKey = async (keyData: {
    name: string;
    description?: string;
    allowed_models?: string[];
    rate_limit_per_minute?: number;
  }) => {
    try {
      const newKey = await apiClient.createApiKey(keyData);
      await fetchApiKeys(); // Refresh list
      return newKey;
    } catch (err: any) {
      throw new Error(err.response?.data?.error || 'Failed to create API key');
    }
  };

  const deleteApiKey = async (keyId: string) => {
    try {
      await apiClient.deleteApiKey(keyId);
      await fetchApiKeys(); // Refresh list
    } catch (err: any) {
      throw new Error(err.response?.data?.error || 'Failed to delete API key');
    }
  };

  useEffect(() => {
    fetchApiKeys();
  }, []);

  return {
    apiKeys,
    loading,
    error,
    createApiKey,
    deleteApiKey,
    refetch: fetchApiKeys,
  };
}

// Hook for Available Models
export function useModels() {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        setLoading(true);
        const data = await apiClient.getAvailableModels();
        setModels(data.data || []);
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to fetch models');
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, []);

  return { models, loading, error };
}

// Hook for Gateway Health
export function useGatewayHealth() {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        setLoading(true);
        const data = await apiClient.healthCheck();
        setHealth(data);
        setError(null);
      } catch (err: any) {
        setError('Gateway is not responding');
      } finally {
        setLoading(false);
      }
    };

    checkHealth();
    
    // Check health every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return { health, loading, error };
}
```

## Step 4: Create Frontend Components

### 4.1 API Key Management Component
Create `components/api-keys/ApiKeyManager.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { useApiKeys, useModels } from '@/hooks/useApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Copy, Eye, EyeOff } from 'lucide-react';

export default function ApiKeyManager() {
  const { apiKeys, loading, error, createApiKey, deleteApiKey } = useApiKeys();
  const { models } = useModels();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  
  const [newKeyData, setNewKeyData] = useState({
    name: '',
    description: '',
    allowed_models: [] as string[],
    rate_limit_per_minute: 100,
  });

  const handleCreateKey = async () => {
    try {
      await createApiKey(newKeyData);
      setNewKeyData({
        name: '',
        description: '',
        allowed_models: [],
        rate_limit_per_minute: 100,
      });
      setShowCreateForm(false);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const toggleKeyVisibility = (keyId: string) => {
    const newVisible = new Set(visibleKeys);
    if (newVisible.has(keyId)) {
      newVisible.delete(keyId);
    } else {
      newVisible.add(keyId);
    }
    setVisibleKeys(newVisible);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  if (loading) return <div>Loading API keys...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">API Key Management</h2>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create New Key
        </Button>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New API Key</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Key Name"
              value={newKeyData.name}
              onChange={(e) => setNewKeyData({ ...newKeyData, name: e.target.value })}
            />
            <Input
              placeholder="Description (optional)"
              value={newKeyData.description}
              onChange={(e) => setNewKeyData({ ...newKeyData, description: e.target.value })}
            />
            <Input
              type="number"
              placeholder="Rate Limit (requests per minute)"
              value={newKeyData.rate_limit_per_minute}
              onChange={(e) => setNewKeyData({ ...newKeyData, rate_limit_per_minute: parseInt(e.target.value) })}
            />
            <div className="flex space-x-2">
              <Button onClick={handleCreateKey}>Create Key</Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {apiKeys.map((key: any) => (
          <Card key={key.id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <h3 className="font-semibold">{key.name}</h3>
                  {key.description && (
                    <p className="text-sm text-gray-600">{key.description}</p>
                  )}
                  <div className="flex items-center space-x-2">
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                      {visibleKeys.has(key.id) ? key.key : '••••••••••••••••'}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleKeyVisibility(key.id)}
                    >
                      {visibleKeys.has(key.id) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(key.key)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex space-x-2">
                    <Badge variant="secondary">
                      {key.usage_count || 0} requests
                    </Badge>
                    <Badge variant="outline">
                      {key.rate_limit_per_minute}/min
                    </Badge>
                    {key.is_active ? (
                      <Badge variant="default">Active</Badge>
                    ) : (
                      <Badge variant="destructive">Inactive</Badge>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => deleteApiKey(key.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

### 4.2 Gateway Status Component
Create `components/gateway/GatewayStatus.tsx`:

```typescript
'use client';

import { useGatewayHealth } from '@/hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

export default function GatewayStatus() {
  const { health, loading, error } = useGatewayHealth();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Gateway Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>Checking gateway status...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <XCircle className="w-5 h-5 mr-2 text-red-500" />
            Gateway Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Badge variant="destructive">Offline</Badge>
          <p className="mt-2 text-sm text-gray-600">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
          Gateway Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Badge variant="default">Online</Badge>
          <div className="text-sm space-y-1">
            <p><strong>Version:</strong> {health?.version}</p>
            <p><strong>Environment:</strong> {health?.environment}</p>
            <p><strong>Last Check:</strong> {new Date(health?.timestamp * 1000).toLocaleString()}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

## Step 5: Test the Connection

### 5.1 Create a Test Page
Create `app/test-connection/page.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api-client';
import ApiKeyManager from '@/components/api-keys/ApiKeyManager';
import GatewayStatus from '@/components/gateway/GatewayStatus';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestConnectionPage() {
  const [testResult, setTestResult] = useState<string>('');
  const [testing, setTesting] = useState(false);

  const testGatewayConnection = async () => {
    setTesting(true);
    try {
      // Test health endpoint
      const health = await apiClient.healthCheck();
      setTestResult(`✅ Gateway is healthy! Version: ${health.version}, Environment: ${health.environment}`);
    } catch (error: any) {
      setTestResult(`❌ Connection failed: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Gateway Connection Test</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GatewayStatus />
        
        <Card>
          <CardHeader>
            <CardTitle>Connection Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={testGatewayConnection} 
              disabled={testing}
              className="w-full"
            >
              {testing ? 'Testing...' : 'Test Gateway Connection'}
            </Button>
            {testResult && (
              <div className="p-3 bg-gray-100 rounded">
                <pre className="text-sm">{testResult}</pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ApiKeyManager />
    </div>
  );
}
```

## Step 6: Environment Setup

### 6.1 Update your `.env.local` file:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Gateway (replace with your actual Cloud Run URL)
NEXT_PUBLIC_GATEWAY_URL=https://your-gateway-service-url.run.app
NEXT_PUBLIC_GATEWAY_API_VERSION=v1
NEXT_PUBLIC_ENVIRONMENT=development
```

## Step 7: Deploy and Test

### 7.1 Deploy your gateway if not already done:
```bash
gcloud run deploy ai-gateway --source . --region us-central1 --allow-unauthenticated
```

### 7.2 Get your service URL:
```bash
gcloud run services describe ai-gateway --region=us-central1 --format="value(status.url)"
```

### 7.3 Update your frontend environment variables with the actual URL

### 7.4 Test the connection:
1. Start your frontend: `npm run dev`
2. Navigate to `/test-connection`
3. Click "Test Gateway Connection"
4. Verify the connection works

## Troubleshooting

### Common Issues:

1. **CORS Errors**: Make sure your frontend domain is in `ALLOWED_HOSTS` in your gateway config
2. **Authentication Errors**: Verify Supabase configuration and JWT token handling
3. **Network Errors**: Check that your Cloud Run service allows unauthenticated requests
4. **Environment Variables**: Ensure all required env vars are set correctly

### Debug Steps:
1. Check browser network tab for failed requests
2. Check Cloud Run logs: `gcloud logs read --service=ai-gateway`
3. Verify environment variables are loaded correctly
4. Test gateway endpoints directly with curl or Postman

This guide provides a complete implementation for connecting your frontend to the Google Cloud Run service. The API client handles authentication, error handling, and provides React hooks for easy integration with your TailAdmin components.
