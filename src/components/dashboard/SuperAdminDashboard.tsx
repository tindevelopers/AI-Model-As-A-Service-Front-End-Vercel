'use client'

import React from 'react';
import { User } from '@supabase/supabase-js';
import { Card, CardHeader, CardContent } from '@/components/ui/card/Card';
import { 
  Users, 
  Activity, 
  Key, 
  TrendingUp, 
  Shield, 
  Clock,
  AlertTriangle,
  CheckCircle,
  Building2,
  Zap,
  BarChart3
} from 'lucide-react';
import TenantManagerCard from './TenantManagerCard';
import ActiveActionsCard from './ActiveActionsCard';
import QuickStatsCard from './QuickStatsCard';
import RecentActivityCard from './RecentActivityCard';
import SystemHealthCard from './SystemHealthCard';

interface SuperAdminDashboardProps {
  user: User;
}

export default function SuperAdminDashboard({ user }: SuperAdminDashboardProps) {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Super Admin Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Welcome back, {user.email}. Here's what's happening across your AI Management System.
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 px-3 py-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-green-700 dark:text-green-400">System Online</span>
          </div>
        </div>
      </div>

      {/* Primary Cards Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tenant Manager - First Dashboard */}
        <div className="lg:col-span-2">
          <TenantManagerCard />
        </div>
      </div>

      {/* Secondary Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <QuickStatsCard />
        <ActiveActionsCard />
        <SystemHealthCard />
        <RecentActivityCard />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold">API Usage Analytics</h3>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total API Calls Today</span>
                <span className="font-semibold text-gray-900 dark:text-white">12,847</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Active API Keys</span>
                <span className="font-semibold text-gray-900 dark:text-white">156</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Success Rate</span>
                <span className="font-semibold text-green-600">99.2%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold">Security Overview</h3>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Failed Login Attempts</span>
                <span className="font-semibold text-gray-900 dark:text-white">3</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Blocked IPs</span>
                <span className="font-semibold text-gray-900 dark:text-white">12</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Security Score</span>
                <span className="font-semibold text-green-600">Excellent</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
