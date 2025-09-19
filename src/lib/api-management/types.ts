// API Management System Types
// This file defines the core types for managing multiple API providers

export interface ApiProvider {
  id: string
  name: string
  type: ApiProviderType
  environments: ApiEnvironment[]
  credentials: ApiCredentials
  capabilities: ApiCapabilities
  limits: ApiLimits
  metadata: ApiMetadata
  status: ApiStatus
  createdAt: string
  updatedAt: string
}

export interface ApiEnvironment {
  id: string
  name: string
  baseUrl: string
  isActive: boolean
  priority: number
  healthCheck: HealthCheckConfig
  rateLimits: RateLimitConfig
  timeout: number
  retryAttempts: number
  lastHealthCheck?: string
  healthStatus: 'healthy' | 'degraded' | 'unhealthy'
}

export interface ApiCredentials {
  apiKey?: string
  secretKey?: string
  bearerToken?: string
  oauthConfig?: OAuthConfig
  customHeaders?: Record<string, string>
  encrypted: boolean
}

export interface OAuthConfig {
  clientId: string
  clientSecret: string
  tokenUrl: string
  scope?: string[]
  grantType: 'client_credentials' | 'authorization_code'
}

export interface ApiCapabilities {
  supportedEndpoints: string[]
  supportedFormats: string[]
  maxTokens: number
  supportedLanguages: string[]
  specialFeatures: string[]
  quality: QualityMetrics
}

export interface ApiLimits {
  maxRequestsPerMinute: number
  maxRequestsPerHour: number
  maxRequestsPerDay: number
  maxTokensPerRequest: number
  maxConcurrentRequests: number
  costPerToken: number
  currency: string
}

export interface ApiMetadata {
  provider: string
  version: string
  description: string
  documentation: string
  supportContact: string
  tags: string[]
}

export interface ApiStatus {
  isActive: boolean
  lastHealthCheck: string
  healthStatus: 'healthy' | 'degraded' | 'unhealthy'
  errorRate: number
  averageResponseTime: number
  totalRequests: number
  successfulRequests: number
  failedRequests: number
}

export interface HealthCheckConfig {
  endpoint: string
  interval: number
  timeout: number
  expectedStatus: number
  expectedResponse?: Record<string, unknown>
}

export interface RateLimitConfig {
  requestsPerMinute: number
  requestsPerHour: number
  requestsPerDay: number
  burstLimit: number
}

export interface QualityMetrics {
  relevance: number
  coherence: number
  creativity: number
  accuracy: number
  overall: number
}

export type ApiProviderType = 
  | 'blog-writing'
  | 'content-generation'
  | 'seo-optimization'
  | 'keyword-research'
  | 'outreach'
  | 'social-media'
  | 'code-generation'
  | 'image-generation'
  | 'video-generation'
  | 'translation'
  | 'summarization'

export interface ApiRequest {
  id: string
  providerId: string
  environmentId: string
  endpoint: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers: Record<string, string>
  body?: unknown
  queryParams?: Record<string, string>
  timestamp: string
  userId: string
  apiKeyId?: string
}

export interface ApiResponse {
  id: string
  requestId: string
  statusCode: number
  headers: Record<string, string>
  body: unknown
  responseTime: number
  timestamp: string
  success: boolean
  error?: string
}

export interface ApiUsage {
  id: string
  providerId: string
  environmentId: string
  userId: string
  apiKeyId?: string
  endpoint: string
  method: string
  requestCount: number
  tokenCount: number
  cost: number
  successCount: number
  errorCount: number
  averageResponseTime: number
  period: 'minute' | 'hour' | 'day' | 'month'
  timestamp: string
}

export interface ApiAssignment {
  id: string
  name: string
  description: string
  userId: string
  providerIds: string[]
  environmentIds: string[]
  loadBalancingStrategy: LoadBalancingStrategy
  failoverStrategy: FailoverStrategy
  rateLimits: RateLimitConfig
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface LoadBalancingStrategy {
  type: 'round-robin' | 'weighted' | 'least-connections' | 'random' | 'health-based'
  weights?: Record<string, number>
  healthThreshold?: number
}

export interface FailoverStrategy {
  type: 'immediate' | 'delayed' | 'circuit-breaker'
  delayMs?: number
  failureThreshold?: number
  recoveryTimeout?: number
}

export interface ApiKey {
  id: string
  name: string
  key: string
  keyPrefix: string
  userId: string
  providerIds: string[]
  environmentIds: string[]
  permissions: string[]
  rateLimits: RateLimitConfig
  isActive: boolean
  expiresAt?: string
  lastUsedAt?: string
  createdAt: string
  updatedAt: string
}

export interface ApiAnalytics {
  providerId: string
  environmentId: string
  period: 'hour' | 'day' | 'week' | 'month'
  metrics: {
    totalRequests: number
    successfulRequests: number
    failedRequests: number
    averageResponseTime: number
    totalCost: number
    totalTokens: number
    errorRate: number
    availability: number
  }
  breakdown: {
    byEndpoint: Record<string, number>
    byUser: Record<string, number>
    byApiKey: Record<string, number>
    byError: Record<string, number>
  }
  timestamp: string
}

export interface ApiConfiguration {
  id: string
  providerId: string
  environmentId: string
  config: Record<string, unknown>
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ApiError {
  id: string
  providerId: string
  environmentId: string
  requestId: string
  errorCode: string
  errorMessage: string
  stackTrace?: string
  timestamp: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  resolved: boolean
  resolvedAt?: string
  resolvedBy?: string
}

// Request/Response types for API management endpoints
export interface CreateApiProviderRequest {
  name: string
  type: ApiProviderType
  environments: Omit<ApiEnvironment, 'id' | 'lastHealthCheck' | 'healthStatus'>[]
  credentials: Omit<ApiCredentials, 'encrypted'>
  capabilities: ApiCapabilities
  limits: ApiLimits
  metadata: ApiMetadata
}

export interface UpdateApiProviderRequest {
  name?: string
  environments?: Partial<ApiEnvironment>[]
  credentials?: Partial<Omit<ApiCredentials, 'encrypted'>>
  capabilities?: Partial<ApiCapabilities>
  limits?: Partial<ApiLimits>
  metadata?: Partial<ApiMetadata>
}

export interface CreateApiKeyRequest {
  name: string
  providerIds: string[]
  environmentIds: string[]
  permissions: string[]
  rateLimits: RateLimitConfig
  expiresAt?: string
}

export interface CreateApiAssignmentRequest {
  name: string
  description: string
  providerIds: string[]
  environmentIds: string[]
  loadBalancingStrategy: LoadBalancingStrategy
  failoverStrategy: FailoverStrategy
  rateLimits: RateLimitConfig
}

export interface ApiManagementResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// Blog Writer specific types
export interface BlogWriterProvider extends ApiProvider {
  type: 'blog-writing'
  capabilities: BlogWriterCapabilities
}

export interface BlogWriterCapabilities extends ApiCapabilities {
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
  ]
  supportedFormats: ['text', 'markdown', 'html', 'json']
  specialFeatures: [
    'seo-optimization',
    'outline-generation',
    'keyword-integration',
    'tone-adaptation',
    'content-analysis',
    'keyword-research'
  ]
}

export interface BlogWriterRequest {
  topic: string
  keywords?: string[]
  tone?: 'professional' | 'casual' | 'friendly' | 'authoritative' | 'conversational'
  length?: 'short' | 'medium' | 'long'
  target_audience?: string
  include_outline?: boolean
  language?: string
  style?: string
  additional_instructions?: string
  seo_optimization?: boolean
  keyword_density?: number
  readability_level?: 'beginner' | 'intermediate' | 'advanced'
}

export interface BlogWriterResponse {
  title: string
  content: string
  outline?: string[]
  keywords_used: string[]
  word_count: number
  estimated_reading_time: number
  seo_score?: number
  readability_score?: number
  metadata: {
    generated_at: string
    model_used: string
    processing_time: number
    provider_used: string
    environment_used: string
  }
}
