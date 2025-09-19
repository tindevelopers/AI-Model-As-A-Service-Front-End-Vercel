'use client'

import { useTenant } from '@/context/TenantContext'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card/Card'
import Badge from '@/components/ui/badge/Badge'
import Button from '@/components/ui/button/Button'
import { 
  Users, 
  Key, 
  Activity, 
  DollarSign, 
  RefreshCw
} from 'lucide-react'
import { useEffect } from 'react'

export default function TenantDashboard() {
  const { 
    currentTenant, 
    tenantStats, 
    tenantBilling, 
    loadingStats, 
    loadingBilling,
    refreshTenantData 
  } = useTenant()

  useEffect(() => {
    if (currentTenant) {
      refreshTenantData(currentTenant.id)
    }
  }, [currentTenant, refreshTenantData])

  if (!currentTenant) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            No Tenant Selected
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Please select a tenant to view the dashboard.
          </p>
        </div>
      </div>
    )
  }

  const handleRefresh = () => {
    if (currentTenant) {
      refreshTenantData(currentTenant.id)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {currentTenant.name}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Tenant Dashboard
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge 
            variant={currentTenant.subscription_status === 'active' ? 'solid' : 'light'}
            color={currentTenant.subscription_status === 'active' ? 'success' : 'warning'}
          >
            {currentTenant.subscription_status}
          </Badge>
          <Badge variant="light" color="info">
            {currentTenant.subscription_plan}
          </Badge>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={loadingStats || loadingBilling}
            startIcon={<RefreshCw className={`h-4 w-4 ${(loadingStats || loadingBilling) ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Members */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingStats ? '...' : tenantStats?.total_members || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {loadingStats ? 'Loading...' : `${tenantStats?.active_members || 0} active`}
            </p>
          </CardContent>
        </Card>

        {/* API Keys */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Keys</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingStats ? '...' : tenantStats?.total_api_keys || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {loadingStats ? 'Loading...' : `${tenantStats?.active_api_keys || 0} active`}
            </p>
          </CardContent>
        </Card>

        {/* Total Requests */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingStats ? '...' : (tenantStats?.total_requests || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {loadingStats ? 'Loading...' : `${(tenantStats?.requests_today || 0).toLocaleString()} today`}
            </p>
          </CardContent>
        </Card>

        {/* Total Cost */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingStats ? '...' : `$${(tenantStats?.total_cost || 0).toFixed(2)}`}
            </div>
            <p className="text-xs text-muted-foreground">
              {loadingStats ? 'Loading...' : `$${(tenantStats?.cost_today || 0).toFixed(2)} today`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Usage Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Usage */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Requests</span>
                <span className="text-sm text-muted-foreground">
                  {loadingStats ? '...' : (tenantStats?.requests_this_month || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Tokens</span>
                <span className="text-sm text-muted-foreground">
                  {loadingStats ? '...' : (tenantStats?.tokens_this_month || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Cost</span>
                <span className="text-sm text-muted-foreground">
                  {loadingStats ? '...' : `$${(tenantStats?.cost_this_month || 0).toFixed(2)}`}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Billing Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Billing Summary</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingBilling ? (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">Loading billing information...</p>
              </div>
            ) : tenantBilling ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Current Period</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(tenantBilling.current_period_start).toLocaleDateString()} - {new Date(tenantBilling.current_period_end).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Amount</span>
                  <span className="text-sm font-bold">
                    ${tenantBilling.total_amount_usd.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Payment Status</span>
                  <Badge 
                    variant={tenantBilling.payment_status === 'paid' ? 'solid' : 'light'}
                    color={tenantBilling.payment_status === 'paid' ? 'success' : 'warning'}
                  >
                    {tenantBilling.payment_status}
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">No billing information available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button variant="outline" startIcon={<Key className="h-4 w-4" />}>
              Manage API Keys
            </Button>
            <Button variant="outline" startIcon={<Users className="h-4 w-4" />}>
              Manage Team
            </Button>
            <Button variant="outline" startIcon={<DollarSign className="h-4 w-4" />}>
              View Billing
            </Button>
            <Button variant="outline" startIcon={<Activity className="h-4 w-4" />}>
              View Analytics
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
