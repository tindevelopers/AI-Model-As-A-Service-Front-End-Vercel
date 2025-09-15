/**
 * Comprehensive Error Logging and Debugging Utility
 * Provides detailed error tracking, environment validation, and debugging information
 */

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  timestamp?: string;
  userAgent?: string;
  url?: string;
  additionalData?: Record<string, unknown>;
}

export interface EnvironmentCheck {
  name: string;
  value: string | undefined;
  required: boolean;
  status: 'valid' | 'missing' | 'invalid';
  description: string;
}

class ErrorLogger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isClient = typeof window !== 'undefined';

  /**
   * Log errors with comprehensive context
   */
  logError(error: Error | string, context?: ErrorContext): void {
    const errorData = {
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'object' ? error.stack : undefined,
      context: {
        ...context,
        timestamp: new Date().toISOString(),
        userAgent: this.isClient ? window.navigator.userAgent : 'server',
        url: this.isClient ? window.location.href : 'server',
      },
      environment: this.getEnvironmentInfo(),
    };

    // Console logging
    console.group('🚨 Error Logged');
    console.error('Error:', errorData.message);
    console.error('Context:', errorData.context);
    console.error('Environment:', errorData.environment);
    if (errorData.stack) {
      console.error('Stack:', errorData.stack);
    }
    console.groupEnd();

    // In development, also log to localStorage for persistence
    if (this.isDevelopment && this.isClient) {
      this.persistError(errorData);
    }

    // Send to external logging service in production
    if (!this.isDevelopment) {
      this.sendToLoggingService(errorData);
    }
  }

  /**
   * Log warnings with context
   */
  logWarning(message: string, context?: ErrorContext): void {
    const warningData = {
      message,
      context: {
        ...context,
        timestamp: new Date().toISOString(),
        userAgent: this.isClient ? window.navigator.userAgent : 'server',
        url: this.isClient ? window.location.href : 'server',
      },
      environment: this.getEnvironmentInfo(),
    };

    console.group('⚠️ Warning Logged');
    console.warn('Warning:', warningData.message);
    console.warn('Context:', warningData.context);
    console.warn('Environment:', warningData.environment);
    console.groupEnd();

    if (this.isDevelopment && this.isClient) {
      this.persistWarning(warningData);
    }
  }

  /**
   * Log successful operations for debugging
   */
  logSuccess(message: string, context?: ErrorContext): void {
    const successData = {
      message,
      context: {
        ...context,
        timestamp: new Date().toISOString(),
        userAgent: this.isClient ? window.navigator.userAgent : 'server',
        url: this.isClient ? window.location.href : 'server',
      },
      environment: this.getEnvironmentInfo(),
    };

    console.group('✅ Success Logged');
    console.log('Success:', successData.message);
    console.log('Context:', successData.context);
    console.log('Environment:', successData.environment);
    console.groupEnd();
  }

  /**
   * Check and validate environment variables
   */
  checkEnvironment(): EnvironmentCheck[] {
    const checks: EnvironmentCheck[] = [
      {
        name: 'NEXT_PUBLIC_SUPABASE_URL',
        value: process.env.NEXT_PUBLIC_SUPABASE_URL,
        required: true,
        status: this.validateSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL),
        description: 'Supabase project URL for authentication and database',
      },
      {
        name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        value: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        required: true,
        status: this.validateSupabaseKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
        description: 'Supabase anonymous key for client-side operations',
      },
      // Note: SUPABASE_SERVICE_ROLE_KEY is only available server-side, not checked on client
      {
        name: 'NEXT_PUBLIC_GATEWAY_URL',
        value: process.env.NEXT_PUBLIC_GATEWAY_URL,
        required: true,
        status: this.validateGatewayUrl(process.env.NEXT_PUBLIC_GATEWAY_URL),
        description: 'AI Gateway URL for API calls',
      },
      {
        name: 'NODE_ENV',
        value: process.env.NODE_ENV,
        required: true,
        status: process.env.NODE_ENV ? 'valid' : 'missing',
        description: 'Node.js environment (development/production)',
      },
    ];

    return checks;
  }

  /**
   * Log environment validation results
   */
  logEnvironmentCheck(): void {
    const checks = this.checkEnvironment();
    const issues = checks.filter(check => check.status !== 'valid');

    console.group('🔍 Environment Validation');
    
    if (issues.length === 0) {
      console.log('✅ All environment variables are properly configured');
    } else {
      console.warn(`❌ Found ${issues.length} environment configuration issues:`);
      issues.forEach(check => {
        console.error(`  - ${check.name}: ${check.status} (${check.description})`);
        if (check.value) {
          console.error(`    Current value: ${check.value.substring(0, 20)}...`);
        }
      });
    }

    // Log all checks for debugging
    checks.forEach(check => {
      const status = check.status === 'valid' ? '✅' : '❌';
      console.log(`${status} ${check.name}: ${check.status}`);
    });

    console.groupEnd();

    // Log warnings for missing required variables
    issues.forEach(check => {
      if (check.required && check.status === 'missing') {
        this.logWarning(`Missing required environment variable: ${check.name}`, {
          component: 'ErrorLogger',
          action: 'environmentCheck',
          additionalData: { variable: check.name, description: check.description }
        });
      }
    });
  }

  /**
   * Get comprehensive environment information
   */
  private getEnvironmentInfo() {
    return {
      nodeEnv: process.env.NODE_ENV,
      isClient: this.isClient,
      isDevelopment: this.isDevelopment,
      timestamp: new Date().toISOString(),
      userAgent: this.isClient ? window.navigator.userAgent : 'server',
      url: this.isClient ? window.location.href : 'server',
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasGatewayUrl: !!process.env.NEXT_PUBLIC_GATEWAY_URL,
    };
  }

  /**
   * Validate Supabase URL format
   */
  private validateSupabaseUrl(url?: string): 'valid' | 'missing' | 'invalid' {
    if (!url) return 'missing';
    if (!url.startsWith('https://') || !url.includes('.supabase.co')) {
      return 'invalid';
    }
    return 'valid';
  }

  /**
   * Validate Supabase key format (JWT)
   */
  private validateSupabaseKey(key?: string): 'valid' | 'missing' | 'invalid' {
    if (!key) return 'missing';
    if (!key.startsWith('eyJ')) return 'invalid'; // JWT tokens start with 'eyJ'
    return 'valid';
  }

  /**
   * Validate Gateway URL format
   */
  private validateGatewayUrl(url?: string): 'valid' | 'missing' | 'invalid' {
    if (!url) return 'missing';
    if (!url.startsWith('https://')) return 'invalid';
    return 'valid';
  }

  /**
   * Persist errors to localStorage in development
   */
  private persistError(errorData: unknown): void {
    try {
      const existingErrors = JSON.parse(localStorage.getItem('errorLogs') || '[]');
      existingErrors.push(errorData);
      // Keep only last 50 errors
      const recentErrors = existingErrors.slice(-50);
      localStorage.setItem('errorLogs', JSON.stringify(recentErrors));
    } catch (e) {
      console.error('Failed to persist error:', e);
    }
  }

  /**
   * Persist warnings to localStorage in development
   */
  private persistWarning(warningData: unknown): void {
    try {
      const existingWarnings = JSON.parse(localStorage.getItem('warningLogs') || '[]');
      existingWarnings.push(warningData);
      // Keep only last 50 warnings
      const recentWarnings = existingWarnings.slice(-50);
      localStorage.setItem('warningLogs', JSON.stringify(recentWarnings));
    } catch (e) {
      console.error('Failed to persist warning:', e);
    }
  }

  /**
   * Send errors to external logging service in production
   */
  private sendToLoggingService(errorData: unknown): void {
    // In production, you would send to services like Sentry, LogRocket, etc.
    // For now, we'll just log to console
    console.error('Production Error (would send to logging service):', errorData);
  }

  /**
   * Get stored error logs from localStorage
   */
  getStoredErrors(): unknown[] {
    if (!this.isClient) return [];
    try {
      return JSON.parse(localStorage.getItem('errorLogs') || '[]');
    } catch {
      return [];
    }
  }

  /**
   * Get stored warning logs from localStorage
   */
  getStoredWarnings(): unknown[] {
    if (!this.isClient) return [];
    try {
      return JSON.parse(localStorage.getItem('warningLogs') || '[]');
    } catch {
      return [];
    }
  }

  /**
   * Clear stored logs
   */
  clearStoredLogs(): void {
    if (!this.isClient) return;
    localStorage.removeItem('errorLogs');
    localStorage.removeItem('warningLogs');
    console.log('🧹 Cleared stored error and warning logs');
  }
}

// Create singleton instance
export const errorLogger = new ErrorLogger();

// Export types for use in components
// Note: ErrorContext and EnvironmentCheck are already exported as interfaces above
