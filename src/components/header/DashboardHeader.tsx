'use client'

import React from 'react';
import { User } from '@supabase/supabase-js';
import UserDropdown from './UserDropdown';
import { ThemeToggleButton } from '../common/ThemeToggleButton';
import NotificationDropdown from './NotificationDropdown';

interface DashboardHeaderProps {
  user: User;
}

export default function DashboardHeader({ }: DashboardHeaderProps) {
  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left side - could add breadcrumbs or page title */}
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            AI Model Service
          </h1>
        </div>

        {/* Right side - user controls */}
        <div className="flex items-center space-x-4">
          {/* Dark Mode Toggle */}
          <ThemeToggleButton />
          
          {/* Notifications */}
          <NotificationDropdown />
          
          {/* User Profile Dropdown */}
          <UserDropdown />
        </div>
      </div>
    </header>
  );
}
