'use client'

import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card/Card';
import { Button } from '@/components/ui/button/Button';
import { 
  Settings, 
  User, 
  Key, 
  Bell, 
  Shield, 
  LogOut,
  LogIn,
  Moon,
  Sun,
  Globe,
  Database
} from 'lucide-react';

interface SettingsCardProps {
  user?: {
    email: string;
    name?: string;
  };
  isAuthenticated?: boolean;
}

export default function SettingsCard({ user, isAuthenticated = true }: SettingsCardProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);

  const handleSignOut = async () => {
    try {
      const response = await fetch('/api/auth/signout', {
        method: 'POST',
      });
      
      if (response.ok) {
        window.location.href = '/auth/signin';
      } else {
        console.error('Sign out failed');
      }
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleSignIn = () => {
    window.location.href = '/auth/signin';
  };

  const settingsItems = [
    {
      icon: <User className="h-5 w-5" />,
      title: 'Profile Settings',
      description: 'Manage your account information',
      action: () => console.log('Profile settings clicked')
    },
    {
      icon: <Key className="h-5 w-5" />,
      title: 'API Keys',
      description: 'Manage your API keys and tokens',
      action: () => console.log('API keys clicked')
    },
    {
      icon: <Shield className="h-5 w-5" />,
      title: 'Security',
      description: 'Password, 2FA, and security settings',
      action: () => console.log('Security clicked')
    },
    {
      icon: <Bell className="h-5 w-5" />,
      title: 'Notifications',
      description: 'Email and push notification preferences',
      action: () => setNotifications(!notifications)
    },
    {
      icon: <Globe className="h-5 w-5" />,
      title: 'Preferences',
      description: 'Language, timezone, and display settings',
      action: () => console.log('Preferences clicked')
    },
    {
      icon: <Database className="h-5 w-5" />,
      title: 'Data Management',
      description: 'Export, backup, and data settings',
      action: () => console.log('Data management clicked')
    }
  ];

  return (
    <Card className="col-span-1">
      <CardHeader>
        <div className="flex items-center space-x-3">
          <Settings className="h-6 w-6 text-gray-600 dark:text-gray-400" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Settings & Account
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Manage your account and preferences
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* User Info */}
        {isAuthenticated && user && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user.name || 'Super Admin'}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {user.email}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="space-y-2">
          {!isAuthenticated ? (
            <Button 
              onClick={handleSignIn}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <LogIn className="h-4 w-4 mr-2" />
              Sign In
            </Button>
          ) : (
            <Button 
              onClick={handleSignOut}
              variant="outline"
              className="w-full text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          )}
        </div>

        {/* Theme Toggle */}
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center space-x-3">
            {isDarkMode ? (
              <Moon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            ) : (
              <Sun className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            )}
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Dark Mode
            </span>
          </div>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isDarkMode ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isDarkMode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Settings Items */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Quick Settings
          </h4>
          {settingsItems.map((item, index) => (
            <button
              key={index}
              onClick={item.action}
              className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="text-gray-600 dark:text-gray-400">
                {item.icon}
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {item.title}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {item.description}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Notification Toggle */}
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center space-x-3">
            <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Notifications
            </span>
          </div>
          <button
            onClick={() => setNotifications(!notifications)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              notifications ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                notifications ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
