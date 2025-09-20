import { NextRequest } from 'next/server'
import { errorLogger } from '@/utils/errorLogger'

export interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  keyGenerator?: (request: NextRequest) => string // Custom key generator
  skipSuccessfulRequests?: boolean // Don't count successful requests
  skipFailedRequests?: boolean // Don't count failed requests
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
  totalHits: number
}

// In-memory store for rate limiting (in production, use Redis)
class RateLimitStore {
  private store: Map<string, { count: number; resetTime: number }> = new Map()
  private cleanupInterval: NodeJS.Timeout

  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 60000)
  }

  get(key: string): { count: number; resetTime: number } | undefined {
    return this.store.get(key)
  }

  set(key: string, value: { count: number; resetTime: number }): void {
    this.store.set(key, value)
  }

  increment(key: string, windowMs: number): { count: number; resetTime: number } {
    const now = Date.now()
    const resetTime = now + windowMs
    const existing = this.get(key)

    if (!existing || now > existing.resetTime) {
      // New window or expired
      const newEntry = { count: 1, resetTime }
      this.set(key, newEntry)
      return newEntry
    } else {
      // Increment existing window
      const updated = { count: existing.count + 1, resetTime: existing.resetTime }
      this.set(key, updated)
      return updated
    }
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, value] of this.store.entries()) {
      if (now > value.resetTime) {
        this.store.delete(key)
      }
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval)
    this.store.clear()
  }
}

// Global rate limit store
const rateLimitStore = new RateLimitStore()

export class RateLimiter {
  private config: RateLimitConfig

  constructor(config: RateLimitConfig) {
    this.config = {
      keyGenerator: this.defaultKeyGenerator,
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      ...config
    }
  }

  /**
   * Check if request is allowed
   */
  async check(request: NextRequest): Promise<RateLimitResult> {
    const key = this.config.keyGenerator!(request)
    const { count, resetTime } = rateLimitStore.increment(key, this.config.windowMs)
    
    const allowed = count <= this.config.maxRequests
    const remaining = Math.max(0, this.config.maxRequests - count)

    if (!allowed) {
      errorLogger.logError('Rate limit exceeded', {
        component: 'rate-limiter',
        action: 'check',
        additionalData: {
          key: key.substring(0, 20) + '...', // Log partial key for debugging
          count,
          maxRequests: this.config.maxRequests,
          windowMs: this.config.windowMs,
          userAgent: request.headers.get('user-agent'),
          ip: this.getClientIP(request)
        }
      })
    }

    return {
      allowed,
      remaining,
      resetTime,
      totalHits: count
    }
  }

  /**
   * Default key generator - uses IP address
   */
  private defaultKeyGenerator(request: NextRequest): string {
    const ip = this.getClientIP(request)
    const userAgent = request.headers.get('user-agent') || 'unknown'
    return `rate_limit:${ip}:${userAgent.substring(0, 50)}`
  }

  /**
   * Get client IP address
   */
  private getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for')
    const realIP = request.headers.get('x-real-ip')
    const cfConnectingIP = request.headers.get('cf-connecting-ip')
    
    if (cfConnectingIP) return cfConnectingIP
    if (realIP) return realIP
    if (forwarded) return forwarded.split(',')[0].trim()
    
    return 'unknown'
  }
}

/**
 * Pre-configured rate limiters for different use cases
 */
export const rateLimiters = {
  // General API rate limiting
  api: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100 // 100 requests per 15 minutes
  }),

  // Blog generation rate limiting (more restrictive)
  blogGeneration: new RateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10 // 10 blog generations per hour
  }),

  // Admin operations rate limiting
  admin: new RateLimiter({
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 50 // 50 admin requests per 5 minutes
  }),

  // Health check rate limiting (very permissive)
  healthCheck: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60 // 60 health checks per minute
  }),

  // Authentication rate limiting (prevents brute force)
  auth: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5 // 5 auth attempts per 15 minutes
  })
}

/**
 * Middleware function to apply rate limiting
 */
export async function applyRateLimit(
  request: NextRequest, 
  rateLimiter: RateLimiter
): Promise<{ allowed: boolean; response?: Response }> {
  try {
    const result = await rateLimiter.check(request)
    
    if (!result.allowed) {
      const response = new Response(
        JSON.stringify({
          success: false,
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
          limit: rateLimiter['config'].maxRequests,
          remaining: result.remaining,
          resetTime: new Date(result.resetTime).toISOString()
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': rateLimiter['config'].maxRequests.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.resetTime.toString(),
            'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString()
          }
        }
      )
      
      return { allowed: false, response }
    }
    
    return { allowed: true }
  } catch (error) {
        errorLogger.logError('Rate limiting error', {
          component: 'rate-limiter',
          action: 'applyRateLimit',
          additionalData: {
            error: error instanceof Error ? error.message : 'Unknown error'
          },
          timestamp: new Date().toISOString(),
          userAgent: 'server',
          url: 'server'
        })
    
    // On error, allow the request to proceed
    return { allowed: true }
  }
}

// UserRateLimiter removed to fix TypeScript inheritance issues
