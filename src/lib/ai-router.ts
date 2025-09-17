import { errorLogger } from '@/utils/errorLogger'

// Core interfaces for the AI Router system
export interface ServiceDefinition {
  id: string
  name: string
  type: ServiceType
  capabilities: ServiceCapabilities
  endpoints: ServiceEndpoint[]
  cost: CostStructure
  limits: ServiceLimits
  metadata: ServiceMetadata
}

export interface ServiceCapabilities {
  supportedFormats: string[]
  maxTokens: number
  supportedLanguages: string[]
  specialFeatures: string[]
  quality: QualityMetrics
}

export interface ServiceEndpoint {
  url: string
  authentication: AuthConfig
  rateLimits: RateLimitConfig
  healthCheck: HealthCheckConfig
}

export interface CostStructure {
  inputTokens: number
  outputTokens: number
  baseCost: number
  currency: string
}

export interface ServiceLimits {
  maxTokens: number
  maxRequestsPerMinute: number
  supportedLanguages: string[]
}

export interface ServiceMetadata {
  provider: string
  version: string
  description: string
  specialFeatures: string[]
}

export interface QualityMetrics {
  relevance: number
  coherence: number
  creativity: number
  accuracy: number
  overall: number
}

export interface AuthConfig {
  type: 'api-key' | 'oauth' | 'bearer'
  key?: string
  token?: string
}

export interface RateLimitConfig {
  requestsPerMinute: number
  tokensPerMinute: number
}

export interface HealthCheckConfig {
  endpoint: string
  interval: number
}

export type ServiceType = 
  | 'blog-writing' 
  | 'outreach' 
  | 'seo' 
  | 'social-media' 
  | 'content-generation'
  | 'code-generation'
  | 'image-generation'

export interface UnifiedRequest {
  prompt: string
  context?: RequestContext
  serviceType?: ServiceType
  preferences?: UserPreferences
  constraints?: RequestConstraints
  options?: RequestOptions
}

export interface RequestContext {
  userId: string
  projectId?: string
  sessionId?: string
  brandVoice?: string
  targetAudience?: string
  previousRequests?: RequestHistory[]
}

export interface UserPreferences {
  preferredServices?: string[]
  costPreference: 'low' | 'balanced' | 'high-quality'
  qualityPreference: 'fast' | 'balanced' | 'best'
  language?: string
  style?: string
}

export interface RequestConstraints {
  maxCost?: number
  maxTokens?: number
  maxResponseTime?: number
  requiredFeatures?: string[]
  excludedServices?: string[]
}

export interface RequestOptions {
  stream?: boolean
  format?: 'json' | 'text' | 'markdown'
  temperature?: number
  maxTokens?: number
  model?: string
}

export interface RequestHistory {
  timestamp: string
  serviceUsed: string
  prompt: string
  response: string
  quality: number
  cost: number
}

export interface UnifiedResponse<T = unknown> {
  success: boolean
  data?: T
  metadata: ResponseMetadata
  alternatives?: AlternativeResponse<T>[]
  error?: ErrorInfo
}

export interface ResponseMetadata {
  serviceUsed: string
  model: string
  responseTime: number
  tokenCount: number
  cost: number
  quality: QualityMetrics
  requestId: string
  timestamp: string
}

export interface AlternativeResponse<T = unknown> {
  service: string
  model: string
  data: T
  confidence: number
  cost: number
}

export interface ErrorInfo {
  code: string
  message: string
  details?: unknown
}

export interface Intent {
  primaryIntent: string
  secondaryIntents: string[]
  requirements: string[]
  constraints: string[]
  quality: number
  cost: number
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  responseTime: number
  errorRate: number
  availability: number
  lastChecked: string
}

export interface ServiceMetrics {
  requestCount: number
  averageResponseTime: number
  errorRate: number
  availability: number
  totalCost: number
  qualityScore: number
  lastUpdated: string
}

// Service Registry for managing available services
export class ServiceRegistry {
  private services: Map<string, ServiceDefinition> = new Map()
  private healthStatus: Map<string, HealthStatus> = new Map()
  private metrics: Map<string, ServiceMetrics> = new Map()

  register(service: ServiceDefinition): void {
    this.services.set(service.id, service)
    this.healthStatus.set(service.id, {
      status: 'healthy',
      responseTime: 0,
      errorRate: 0,
      availability: 100,
      lastChecked: new Date().toISOString()
    })
    this.metrics.set(service.id, {
      requestCount: 0,
      averageResponseTime: 0,
      errorRate: 0,
      availability: 100,
      totalCost: 0,
      qualityScore: service.capabilities.quality.overall,
      lastUpdated: new Date().toISOString()
    })
  }

  listServices(): ServiceDefinition[] {
    return Array.from(this.services.values())
  }

  getService(id: string): ServiceDefinition | undefined {
    return this.services.get(id)
  }

  getServicesByType(type: ServiceType): ServiceDefinition[] {
    return Array.from(this.services.values()).filter(service => service.type === type)
  }

  getHealthyServices(type?: ServiceType): ServiceDefinition[] {
    return Array.from(this.services.values())
      .filter(service => {
        const health = this.healthStatus.get(service.id)
        return health?.status === 'healthy' && (!type || service.type === type)
      })
  }

  updateHealthStatus(serviceId: string, status: HealthStatus): void {
    this.healthStatus.set(serviceId, status)
  }

  updateMetrics(serviceId: string, metrics: Partial<ServiceMetrics>): void {
    const currentMetrics = this.metrics.get(serviceId)
    if (currentMetrics) {
      this.metrics.set(serviceId, { ...currentMetrics, ...metrics })
    }
  }

  getMetrics(serviceId: string): ServiceMetrics | undefined {
    return this.metrics.get(serviceId)
  }
}

// Shared singleton registry
export const sharedServiceRegistry = new ServiceRegistry()

// Intelligent Router for selecting and routing requests
export class IntelligentRouter {
  private serviceRegistry: ServiceRegistry
  private loadBalancer: LoadBalancer
  private costOptimizer: CostOptimizer
  private performanceMonitor: PerformanceMonitor

  constructor(registry: ServiceRegistry = sharedServiceRegistry) {
    this.serviceRegistry = registry
    this.loadBalancer = new LoadBalancer(this.serviceRegistry)
    this.costOptimizer = new CostOptimizer(this.serviceRegistry)
    this.performanceMonitor = new PerformanceMonitor(this.serviceRegistry)
  }

  async routeRequest(request: UnifiedRequest): Promise<UnifiedResponse> {
    try {
      // 1. Analyze request intent
      const intent = await this.analyzeIntent(request)
      
      // 2. Find compatible services
      const compatibleServices = await this.findCompatibleServices(intent, request)
      
      if (compatibleServices.length === 0) {
        return this.createErrorResponse('NO_COMPATIBLE_SERVICES', 'No services available for this request')
      }
      
      // 3. Select best service
      const selectedService = await this.selectService(compatibleServices, request)
      
      // 4. Load balance endpoint selection
      const endpoint = await this.loadBalancer.selectEndpoint(selectedService)
      
      // 5. Execute request
      const startTime = Date.now()
      const response = await this.executeRequest(endpoint, request)
      const responseTime = Date.now() - startTime
      
      // 6. Update metrics
      await this.performanceMonitor.trackRequest(selectedService.id, request, response, responseTime)
      
      // 7. Format response
      return this.formatResponse(response, selectedService, responseTime, request)
      
    } catch (error) {
      errorLogger.logError('Router request failed', {
        component: 'ai-router',
        action: 'routeRequest',
        additionalData: { error: error instanceof Error ? error.message : 'Unknown error' }
      })
      
      return this.createErrorResponse('ROUTING_ERROR', error instanceof Error ? error.message : 'Unknown error')
    }
  }

  private async analyzeIntent(request: UnifiedRequest): Promise<Intent> {
    // Simple intent analysis based on prompt keywords and context
    const prompt = request.prompt.toLowerCase()
    
    // Analyze prompt for intent keywords
    const blogKeywords = ['blog', 'article', 'post', 'content', 'writing']
    const outreachKeywords = ['email', 'message', 'outreach', 'contact', 'follow-up']
    const seoKeywords = ['seo', 'optimize', 'keywords', 'search', 'ranking']
    const socialKeywords = ['social', 'post', 'caption', 'hashtag', 'instagram', 'twitter']
    
    let primaryIntent = 'content-generation'
    let confidence = 0.5
    
    if (blogKeywords.some(keyword => prompt.includes(keyword))) {
      primaryIntent = 'blog-writing'
      confidence = 0.8
    } else if (outreachKeywords.some(keyword => prompt.includes(keyword))) {
      primaryIntent = 'outreach'
      confidence = 0.8
    } else if (seoKeywords.some(keyword => prompt.includes(keyword))) {
      primaryIntent = 'seo'
      confidence = 0.8
    } else if (socialKeywords.some(keyword => prompt.includes(keyword))) {
      primaryIntent = 'social-media'
      confidence = 0.8
    }
    
    return {
      primaryIntent,
      secondaryIntents: [],
      requirements: [],
      constraints: [],
      quality: confidence,
      cost: 1.0
    }
  }

  private async findCompatibleServices(intent: Intent, request: UnifiedRequest): Promise<ServiceDefinition[]> {
    const serviceType = request.serviceType || intent.primaryIntent as ServiceType
    const services = this.serviceRegistry.getHealthyServices(serviceType)
    
    // Filter by constraints
    return services.filter(service => {
      // Check token limits
      if (request.constraints?.maxTokens && service.limits.maxTokens < request.constraints.maxTokens) {
        return false
      }
      
      // Check required features
      if (request.constraints?.requiredFeatures) {
        const hasRequiredFeatures = request.constraints.requiredFeatures.every(feature =>
          service.metadata.specialFeatures.includes(feature)
        )
        if (!hasRequiredFeatures) return false
      }
      
      // Check excluded services
      if (request.constraints?.excludedServices?.includes(service.id)) {
        return false
      }
      
      return true
    })
  }

  private async selectService(services: ServiceDefinition[], request: UnifiedRequest): Promise<ServiceDefinition> {
    if (services.length === 1) return services[0]
    
    // Score services based on multiple criteria
    const scores = await Promise.all(services.map(async (service) => {
      const qualityScore = service.capabilities.quality.overall
      const costScore = await this.calculateCostScore(service, request)
      const performanceScore = await this.calculatePerformanceScore(service)
      const preferenceScore = this.calculatePreferenceScore(service, request)
      
      const totalScore = 
        qualityScore * 0.3 +
        costScore * 0.25 +
        performanceScore * 0.25 +
        preferenceScore * 0.2
      
      return { service, score: totalScore }
    }))
    
    // Return service with highest score
    return scores.sort((a, b) => b.score - a.score)[0].service
  }

  private async calculateCostScore(service: ServiceDefinition, request: UnifiedRequest): Promise<number> {
    const estimatedTokens = this.estimateTokenUsage(request)
    const estimatedCost = estimatedTokens * service.cost.inputTokens + estimatedTokens * service.cost.outputTokens
    
    // Normalize cost (lower is better, so invert)
    return Math.max(0, 1 - estimatedCost / 10) // Assuming max cost of $10 for normalization
  }

  private async calculatePerformanceScore(service: ServiceDefinition): Promise<number> {
    const metrics = this.serviceRegistry.getMetrics(service.id)
    if (!metrics) return 0.5
    
    // Combine response time and availability
    const responseTimeScore = Math.max(0, 1 - metrics.averageResponseTime / 5000) // 5s max
    const availabilityScore = metrics.availability / 100
    
    return (responseTimeScore + availabilityScore) / 2
  }

  private calculatePreferenceScore(service: ServiceDefinition, request: UnifiedRequest): number {
    let score = 0.5
    
    // Check user preferences
    if (request.preferences?.preferredServices?.includes(service.id)) {
      score += 0.3
    }
    
    // Check cost preference
    if (request.preferences?.costPreference === 'low' && service.cost.inputTokens < 0.01) {
      score += 0.2
    } else if (request.preferences?.costPreference === 'high-quality' && service.capabilities.quality.overall > 0.8) {
      score += 0.2
    }
    
    return Math.min(1, score)
  }

  private estimateTokenUsage(request: UnifiedRequest): number {
    // Simple token estimation (4 characters per token average)
    return Math.ceil(request.prompt.length / 4)
  }

  private async executeRequest(endpoint: ServiceEndpoint, request: UnifiedRequest): Promise<unknown> {
    const response = await fetch(endpoint.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${endpoint.authentication.key}`,
      },
      body: JSON.stringify({
        prompt: request.prompt,
        context: request.context,
        options: request.options
      })
    })
    
    if (!response.ok) {
      throw new Error(`Service request failed: ${response.statusText}`)
    }
    
    return await response.json()
  }

  private formatResponse(
    response: unknown, 
    service: ServiceDefinition, 
    responseTime: number, 
    request: UnifiedRequest
  ): UnifiedResponse<unknown> {
    const estimatedTokens = this.estimateTokenUsage(request)
    const estimatedCost = estimatedTokens * service.cost.inputTokens + estimatedTokens * service.cost.outputTokens
    
    return {
      success: true,
      data: response,
      metadata: {
        serviceUsed: service.id,
        model: service.name,
        responseTime,
        tokenCount: estimatedTokens,
        cost: estimatedCost,
        quality: service.capabilities.quality,
        requestId: this.generateRequestId(),
        timestamp: new Date().toISOString()
      }
    }
  }

  private createErrorResponse(code: string, message: string): UnifiedResponse<unknown> {
    return {
      success: false,
      error: { code, message },
      metadata: {
        serviceUsed: '',
        model: '',
        responseTime: 0,
        tokenCount: 0,
        cost: 0,
        quality: { relevance: 0, coherence: 0, creativity: 0, accuracy: 0, overall: 0 },
        requestId: this.generateRequestId(),
        timestamp: new Date().toISOString()
      }
    }
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

// Load Balancer for distributing requests across service instances
export class LoadBalancer {
  constructor(private serviceRegistry: ServiceRegistry) {}

  async selectEndpoint(service: ServiceDefinition): Promise<ServiceEndpoint> {
    // Simple round-robin selection
    const healthyEndpoints = service.endpoints.filter(endpoint => 
      this.isEndpointHealthy(service.id, endpoint)
    )
    
    if (healthyEndpoints.length === 0) {
      throw new Error(`No healthy endpoints available for service ${service.id}`)
    }
    
    // Simple round-robin (in production, use proper load balancing)
    const index = Math.floor(Math.random() * healthyEndpoints.length)
    return healthyEndpoints[index]
  }

  private isEndpointHealthy(serviceId: string, endpoint: ServiceEndpoint): boolean {
    // Reference params to satisfy no-unused-vars while keeping signature
    void serviceId
    void endpoint
    // Simple health check - in production, implement proper health checking
    return true
  }
}

// Cost Optimizer for selecting cost-effective services
export class CostOptimizer {
  constructor(private serviceRegistry: ServiceRegistry) {}

  async optimizeCost(services: ServiceDefinition[], request: UnifiedRequest): Promise<ServiceDefinition> {
    const costs = services.map(service => {
      const estimatedTokens = this.estimateTokenUsage(request)
      const cost = estimatedTokens * service.cost.inputTokens + estimatedTokens * service.cost.outputTokens
      const efficiency = service.capabilities.quality.overall / cost
      
      return { service, cost, efficiency, valueScore: efficiency / cost }
    })
    
    return costs.sort((a, b) => b.valueScore - a.valueScore)[0].service
  }

  private estimateTokenUsage(request: UnifiedRequest): number {
    return Math.ceil(request.prompt.length / 4)
  }
}

// Performance Monitor for tracking service performance
export class PerformanceMonitor {
  constructor(private serviceRegistry: ServiceRegistry) {}

  async trackRequest(
    serviceId: string, 
    request: UnifiedRequest, 
    response: unknown, 
    responseTime: number
  ): Promise<void> {
    const currentMetrics = this.serviceRegistry.getMetrics(serviceId)
    if (!currentMetrics) return
    
    const newMetrics: Partial<ServiceMetrics> = {
      requestCount: currentMetrics.requestCount + 1,
      averageResponseTime: (currentMetrics.averageResponseTime + responseTime) / 2,
      totalCost: currentMetrics.totalCost + this.calculateCost(request),
      lastUpdated: new Date().toISOString()
    }
    
    this.serviceRegistry.updateMetrics(serviceId, newMetrics)
  }

  private calculateCost(request: UnifiedRequest): number {
    // Simple cost calculation
    return this.estimateTokenUsage(request) * 0.001 // $0.001 per token
  }

  private estimateTokenUsage(request: UnifiedRequest): number {
    return Math.ceil(request.prompt.length / 4)
  }
}

// Blog Writer Service Definition
const blogWriterService: ServiceDefinition = {
  id: 'blog-writer-api',
  name: 'AI Blog Writer API',
  type: 'blog-writing',
  capabilities: {
    supportedFormats: ['text', 'markdown', 'html'],
    maxTokens: 4000,
    supportedLanguages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko'],
    specialFeatures: ['seo-optimization', 'outline-generation', 'keyword-integration', 'tone-adaptation'],
    quality: {
      relevance: 0.9,
      coherence: 0.85,
      creativity: 0.8,
      accuracy: 0.9,
      overall: 0.86
    }
  },
  endpoints: [{
    url: process.env.NEXT_PUBLIC_BLOG_WRITER_API_URL || 'https://api-ai-blog-writer-613248238610.us-central1.run.app',
    authentication: {
      type: 'api-key',
      key: process.env.BLOG_WRITER_API_KEY
    },
    rateLimits: {
      requestsPerMinute: 60,
      tokensPerMinute: 100000
    },
    healthCheck: {
      endpoint: '/health',
      interval: 30000
    }
  }],
  cost: {
    inputTokens: 0.001,
    outputTokens: 0.002,
    baseCost: 0.01,
    currency: 'USD'
  },
  limits: {
    maxTokens: 4000,
    maxRequestsPerMinute: 60,
    supportedLanguages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko']
  },
  metadata: {
    provider: 'AI Blog Writer Service',
    version: '1.0.0',
    description: 'Specialized AI service for generating high-quality blog posts with SEO optimization',
    specialFeatures: ['seo-optimization', 'outline-generation', 'keyword-integration', 'tone-adaptation']
  }
}

// Register the blog writer service
sharedServiceRegistry.register(blogWriterService)
// Export singleton instance using shared registry
export const aiRouter = new IntelligentRouter(sharedServiceRegistry)
