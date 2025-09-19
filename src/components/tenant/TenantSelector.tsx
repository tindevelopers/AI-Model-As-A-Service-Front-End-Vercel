'use client'

import { useState } from 'react'
import { useTenant } from '@/context/TenantContext'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, Building2, Users, Crown, Shield, User, Eye } from 'lucide-react'

const roleIcons = {
  owner: Crown,
  admin: Shield,
  member: User,
  viewer: Eye
}

const roleColors = {
  owner: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  admin: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  member: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  viewer: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
}

export function TenantSelector() {
  const { 
    currentTenant, 
    userTenantRoles, 
    loadingRoles, 
    setCurrentTenant 
  } = useTenant()
  const [isOpen, setIsOpen] = useState(false)

  const handleTenantSelect = (tenantRole: { tenant_id: string; tenant_name: string; tenant_slug: string; role: string }) => {
    // Create a basic tenant object from the role data
    const tenant = {
      id: tenantRole.tenant_id,
      name: tenantRole.tenant_name,
      slug: tenantRole.tenant_slug,
      subscription_plan: 'free' as const,
      subscription_status: 'active' as const,
      max_users: 5,
      max_api_calls_per_month: 10000,
      is_active: true,
      created_at: new Date().toISOString()
    }
    
    setCurrentTenant(tenant)
    setIsOpen(false)
  }

  if (loadingRoles) {
    return (
      <div className="flex items-center space-x-2">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Loading tenants...</span>
      </div>
    )
  }

  if (!userTenantRoles || userTenantRoles.length === 0) {
    return (
      <div className="flex items-center space-x-2">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">No tenants available</span>
      </div>
    )
  }


  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="flex items-center space-x-2 min-w-[200px] justify-between"
        >
          <div className="flex items-center space-x-2">
            <Building2 className="h-4 w-4" />
            <span className="truncate">
              {currentTenant ? currentTenant.name : 'Select Tenant'}
            </span>
          </div>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-80" align="start">
        <DropdownMenuLabel>Select Tenant</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {userTenantRoles.map((tenantRole) => {
          const RoleIcon = roleIcons[tenantRole.role as keyof typeof roleIcons] || User
          const isSelected = currentTenant && currentTenant.id === tenantRole.tenant_id
          
          return (
            <DropdownMenuItem
              key={tenantRole.tenant_id}
              onClick={() => handleTenantSelect(tenantRole)}
              className="flex items-center justify-between p-3"
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">
                    {tenantRole.tenant_name}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {tenantRole.tenant_slug}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 flex-shrink-0">
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${roleColors[tenantRole.role as keyof typeof roleColors] || roleColors.member}`}
                >
                  <RoleIcon className="h-3 w-3 mr-1" />
                  {tenantRole.role}
                </Badge>
                {isSelected && (
                  <div className="w-2 h-2 bg-primary rounded-full" />
                )}
              </div>
            </DropdownMenuItem>
          )
        })}
        
        {userTenantRoles.length === 0 && (
          <DropdownMenuItem disabled>
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>No tenants available</span>
            </div>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
