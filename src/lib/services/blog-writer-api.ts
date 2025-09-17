import { errorLogger } from '@/utils/errorLogger'

// Blog Writer API Configuration
export interface BlogWriterConfig {
  baseUrl: string
  apiKey?: string
  timeout?: number
  retryAttempts?: number
}

// Blog Writer API Request/Response Types
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
}

export interface BlogWriterResponse {
  title: string
  content: string
  outline?: string[]
  keywords_used: string[]
  word_count: number
  estimated_reading_time: number
  seo_score?: number
  metadata: {
    generated_at: string
    model_used: string
    processing_time: number
  }
}

export interface BlogWriterError {
  error: string
  message: string
  code?: string
  details?: unknown
}

// Blog Writer API Client
export class BlogWriterApiClient {
  private config: BlogWriterConfig
  private defaultTimeout = 30000
  private defaultRetryAttempts = 3

  constructor(config: BlogWriterConfig) {
    this.config = {
      timeout: this.defaultTimeout,
      retryAttempts: this.defaultRetryAttempts,
      ...config
    }
  }

  /**
   * Generate a blog post using the blog writer API
   */
  async generateBlogPost(request: BlogWriterRequest): Promise<BlogWriterResponse> {
    const startTime = Date.now()
    
    try {
      const response = await this.makeRequest('/generate', {
        method: 'POST',
        body: JSON.stringify(request)
      })

      const processingTime = Date.now() - startTime
      
      // Add processing time to response metadata
      if (response && typeof response === 'object' && 'metadata' in response) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (response as any).metadata.processing_time = processingTime
      }

      errorLogger.logSuccess('Blog post generated successfully', {
        component: 'blog-writer-api',
        action: 'generateBlogPost',
        additionalData: {
          topic: request.topic,
          wordCount: response.word_count,
          processingTime,
          hasOutline: !!response.outline
        }
      })

      return response
    } catch (error) {
      const processingTime = Date.now() - startTime
      
      errorLogger.logError('Blog post generation failed', {
        component: 'blog-writer-api',
        action: 'generateBlogPost',
        additionalData: {
          topic: request.topic,
          processingTime,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      })

      throw error
    }
  }

  /**
   * Get available models/options from the API
   */
  async getAvailableOptions(): Promise<{
    tones: string[]
    lengths: string[]
    languages: string[]
    styles: string[]
  }> {
    try {
      const response = await this.makeRequest('/options', {
        method: 'GET'
      })

      return response
    } catch (error) {
      errorLogger.logError('Failed to get available options', {
        component: 'blog-writer-api',
        action: 'getAvailableOptions',
        additionalData: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      })

      throw error
    }
  }

  /**
   * Health check for the blog writer API
   */
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      const response = await this.makeRequest('/health', {
        method: 'GET'
      })

      return response
    } catch (error) {
      errorLogger.logError('Blog writer API health check failed', {
        component: 'blog-writer-api',
        action: 'healthCheck',
        additionalData: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      })

      throw error
    }
  }

  /**
   * Make HTTP request with retry logic and error handling
   */
  private async makeRequest(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<unknown> {
    const url = `${this.config.baseUrl}${endpoint}`
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>)
    }

    // Add API key if available
    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`
    }

    let lastError: Error | null = null

    for (let attempt = 1; attempt <= (this.config.retryAttempts || 1); attempt++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

        const response = await fetch(url, {
          ...options,
          headers,
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(
            errorData.message || 
            `HTTP ${response.status}: ${response.statusText}`
          )
        }

        return await response.json()
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error')
        
        // Don't retry on certain errors
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('Request timeout')
        }

        if (attempt < (this.config.retryAttempts || 1)) {
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
        }
      }
    }

    throw lastError || new Error('Request failed after all retry attempts')
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<BlogWriterConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  /**
   * Get current configuration (without sensitive data)
   */
  getConfig(): Omit<BlogWriterConfig, 'apiKey'> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { apiKey, ...safeConfig } = this.config
    return safeConfig
  }
}

// Default configuration
export const defaultBlogWriterConfig: BlogWriterConfig = {
  baseUrl: process.env.NEXT_PUBLIC_BLOG_WRITER_API_URL || 'https://api-ai-blog-writer-613248238610.us-central1.run.app',
  apiKey: process.env.BLOG_WRITER_API_KEY,
  timeout: 30000,
  retryAttempts: 3
}

// Create default client instance
export const blogWriterApi = new BlogWriterApiClient(defaultBlogWriterConfig)
