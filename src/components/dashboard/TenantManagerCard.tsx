'use client'

import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card/Card';
import Button from '@/components/ui/button/Button';
import { 
  Building2, 
  Users, 
  Plus, 
  TrendingUp,
  Activity,
  Key
} from 'lucide-react';

interface TenantManagerCardProps {
  totalTenants?: number;
  activeTenants?: number;
  newTenantsThisMonth?: number;
  totalUsers?: number;
  totalApiKeys?: number;
  monthlyUsage?: number;
}

export default function TenantManagerCard({
  totalTenants = 12,
  activeTenants = 10,
  newTenantsThisMonth = 3,
  totalUsers = 156
}: TenantManagerCardProps) {
  return (
    <Card className="col-span-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Building2 className="h-8 w-8 text-blue-600" />
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Tenant Management
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Multi-tenant system overview and management
              </p>
            </div>
          </div>
          <Button 
            size="sm" 
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => window.location.href = '/tenant-management/create'}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Tenant
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Tenants */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  Total Tenants
                </p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {totalTenants}
                </p>
              </div>
              <Building2 className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          {/* Active Tenants */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">
                  Active Tenants
                </p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {activeTenants}
                </p>
              </div>
              <Activity className="h-8 w-8 text-green-500" />
            </div>
          </div>

          {/* New This Month */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                  New This Month
                </p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {newTenantsThisMonth}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </div>

          {/* Total Users */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600 dark:text-orange-400">
                  Total Users
                </p>
                <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                  {totalUsers}
                </p>
              </div>
              <Users className="h-8 w-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
            Quick Actions
          </h4>
          <div className="flex flex-wrap gap-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.href = '/tenant-management'}
            >
              <Building2 className="h-4 w-4 mr-2" />
              View All Tenants
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.href = '/admin/users'}
            >
              <Users className="h-4 w-4 mr-2" />
              Manage Users
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.href = '/admin/api-keys'}
            >
              <Key className="h-4 w-4 mr-2" />
              API Keys
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.href = '/admin/analytics'}
            >
              <Activity className="h-4 w-4 mr-2" />
              Usage Analytics
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
