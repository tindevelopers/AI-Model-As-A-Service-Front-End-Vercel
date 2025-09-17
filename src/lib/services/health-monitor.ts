import { errorLogger } from '@/utils/errorLogger'
import { blogWriterApi } from './blog-writer-api'
import { sharedServiceRegistry } from '../ai-router'

export interface HealthCheckResult {
  serviceId: string
  serviceName: string
  status: 'healthy' | 'degraded' | 'unhealthy'
  responseTime: number
  errorRate: number
  availability: number
  lastChecked: string
  error?: string
  details?: Record<string, unknown>
}

export interface ServiceMetrics {
  serviceId: string
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  averageResponseTime: number
  errorRate: number
  availability: number
  lastUpdated: string
}

class HealthMonitor {
  private healthChecks: Map<string, HealthCheckResult> = new Map()
  private metrics: Map<string, ServiceMetrics> = new Map()
  private checkInterval: NodeJS.Timeout | null = null
  private isRunning = false

  constructor() {
    this.initializeMetrics()
  }

  /**
   * Start health monitoring for all registered services
   */
  start(intervalMs: number = 30000): void {
    if (this.isRunning) {
      console.warn('Health monitor is already running')
      return
    }

    this.isRunning = true
    this.checkInterval = setInterval(() => {
      this.performHealthChecks()
    }, intervalMs)

    // Perform initial health check
    this.performHealthChecks()

    errorLogger.logSuccess('Health monitor started', {
      component: 'health-monitor',
      action: 'start',
      additionalData: {
        intervalMs,
        servicesCount: sharedServiceRegistry.listServices().length
      }
    })
  }

  /**
   * Stop health monitoring
   */
  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
    this.isRunning = false

    errorLogger.logSuccess('Health monitor stopped', {
      component: 'health-monitor',
      action: 'stop'
    })
  }

  /**
   * Get health status for a specific service
   */
  getServiceHealth(serviceId: string): HealthCheckResult | undefined {
    return this.healthChecks.get(serviceId)
  }

  /**
   * Get health status for all services
   */
  getAllHealthStatus(): HealthCheckResult[] {
    return Array.from(this.healthChecks.values())
  }

  /**
   * Get metrics for a specific service
   */
  getServiceMetrics(serviceId: string): ServiceMetrics | undefined {
    return this.metrics.get(serviceId)
  }

  /**
   * Get metrics for all services
   */
  getAllMetrics(): ServiceMetrics[] {
    return Array.from(this.metrics.values())
  }

  /**
   * Record a successful request
   */
  recordSuccess(serviceId: string, responseTime: number): void {
    const metrics = this.metrics.get(serviceId)
    if (metrics) {
      metrics.totalRequests++
      metrics.successfulRequests++
      metrics.averageResponseTime = (metrics.averageResponseTime + responseTime) / 2
      metrics.errorRate = (metrics.failedRequests / metrics.totalRequests) * 100
      metrics.availability = (metrics.successfulRequests / metrics.totalRequests) * 100
      metrics.lastUpdated = new Date().toISOString()
    }
  }

  /**
   * Record a failed request
   */
  recordFailure(serviceId: string, responseTime: number, error?: string): void {
    const metrics = this.metrics.get(serviceId)
    if (metrics) {
      metrics.totalRequests++
      metrics.failedRequests++
      metrics.averageResponseTime = (metrics.averageResponseTime + responseTime) / 2
      metrics.errorRate = (metrics.failedRequests / metrics.totalRequests) * 100
      metrics.availability = (metrics.successfulRequests / metrics.totalRequests) * 100
      metrics.lastUpdated = new Date().toISOString()
    }

    errorLogger.logError(`Service request failed: ${serviceId}`, {
      component: 'health-monitor',
      action: 'recordFailure',
      additionalData: {
        serviceId,
        responseTime,
        error
      }
    })
  }

  /**
   * Perform health checks for all registered services
   */
  private async performHealthChecks(): Promise<void> {
    const services = sharedServiceRegistry.listServices()
    
    for (const service of services) {
      try {
        await this.checkServiceHealth(service.id)
      } catch (error) {
        errorLogger.logError(`Health check failed for service: ${service.id}`, {
          component: 'health-monitor',
          action: 'performHealthChecks',
          additionalData: {
            serviceId: service.id,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        })
      }
    }
  }

  /**
   * Check health for a specific service
   */
  private async checkServiceHealth(serviceId: string): Promise<void> {
    const startTime = Date.now()
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'unhealthy'
    let error: string | undefined
    let details: Record<string, unknown> = {}

    try {
      // Service-specific health checks
      switch (serviceId) {
        case 'blog-writer-api':
          const healthResult = await blogWriterApi.healthCheck()
          status = healthResult.status === 'healthy' ? 'healthy' : 'unhealthy'
          details = healthResult
          break
        
        default:
          // Generic health check for other services
          const service = sharedServiceRegistry.getService(serviceId)
          if (service && service.endpoints.length > 0) {
            const healthEndpoint = service.endpoints[0].healthCheck
            if (healthEndpoint) {
              const response = await fetch(`${service.endpoints[0].url}${healthEndpoint.endpoint}`, {
                method: 'GET',
                signal: AbortSignal.timeout(5000)
              })
              status = response.ok ? 'healthy' : 'unhealthy'
            }
          }
          break
      }
    } catch (err) {
      status = 'unhealthy'
      error = err instanceof Error ? err.message : 'Health check failed'
    }

    const responseTime = Date.now() - startTime

    // Update health status
    const healthResult: HealthCheckResult = {
      serviceId,
      serviceName: sharedServiceRegistry.getService(serviceId)?.name || serviceId,
      status,
      responseTime,
      errorRate: this.metrics.get(serviceId)?.errorRate || 0,
      availability: this.metrics.get(serviceId)?.availability || 0,
      lastChecked: new Date().toISOString(),
      error,
      details
    }

    this.healthChecks.set(serviceId, healthResult)

    // Update service registry health status
    sharedServiceRegistry.updateHealthStatus(serviceId, {
      status,
      responseTime,
      errorRate: healthResult.errorRate,
      availability: healthResult.availability,
      lastChecked: healthResult.lastChecked
    })
  }

  /**
   * Initialize metrics for all registered services
   */
  private initializeMetrics(): void {
    const services = sharedServiceRegistry.listServices()
    
    for (const service of services) {
      if (!this.metrics.has(service.id)) {
        this.metrics.set(service.id, {
          serviceId: service.id,
          totalRequests: 0,
          successfulRequests: 0,
          failedRequests: 0,
          averageResponseTime: 0,
          errorRate: 0,
          availability: 100,
          lastUpdated: new Date().toISOString()
        })
      }
    }
  }

  /**
   * Get overall system health
   */
  getSystemHealth(): {
    overall: 'healthy' | 'degraded' | 'unhealthy'
    healthyServices: number
    totalServices: number
    averageResponseTime: number
    averageAvailability: number
  } {
    const allHealth = this.getAllHealthStatus()
    const totalServices = allHealth.length
    const healthyServices = allHealth.filter(h => h.status === 'healthy').length
    const degradedServices = allHealth.filter(h => h.status === 'degraded').length
    
    let overall: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
    if (healthyServices === 0) {
      overall = 'unhealthy'
    } else if (degradedServices > 0 || healthyServices < totalServices) {
      overall = 'degraded'
    }

    const averageResponseTime = allHealth.reduce((sum, h) => sum + h.responseTime, 0) / totalServices
    const averageAvailability = allHealth.reduce((sum, h) => sum + h.availability, 0) / totalServices

    return {
      overall,
      healthyServices,
      totalServices,
      averageResponseTime,
      averageAvailability
    }
  }
}

// Export singleton instance
export const healthMonitor = new HealthMonitor()

// Auto-start health monitoring in production
if (process.env.NODE_ENV === 'production') {
  healthMonitor.start(30000) // Check every 30 seconds
}
