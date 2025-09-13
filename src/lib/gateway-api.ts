const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || 'https://placeholder.run.app'

if (typeof window !== 'undefined' && GATEWAY_URL === 'https://placeholder.run.app') {
  console.warn('Gateway URL not configured. API calls will not work.')
}
export interface ApiKey {
  id: string
  name: string
  key_prefix: string
  created_at: string
  last_used_at?: string
  is_active: boolean
  permissions?: string[]
  expires_at?: string
}

export interface UsageStats {
  total_requests: number
  total_tokens: number
  total_cost: number
  requests_today: number
  tokens_today: number
  cost_today: number
}

export interface GatewayApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface Model {
  id: string
  name: string
  provider: string
  type: string
  [key: string]: unknown
}

export interface User {
  id: string
  email: string
  created_at: string
  [key: string]: unknown
}

export interface SystemStats {
  total_requests: number
  active_users: number
  total_tokens: number
  [key: string]: unknown
}

class GatewayApiClient {
  private baseUrl: string
  private adminApiKey?: string

  constructor() {
    this.baseUrl = GATEWAY_URL
    // Admin API key is only available server-side
    this.adminApiKey = process.env.GATEWAY_ADMIN_API_KEY
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {},
    userApiKey?: string
  ): Promise<GatewayApiResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }

    // Use user API key if provided, otherwise admin key for server-side operations
    const apiKey = userApiKey || this.adminApiKey
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${response.status}: ${response.statusText}`
        }
      }

      return {
        success: true,
        data
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  // Test gateway connectivity
  async testConnection(): Promise<GatewayApiResponse<{ status: string }>> {
    return this.request('/health')
  }

  // Get available AI models
  async getModels(): Promise<GatewayApiResponse<Model[]>> {
    return this.request('/v1/models')
  }

  // API Key Management (requires user authentication)
  async getUserApiKeys(userApiKey: string): Promise<GatewayApiResponse<ApiKey[]>> {
    return this.request('/v1/api-keys', { method: 'GET' }, userApiKey)
  }

  async createApiKey(
    userApiKey: string, 
    data: { name: string; permissions?: string[] }
  ): Promise<GatewayApiResponse<ApiKey>> {
    return this.request('/v1/api-keys', {
      method: 'POST',
      body: JSON.stringify(data)
    }, userApiKey)
  }

  async deleteApiKey(userApiKey: string, keyId: string): Promise<GatewayApiResponse<void>> {
    return this.request(`/v1/api-keys/${keyId}`, { method: 'DELETE' }, userApiKey)
  }

  // Usage Analytics
  async getUsageStats(userApiKey: string): Promise<GatewayApiResponse<UsageStats>> {
    return this.request('/v1/usage/stats', { method: 'GET' }, userApiKey)
  }

  // Admin Operations (server-side only)
  async adminGetAllUsers(): Promise<GatewayApiResponse<User[]>> {
    if (!this.adminApiKey) {
      throw new Error('Admin API key not available - this method is server-side only')
    }
    return this.request('/admin/users')
  }

  async adminGetSystemStats(): Promise<GatewayApiResponse<SystemStats>> {
    if (!this.adminApiKey) {
      throw new Error('Admin API key not available - this method is server-side only')
    }
    return this.request('/admin/stats')
  }
}

export const gatewayApi = new GatewayApiClient()