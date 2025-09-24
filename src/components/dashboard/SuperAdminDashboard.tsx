'use client'

import React from 'react';
import { User } from '@supabase/supabase-js';
import TenantManagerCard from './TenantManagerCard';
import ActiveActionsCard from './ActiveActionsCard';
import QuickStatsCard from './QuickStatsCard';

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
            Welcome back, {user.email}. Here&apos;s what&apos;s happening across your AI Management System.
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <QuickStatsCard />
        <ActiveActionsCard />
      </div>
    </div>
  );
}
