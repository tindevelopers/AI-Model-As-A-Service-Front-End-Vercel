import { errorLogger } from '@/utils/errorLogger'
import {
  ApiProvider,
  ApiEnvironment,
  ApiRequest,
  ApiResponse,
  ApiUsage,
  ApiAssignment,
  ApiKey,
  ApiAnalytics,
  ApiConfiguration,
  ApiError,
  CreateApiProviderRequest,
  UpdateApiProviderRequest,
  CreateApiKeyRequest,
  CreateApiAssignmentRequest,
  ApiManagementResponse,
  PaginatedResponse,
  LoadBalancingStrategy,
  FailoverStrategy,
  ApiProviderType,
  BlogWriterProvider,
  BlogWriterCapabilities
} from './types'

// API Management Service
export class ApiManager {
  private providers: Map<string, ApiProvider> = new Map()
  private assignments: Map<string, ApiAssignment> = new Map()
  private apiKeys: Map<string, ApiKey> = new Map()
  private configurations: Map<string, ApiConfiguration> = new Map()
  private usage: Map<string, ApiUsage> = new Map()
  private errors: Map<string, ApiError> = new Map()
  private healthCheckIntervals: Map<string, NodeJS.Timeout> = new Map()

  constructor() {
    this.initializeDefaultProviders()
    this.startHealthChecks()
  }

  // Provider Management
  async createProvider(request: CreateApiProviderRequest): Promise<ApiManagementResponse<ApiProvider>> {
    try {
      const provider: ApiProvider = {
        id: this.generateId(),
        name: request.name,
        type: request.type,
        environments: request.environments.map(env => ({
          ...env,
          id: this.generateId(),
          lastHealthCheck: new Date().toISOString(),
          healthStatus: 'unhealthy' as const
        })),
        credentials: {
          ...request.credentials,
          encrypted: true
        },
        capabilities: request.capabilities,
        limits: request.limits,
        metadata: request.metadata,
        status: {
          isActive: true,
          lastHealthCheck: new Date().toISOString(),
          healthStatus: 'unhealthy',
          errorRate: 0,
          averageResponseTime: 0,
          totalRequests: 0,
          successfulRequests: 0,
          failedRequests: 0
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      this.providers.set(provider.id, provider)
      this.startProviderHealthCheck(provider.id)

      errorLogger.logSuccess('API provider created', {
        component: 'api-manager',
        action: 'createProvider',
        additionalData: {
          providerId: provider.id,
          providerName: provider.name,
          providerType: provider.type,
          environmentCount: provider.environments.length
        }
      })

      return {
        success: true,
        data: provider,
        message: 'Provider created successfully',
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      errorLogger.logError('Failed to create API provider', {
        component: 'api-manager',
        action: 'createProvider',
        additionalData: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      })

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create provider',
        timestamp: new Date().toISOString()
      }
    }
  }

  async updateProvider(providerId: string, request: UpdateApiProviderRequest): Promise<ApiManagementResponse<ApiProvider>> {
    try {
      const provider = this.providers.get(providerId)
      if (!provider) {
        return {
          success: false,
          error: 'Provider not found',
          timestamp: new Date().toISOString()
        }
      }

      const updatedProvider: ApiProvider = {
        ...provider,
        ...request,
        updatedAt: new Date().toISOString()
      }

      this.providers.set(providerId, updatedProvider)

      errorLogger.logSuccess('API provider updated', {
        component: 'api-manager',
        action: 'updateProvider',
        additionalData: {
          providerId,
          providerName: updatedProvider.name
        }
      })

      return {
        success: true,
        data: updatedProvider,
        message: 'Provider updated successfully',
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      errorLogger.logError('Failed to update API provider', {
        component: 'api-manager',
        action: 'updateProvider',
        additionalData: {
          providerId,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      })

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update provider',
        timestamp: new Date().toISOString()
      }
    }
  }

  async deleteProvider(providerId: string): Promise<ApiManagementResponse<void>> {
    try {
      const provider = this.providers.get(providerId)
      if (!provider) {
        return {
          success: false,
          error: 'Provider not found',
          timestamp: new Date().toISOString()
        }
      }

      // Stop health checks
      this.stopProviderHealthCheck(providerId)

      // Remove provider
      this.providers.delete(providerId)

      errorLogger.logSuccess('API provider deleted', {
        component: 'api-manager',
        action: 'deleteProvider',
        additionalData: {
          providerId,
          providerName: provider.name
        }
      })

      return {
        success: true,
        message: 'Provider deleted successfully',
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      errorLogger.logError('Failed to delete API provider', {
        component: 'api-manager',
        action: 'deleteProvider',
        additionalData: {
          providerId,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      })

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete provider',
        timestamp: new Date().toISOString()
      }
    }
  }

  async getProvider(providerId: string): Promise<ApiManagementResponse<ApiProvider>> {
    const provider = this.providers.get(providerId)
    if (!provider) {
      return {
        success: false,
        error: 'Provider not found',
        timestamp: new Date().toISOString()
      }
    }

    return {
      success: true,
      data: provider,
      timestamp: new Date().toISOString()
    }
  }

  async listProviders(type?: ApiProviderType): Promise<ApiManagementResponse<ApiProvider[]>> {
    const providers = Array.from(this.providers.values())
    const filteredProviders = type ? providers.filter(p => p.type === type) : providers

    return {
      success: true,
      data: filteredProviders,
      timestamp: new Date().toISOString()
    }
  }

  // API Key Management
  async createApiKey(userId: string, request: CreateApiKeyRequest): Promise<ApiManagementResponse<ApiKey>> {
    try {
      const apiKey: ApiKey = {
        id: this.generateId(),
        name: request.name,
        key: this.generateApiKey(),
        keyPrefix: this.generateKeyPrefix(),
        userId,
        providerIds: request.providerIds,
        environmentIds: request.environmentIds,
        permissions: request.permissions,
        rateLimits: request.rateLimits,
        isActive: true,
        expiresAt: request.expiresAt,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      this.apiKeys.set(apiKey.id, apiKey)

      errorLogger.logSuccess('API key created', {
        component: 'api-manager',
        action: 'createApiKey',
        additionalData: {
          apiKeyId: apiKey.id,
          userId,
          providerCount: request.providerIds.length
        }
      })

      return {
        success: true,
        data: apiKey,
        message: 'API key created successfully',
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      errorLogger.logError('Failed to create API key', {
        component: 'api-manager',
        action: 'createApiKey',
        additionalData: {
          userId,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      })

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create API key',
        timestamp: new Date().toISOString()
      }
    }
  }

  async getApiKey(apiKeyId: string): Promise<ApiManagementResponse<ApiKey>> {
    const apiKey = this.apiKeys.get(apiKeyId)
    if (!apiKey) {
      return {
        success: false,
        error: 'API key not found',
        timestamp: new Date().toISOString()
      }
    }

    return {
      success: true,
      data: apiKey,
      timestamp: new Date().toISOString()
    }
  }

  async listApiKeys(userId: string): Promise<ApiManagementResponse<ApiKey[]>> {
    const userApiKeys = Array.from(this.apiKeys.values()).filter(key => key.userId === userId)

    return {
      success: true,
      data: userApiKeys,
      timestamp: new Date().toISOString()
    }
  }

  // Assignment Management
  async createAssignment(userId: string, request: CreateApiAssignmentRequest): Promise<ApiManagementResponse<ApiAssignment>> {
    try {
      const assignment: ApiAssignment = {
        id: this.generateId(),
        name: request.name,
        description: request.description,
        userId,
        providerIds: request.providerIds,
        environmentIds: request.environmentIds,
        loadBalancingStrategy: request.loadBalancingStrategy,
        failoverStrategy: request.failoverStrategy,
        rateLimits: request.rateLimits,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      this.assignments.set(assignment.id, assignment)

      errorLogger.logSuccess('API assignment created', {
        component: 'api-manager',
        action: 'createAssignment',
        additionalData: {
          assignmentId: assignment.id,
          userId,
          providerCount: request.providerIds.length
        }
      })

      return {
        success: true,
        data: assignment,
        message: 'Assignment created successfully',
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      errorLogger.logError('Failed to create API assignment', {
        component: 'api-manager',
        action: 'createAssignment',
        additionalData: {
          userId,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      })

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create assignment',
        timestamp: new Date().toISOString()
      }
    }
  }

  // Request Routing
  async routeRequest(
    request: ApiRequest,
    assignmentId?: string
  ): Promise<ApiManagementResponse<ApiResponse>> {
    try {
      const startTime = Date.now()

      // Get assignment or use default routing
      let assignment: ApiAssignment | undefined
      if (assignmentId) {
        assignment = this.assignments.get(assignmentId)
      }

      // Select provider and environment
      const { provider, environment } = await this.selectProviderAndEnvironment(
        request.providerId,
        assignment
      )

      if (!provider || !environment) {
        return {
          success: false,
          error: 'No available provider or environment',
          timestamp: new Date().toISOString()
        }
      }

      // Execute request
      const response = await this.executeRequest(request, provider, environment)
      const responseTime = Date.now() - startTime

      // Update usage statistics
      await this.updateUsageStats(provider.id, environment.id, request, response, responseTime)

      // Update provider status
      await this.updateProviderStatus(provider.id, response.success, responseTime)

      return {
        success: true,
        data: response,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      errorLogger.logError('Request routing failed', {
        component: 'api-manager',
        action: 'routeRequest',
        additionalData: {
          requestId: request.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      })

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Request routing failed',
        timestamp: new Date().toISOString()
      }
    }
  }

  // Health Monitoring
  private async startHealthChecks(): Promise<void> {
    for (const [providerId] of this.providers) {
      this.startProviderHealthCheck(providerId)
    }
  }

  private startProviderHealthCheck(providerId: string): void {
    const provider = this.providers.get(providerId)
    if (!provider) return

    const interval = setInterval(async () => {
      await this.performHealthCheck(providerId)
    }, 30000) // Check every 30 seconds

    this.healthCheckIntervals.set(providerId, interval)
  }

  private stopProviderHealthCheck(providerId: string): void {
    const interval = this.healthCheckIntervals.get(providerId)
    if (interval) {
      clearInterval(interval)
      this.healthCheckIntervals.delete(providerId)
    }
  }

  private async performHealthCheck(providerId: string): Promise<void> {
    const provider = this.providers.get(providerId)
    if (!provider) return

    for (const environment of provider.environments) {
      try {
        const startTime = Date.now()
        const response = await fetch(`${environment.baseUrl}${environment.healthCheck.endpoint}`, {
          method: 'GET',
          timeout: environment.healthCheck.timeout
        })
        const responseTime = Date.now() - startTime

        const isHealthy = response.ok && response.status === environment.healthCheck.expectedStatus
        environment.healthStatus = isHealthy ? 'healthy' : 'unhealthy'
        environment.lastHealthCheck = new Date().toISOString()

        // Update provider status
        provider.status.lastHealthCheck = new Date().toISOString()
        provider.status.healthStatus = isHealthy ? 'healthy' : 'unhealthy'
        provider.status.averageResponseTime = responseTime

        this.providers.set(providerId, provider)
      } catch (error) {
        environment.healthStatus = 'unhealthy'
        environment.lastHealthCheck = new Date().toISOString()

        provider.status.healthStatus = 'unhealthy'
        provider.status.lastHealthCheck = new Date().toISOString()

        this.providers.set(providerId, provider)

        errorLogger.logError('Health check failed', {
          component: 'api-manager',
          action: 'performHealthCheck',
          additionalData: {
            providerId,
            environmentId: environment.id,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        })
      }
    }
  }

  // Private helper methods
  private async selectProviderAndEnvironment(
    preferredProviderId?: string,
    assignment?: ApiAssignment
  ): Promise<{ provider?: ApiProvider; environment?: ApiEnvironment }> {
    let providers: ApiProvider[] = []

    if (assignment) {
      providers = Array.from(this.providers.values()).filter(p => 
        assignment.providerIds.includes(p.id) && p.status.isActive
      )
    } else if (preferredProviderId) {
      const provider = this.providers.get(preferredProviderId)
      if (provider && provider.status.isActive) {
        providers = [provider]
      }
    } else {
      providers = Array.from(this.providers.values()).filter(p => p.status.isActive)
    }

    if (providers.length === 0) {
      return {}
    }

    // Select provider based on load balancing strategy
    const selectedProvider = this.selectProvider(providers, assignment?.loadBalancingStrategy)

    // Select environment
    const healthyEnvironments = selectedProvider.environments.filter(env => 
      env.isActive && env.healthStatus === 'healthy'
    )

    if (healthyEnvironments.length === 0) {
      return { provider: selectedProvider }
    }

    const selectedEnvironment = this.selectEnvironment(healthyEnvironments, assignment?.loadBalancingStrategy)

    return { provider: selectedProvider, environment: selectedEnvironment }
  }

  private selectProvider(providers: ApiProvider[], strategy?: LoadBalancingStrategy): ApiProvider {
    if (providers.length === 1) return providers[0]

    switch (strategy?.type || 'round-robin') {
      case 'random':
        return providers[Math.floor(Math.random() * providers.length)]
      case 'health-based':
        return providers.reduce((best, current) => 
          current.status.healthStatus === 'healthy' && 
          current.status.averageResponseTime < best.status.averageResponseTime 
            ? current : best
        )
      default:
        return providers[0] // Simple round-robin
    }
  }

  private selectEnvironment(environments: ApiEnvironment[], strategy?: LoadBalancingStrategy): ApiEnvironment {
    if (environments.length === 1) return environments[0]

    // Sort by priority (lower number = higher priority)
    const sortedEnvironments = environments.sort((a, b) => a.priority - b.priority)
    return sortedEnvironments[0]
  }

  private async executeRequest(
    request: ApiRequest,
    provider: ApiProvider,
    environment: ApiEnvironment
  ): Promise<ApiResponse> {
    const startTime = Date.now()
    const url = `${environment.baseUrl}${request.endpoint}`

    try {
      const response = await fetch(url, {
        method: request.method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${provider.credentials.apiKey}`,
          ...request.headers
        },
        body: request.body ? JSON.stringify(request.body) : undefined
      })

      const responseTime = Date.now() - startTime
      const responseBody = await response.json()

      return {
        id: this.generateId(),
        requestId: request.id,
        statusCode: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseBody,
        responseTime,
        timestamp: new Date().toISOString(),
        success: response.ok
      }
    } catch (error) {
      const responseTime = Date.now() - startTime

      return {
        id: this.generateId(),
        requestId: request.id,
        statusCode: 0,
        headers: {},
        body: null,
        responseTime,
        timestamp: new Date().toISOString(),
        success: false,
        error: error instanceof Error ? error.message : 'Request failed'
      }
    }
  }

  private async updateUsageStats(
    providerId: string,
    environmentId: string,
    request: ApiRequest,
    response: ApiResponse,
    responseTime: number
  ): Promise<void> {
    const usageKey = `${providerId}-${environmentId}-${request.userId}`
    const existingUsage = this.usage.get(usageKey)

    const usage: ApiUsage = {
      id: usageKey,
      providerId,
      environmentId,
      userId: request.userId,
      apiKeyId: request.apiKeyId,
      endpoint: request.endpoint,
      method: request.method,
      requestCount: (existingUsage?.requestCount || 0) + 1,
      tokenCount: (existingUsage?.tokenCount || 0) + this.estimateTokenCount(request, response),
      cost: (existingUsage?.cost || 0) + this.calculateCost(request, response),
      successCount: (existingUsage?.successCount || 0) + (response.success ? 1 : 0),
      errorCount: (existingUsage?.errorCount || 0) + (response.success ? 0 : 1),
      averageResponseTime: this.calculateAverageResponseTime(
        existingUsage?.averageResponseTime || 0,
        responseTime,
        existingUsage?.requestCount || 0
      ),
      period: 'minute',
      timestamp: new Date().toISOString()
    }

    this.usage.set(usageKey, usage)
  }

  private async updateProviderStatus(
    providerId: string,
    success: boolean,
    responseTime: number
  ): Promise<void> {
    const provider = this.providers.get(providerId)
    if (!provider) return

    provider.status.totalRequests++
    if (success) {
      provider.status.successfulRequests++
    } else {
      provider.status.failedRequests++
    }

    provider.status.errorRate = provider.status.failedRequests / provider.status.totalRequests
    provider.status.averageResponseTime = this.calculateAverageResponseTime(
      provider.status.averageResponseTime,
      responseTime,
      provider.status.totalRequests - 1
    )

    this.providers.set(providerId, provider)
  }

  private estimateTokenCount(request: ApiRequest, response: ApiResponse): number {
    // Simple token estimation (4 characters per token average)
    const requestTokens = Math.ceil(JSON.stringify(request.body || '').length / 4)
    const responseTokens = Math.ceil(JSON.stringify(response.body || '').length / 4)
    return requestTokens + responseTokens
  }

  private calculateCost(request: ApiRequest, response: ApiResponse): number {
    // Simple cost calculation - in production, use actual provider pricing
    const tokenCount = this.estimateTokenCount(request, response)
    return tokenCount * 0.001 // $0.001 per token
  }

  private calculateAverageResponseTime(
    currentAverage: number,
    newResponseTime: number,
    requestCount: number
  ): number {
    if (requestCount === 0) return newResponseTime
    return (currentAverage * requestCount + newResponseTime) / (requestCount + 1)
  }

  private generateId(): string {
    return `api_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateApiKey(): string {
    return `ak_${Math.random().toString(36).substr(2, 32)}`
  }

  private generateKeyPrefix(): string {
    return `ak_${Math.random().toString(36).substr(2, 8)}`
  }

  // Initialize default providers
  private initializeDefaultProviders(): void {
    // Initialize Blog Writer providers for different environments
    const blogWriterDev: BlogWriterProvider = {
      id: 'blog-writer-dev',
      name: 'Blog Writer API - Development',
      type: 'blog-writing',
      environments: [{
        id: 'blog-writer-dev-eu',
        name: 'Europe West 1',
        baseUrl: 'https://api-ai-blog-writer-dev-613248238610.europe-west1.run.app',
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
        retryAttempts: 3,
        lastHealthCheck: new Date().toISOString(),
        healthStatus: 'unhealthy'
      }],
      credentials: {
        apiKey: process.env.BLOG_WRITER_DEV_API_KEY,
        encrypted: true
      },
      capabilities: {
        supportedEndpoints: [
          '/api/v1/generate',
          '/api/v1/generate/v2',
          '/api/v1/analyze',
          '/api/v1/seo/optimize',
          '/api/v1/keywords/analyze',
          '/api/v1/keywords/extract',
          '/api/v1/keywords/suggest',
          '/health',
          '/ready'
        ],
        supportedFormats: ['text', 'markdown', 'html', 'json'],
        maxTokens: 4000,
        supportedLanguages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko'],
        specialFeatures: [
          'seo-optimization',
          'outline-generation',
          'keyword-integration',
          'tone-adaptation',
          'content-analysis',
          'keyword-research'
        ],
        quality: {
          relevance: 0.9,
          coherence: 0.85,
          creativity: 0.8,
          accuracy: 0.9,
          overall: 0.86
        }
      } as BlogWriterCapabilities,
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
        provider: 'AI Blog Writer Service',
        version: '1.0.0',
        description: 'Specialized AI service for generating high-quality blog posts with SEO optimization',
        documentation: 'https://api-ai-blog-writer-dev-613248238610.europe-west1.run.app/docs',
        supportContact: 'support@example.com',
        tags: ['blog-writing', 'seo', 'content-generation']
      },
      status: {
        isActive: true,
        lastHealthCheck: new Date().toISOString(),
        healthStatus: 'unhealthy',
        errorRate: 0,
        averageResponseTime: 0,
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const blogWriterStaging: BlogWriterProvider = {
      ...blogWriterDev,
      id: 'blog-writer-staging',
      name: 'Blog Writer API - Staging',
      environments: [{
        ...blogWriterDev.environments[0],
        id: 'blog-writer-staging-us',
        name: 'US East 1',
        baseUrl: 'https://api-ai-blog-writer-staging-613248238610.us-east1.run.app'
      }],
      credentials: {
        apiKey: process.env.BLOG_WRITER_STAGING_API_KEY,
        encrypted: true
      }
    }

    const blogWriterProd: BlogWriterProvider = {
      ...blogWriterDev,
      id: 'blog-writer-prod',
      name: 'Blog Writer API - Production',
      environments: [{
        ...blogWriterDev.environments[0],
        id: 'blog-writer-prod-us',
        name: 'US Central 1',
        baseUrl: 'https://api-ai-blog-writer-613248238610.us-central1.run.app'
      }],
      credentials: {
        apiKey: process.env.BLOG_WRITER_PROD_API_KEY,
        encrypted: true
      }
    }

    this.providers.set(blogWriterDev.id, blogWriterDev)
    this.providers.set(blogWriterStaging.id, blogWriterStaging)
    this.providers.set(blogWriterProd.id, blogWriterProd)
  }
}

// Export singleton instance
export const apiManager = new ApiManager()
