'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { 
  Tenant, 
  UserTenantRole, 
  TenantAdminMenu, 
  TenantStatistics, 
  TenantBillingSummary,
  ApiResponse 
} from '@/types/tenant'
import { errorLogger } from '@/utils/errorLogger'

interface TenantContextType {
  // Current tenant state
  currentTenant: Tenant | null
  setCurrentTenant: (tenant: Tenant | null) => void
  
  // User's tenant roles
  userTenantRoles: UserTenantRole[]
  loadingRoles: boolean
  
  // Tenant admin menu
  tenantMenu: TenantAdminMenu | null
  loadingMenu: boolean
  
  // Tenant statistics
  tenantStats: TenantStatistics | null
  loadingStats: boolean
  
  // Tenant billing
  tenantBilling: TenantBillingSummary | null
  loadingBilling: boolean
  
  // Actions
  loadUserTenantRoles: () => Promise<void>
  loadTenantMenu: (tenantId: string) => Promise<void>
  loadTenantStats: (tenantId: string) => Promise<void>
  loadTenantBilling: (tenantId: string) => Promise<void>
  refreshTenantData: (tenantId: string) => Promise<void>
}

const TenantContext = createContext<TenantContextType | undefined>(undefined)

export function TenantProvider({ children }: { children: ReactNode }) {
  const { user, session } = useAuth()
  
  // State
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null)
  const [userTenantRoles, setUserTenantRoles] = useState<UserTenantRole[]>([])
  const [tenantMenu, setTenantMenu] = useState<TenantAdminMenu | null>(null)
  const [tenantStats, setTenantStats] = useState<TenantStatistics | null>(null)
  const [tenantBilling, setTenantBilling] = useState<TenantBillingSummary | null>(null)
  
  // Loading states
  const [loadingRoles, setLoadingRoles] = useState(false)
  const [loadingMenu, setLoadingMenu] = useState(false)
  const [loadingStats, setLoadingStats] = useState(false)
  const [loadingBilling, setLoadingBilling] = useState(false)

  // Load user's tenant roles
  const loadUserTenantRoles = useCallback(async () => {
    if (!user || !session) return

    setLoadingRoles(true)
    try {
      const response = await fetch('/api/tenant/roles', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      const result: ApiResponse<UserTenantRole[]> = await response.json()

      if (result.success && result.data) {
        setUserTenantRoles(result.data)
        
        // Auto-select first tenant if none selected
        if (!currentTenant && result.data.length > 0) {
          // You might want to load tenant details here
          // For now, we'll just set a basic tenant object
          const firstRole = result.data[0]
          setCurrentTenant({
            id: firstRole.tenant_id,
            name: firstRole.tenant_name,
            slug: firstRole.tenant_slug,
            subscription_plan: 'free',
            subscription_status: 'active',
            max_users: 5,
            max_api_calls_per_month: 10000,
            is_active: true,
            created_at: new Date().toISOString()
          })
        }
      } else {
        errorLogger.logError('Failed to load user tenant roles', {
          component: 'tenant-context',
          action: 'loadUserTenantRoles',
          additionalData: { error: result.error }
        })
      }
    } catch (error) {
      errorLogger.logError('Failed to load user tenant roles', {
        component: 'tenant-context',
        action: 'loadUserTenantRoles',
        additionalData: { error: error instanceof Error ? error.message : 'Unknown error' }
      })
    } finally {
      setLoadingRoles(false)
    }
  }, [user, session])

  // Load tenant admin menu
  const loadTenantMenu = async (tenantId: string) => {
    if (!user || !session) return

    setLoadingMenu(true)
    try {
      const response = await fetch(`/api/tenant/menu?tenant_id=${tenantId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      const result: ApiResponse<TenantAdminMenu> = await response.json()

      if (result.success && result.data) {
        setTenantMenu(result.data)
      } else {
        errorLogger.logError('Failed to load tenant menu', {
          component: 'tenant-context',
          action: 'loadTenantMenu',
          tenantId,
          additionalData: { error: result.error }
        })
      }
    } catch (error) {
      errorLogger.logError('Failed to load tenant menu', {
        component: 'tenant-context',
        action: 'loadTenantMenu',
        tenantId,
        additionalData: { error: error instanceof Error ? error.message : 'Unknown error' }
      })
    } finally {
      setLoadingMenu(false)
    }
  }

  // Load tenant statistics
  const loadTenantStats = async (tenantId: string) => {
    if (!user || !session) return

    setLoadingStats(true)
    try {
      const response = await fetch(`/api/tenant/statistics?tenant_id=${tenantId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      const result: ApiResponse<TenantStatistics> = await response.json()

      if (result.success && result.data) {
        setTenantStats(result.data)
      } else {
        errorLogger.logError('Failed to load tenant statistics', {
          component: 'tenant-context',
          action: 'loadTenantStats',
          tenantId,
          additionalData: { error: result.error }
        })
      }
    } catch (error) {
      errorLogger.logError('Failed to load tenant statistics', {
        component: 'tenant-context',
        action: 'loadTenantStats',
        tenantId,
        additionalData: { error: error instanceof Error ? error.message : 'Unknown error' }
      })
    } finally {
      setLoadingStats(false)
    }
  }

  // Load tenant billing
  const loadTenantBilling = async (tenantId: string) => {
    if (!user || !session) return

    setLoadingBilling(true)
    try {
      const response = await fetch(`/api/tenant/billing?tenant_id=${tenantId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      const result: ApiResponse<TenantBillingSummary> = await response.json()

      if (result.success && result.data) {
        setTenantBilling(result.data)
      } else {
        errorLogger.logError('Failed to load tenant billing', {
          component: 'tenant-context',
          action: 'loadTenantBilling',
          tenantId,
          additionalData: { error: result.error }
        })
      }
    } catch (error) {
      errorLogger.logError('Failed to load tenant billing', {
        component: 'tenant-context',
        action: 'loadTenantBilling',
        tenantId,
        additionalData: { error: error instanceof Error ? error.message : 'Unknown error' }
      })
    } finally {
      setLoadingBilling(false)
    }
  }

  // Refresh all tenant data
  const refreshTenantData = useCallback(async (tenantId: string) => {
    await Promise.all([
      loadTenantMenu(tenantId),
      loadTenantStats(tenantId),
      loadTenantBilling(tenantId)
    ])
  }, [])

  // Load user tenant roles when user changes
  useEffect(() => {
    if (user && session) {
      loadUserTenantRoles()
    } else {
      // Clear state when user logs out
      setUserTenantRoles([])
      setCurrentTenant(null)
      setTenantMenu(null)
      setTenantStats(null)
      setTenantBilling(null)
    }
  }, [user, session, loadUserTenantRoles])

  // Load tenant data when current tenant changes
  useEffect(() => {
    if (currentTenant) {
      refreshTenantData(currentTenant.id)
    }
  }, [currentTenant, refreshTenantData])

  const value: TenantContextType = {
    currentTenant,
    setCurrentTenant,
    userTenantRoles,
    loadingRoles,
    tenantMenu,
    loadingMenu,
    tenantStats,
    loadingStats,
    tenantBilling,
    loadingBilling,
    loadUserTenantRoles,
    loadTenantMenu,
    loadTenantStats,
    loadTenantBilling,
    refreshTenantData
  }

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  )
}

export function useTenant() {
  const context = useContext(TenantContext)
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider')
  }
  return context
}
