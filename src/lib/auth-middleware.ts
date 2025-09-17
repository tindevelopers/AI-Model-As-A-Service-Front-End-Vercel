import { createServerClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { errorLogger } from '@/utils/errorLogger'

export interface AuthenticatedUser {
  id: string
  email: string
  role?: string
  permissions?: string[]
}

export interface AuthResult {
  success: boolean
  user?: AuthenticatedUser
  error?: string
  statusCode?: number
}

/**
 * Authentication middleware for API routes
 */
export class AuthMiddleware {
  /**
   * Authenticate user via Supabase session
   */
  static async authenticateUser(): Promise<AuthResult> {
    try {
      const supabase = await createServerClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        errorLogger.logError('Authentication failed', {
          component: 'auth-middleware',
          action: 'authenticateUser',
          additionalData: {
            error: authError?.message || 'No user found',
            hasUser: !!user
          }
        })

        return {
          success: false,
          error: 'Unauthorized - Please log in to access this resource',
          statusCode: 401
        }
      }

      // Get user metadata for role and permissions
      const userMetadata = user.user_metadata || {}
      const appMetadata = user.app_metadata || {}

      const authenticatedUser: AuthenticatedUser = {
        id: user.id,
        email: user.email || '',
        role: userMetadata.role || appMetadata.role || 'user',
        permissions: userMetadata.permissions || appMetadata.permissions || []
      }

      return {
        success: true,
        user: authenticatedUser
      }
    } catch (error) {
      errorLogger.logError('Authentication middleware error', {
        component: 'auth-middleware',
        action: 'authenticateUser',
        additionalData: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      })

      return {
        success: false,
        error: 'Authentication service unavailable',
        statusCode: 503
      }
    }
  }

  /**
   * Authenticate user via API key
   */
  static async authenticateApiKey(_request: NextRequest): Promise<AuthResult> {
    try {
      const authHeader = _request.headers.get('authorization')
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return {
          success: false,
          error: 'API key required - Please provide a valid API key in the Authorization header',
          statusCode: 401
        }
      }

      const apiKey = authHeader.substring(7) // Remove 'Bearer ' prefix

      // Validate API key format
      if (!this.isValidApiKeyFormat(apiKey)) {
        return {
          success: false,
          error: 'Invalid API key format',
          statusCode: 401
        }
      }

      // TODO: Implement actual API key validation against database
      // For now, we'll do basic validation
      const isValidKey = await this.validateApiKeyInDatabase(apiKey)
      
      if (!isValidKey) {
        errorLogger.logError('Invalid API key used', {
          component: 'auth-middleware',
          action: 'authenticateApiKey',
          additionalData: {
            keyPrefix: apiKey.substring(0, 8) + '...',
            userAgent: _request.headers.get('user-agent'),
            ip: _request.headers.get('x-forwarded-for') || 'unknown'
          }
        })

        return {
          success: false,
          error: 'Invalid or expired API key',
          statusCode: 401
        }
      }

      // Get user associated with API key
      const user = await this.getUserByApiKey(apiKey)
      
      if (!user) {
        return {
          success: false,
          error: 'API key not associated with any user',
          statusCode: 401
        }
      }

      return {
        success: true,
        user
      }
    } catch (error) {
      errorLogger.logError('API key authentication error', {
        component: 'auth-middleware',
        action: 'authenticateApiKey',
        additionalData: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      })

      return {
        success: false,
        error: 'API key authentication failed',
        statusCode: 500
      }
    }
  }

  /**
   * Check if user has admin role
   */
  static async requireAdmin(_request: NextRequest): Promise<AuthResult> {
    const authResult = await this.authenticateUser()
    
    if (!authResult.success) {
      return authResult
    }

    const user = authResult.user!
    
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      errorLogger.logError('Unauthorized admin access attempt', {
        component: 'auth-middleware',
        action: 'requireAdmin',
        additionalData: {
          userId: user.id,
          userRole: user.role,
          userEmail: user.email
        }
      })

      return {
        success: false,
        error: 'Admin access required',
        statusCode: 403
      }
    }

    return authResult
  }

  /**
   * Check if user has specific permission
   */
  static async requirePermission(request: NextRequest, permission: string): Promise<AuthResult> {
    const authResult = await this.authenticateUser()
    
    if (!authResult.success) {
      return authResult
    }

    const user = authResult.user!
    
    if (!user.permissions?.includes(permission) && user.role !== 'admin' && user.role !== 'super_admin') {
      errorLogger.logError('Unauthorized permission access attempt', {
        component: 'auth-middleware',
        action: 'requirePermission',
        additionalData: {
          userId: user.id,
          userRole: user.role,
          requiredPermission: permission,
          userPermissions: user.permissions
        }
      })

      return {
        success: false,
        error: `Permission '${permission}' required`,
        statusCode: 403
      }
    }

    return authResult
  }

  /**
   * Flexible authentication - try API key first, then user session
   */
  static async authenticateFlexible(request: NextRequest): Promise<AuthResult> {
    // Try API key authentication first
    const apiKeyResult = await this.authenticateApiKey(request)
    if (apiKeyResult.success) {
      return apiKeyResult
    }

    // Fall back to user session authentication
    return await this.authenticateUser(request)
  }

  /**
   * Validate API key format
   */
  private static isValidApiKeyFormat(apiKey: string): boolean {
    // API keys should start with 'ai_' and be at least 32 characters
    return apiKey.startsWith('ai_') && apiKey.length >= 32
  }

  /**
   * Validate API key against database
   * TODO: Implement actual database validation
   */
  private static async validateApiKeyInDatabase(apiKey: string): Promise<boolean> {
    // For now, we'll do a simple validation
    // In production, this should check against your database
    try {
      // Mock validation - replace with actual database query
      // const supabase = await createServerClient()
      
      // TODO: Replace with actual API key validation query
      // const { data, error } = await supabase
      //   .from('api_keys')
      //   .select('*')
      //   .eq('key', apiKey)
      //   .eq('is_active', true)
      //   .single()
      
      // For now, return true for valid format
      return this.isValidApiKeyFormat(apiKey)
    } catch (error) {
      errorLogger.logError('API key database validation error', {
        component: 'auth-middleware',
        action: 'validateApiKeyInDatabase',
        additionalData: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      })
      return false
    }
  }

  /**
   * Get user by API key
   * TODO: Implement actual database query
   */
  private static async getUserByApiKey(apiKey: string): Promise<AuthenticatedUser | null> {
    try {
      // Mock user retrieval - replace with actual database query
      // const supabase = await createServerClient()
      // const { data, error } = await supabase
      //   .from('api_keys')
      //   .select('user_id, users(*)')
      //   .eq('key', apiKey)
      //   .eq('is_active', true)
      //   .single()
      
      // For now, return a mock user
      return {
        id: 'api-user-' + apiKey.substring(0, 8),
        email: 'api-user@example.com',
        role: 'api_user',
        permissions: ['blog:write', 'content:generate']
      }
    } catch (error) {
      errorLogger.logError('Get user by API key error', {
        component: 'auth-middleware',
        action: 'getUserByApiKey',
        additionalData: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      })
      return null
    }
  }
}

/**
 * Helper function to create error response
 */
export function createAuthErrorResponse(error: string, statusCode: number = 401): NextResponse {
  return NextResponse.json(
    { 
      success: false,
      error,
      timestamp: new Date().toISOString()
    }, 
    { status: statusCode }
  )
}

/**
 * Helper function to create success response with user context
 */
export function createAuthSuccessResponse(data: unknown, user: AuthenticatedUser): NextResponse {
  return NextResponse.json({
    success: true,
    data,
    user: {
      id: user.id,
      role: user.role
    },
    timestamp: new Date().toISOString()
  })
}
