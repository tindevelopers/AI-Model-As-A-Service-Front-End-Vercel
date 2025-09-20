'use client'

import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card/Card';
import { 
  Activity, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  Zap,
  Users,
  Key,
  Building2
} from 'lucide-react';

interface ActionItem {
  id: string;
  type: 'success' | 'warning' | 'info' | 'error';
  title: string;
  description: string;
  timestamp: string;
  icon: React.ReactNode;
}

const mockActions: ActionItem[] = [
  {
    id: '1',
    type: 'success',
    title: 'New Tenant Created',
    description: 'Acme Corp tenant was successfully created',
    timestamp: '2 minutes ago',
    icon: <Building2 className="h-4 w-4" />
  },
  {
    id: '2',
    type: 'info',
    title: 'API Key Generated',
    description: 'New API key created for TechStart Inc',
    timestamp: '5 minutes ago',
    icon: <Key className="h-4 w-4" />
  },
  {
    id: '3',
    type: 'warning',
    title: 'High Usage Alert',
    description: 'DataFlow Solutions approaching monthly limit',
    timestamp: '12 minutes ago',
    icon: <AlertTriangle className="h-4 w-4" />
  },
  {
    id: '4',
    type: 'success',
    title: 'User Invited',
    description: 'New user invited to InnovateLab tenant',
    timestamp: '18 minutes ago',
    icon: <Users className="h-4 w-4" />
  },
  {
    id: '5',
    type: 'info',
    title: 'System Optimization',
    description: 'Performance improvements deployed',
    timestamp: '1 hour ago',
    icon: <Zap className="h-4 w-4" />
  }
];

const getTypeStyles = (type: ActionItem['type']) => {
  switch (type) {
    case 'success':
      return {
        iconBg: 'bg-green-100 dark:bg-green-900/20',
        iconColor: 'text-green-600 dark:text-green-400',
        dotColor: 'bg-green-500'
      };
    case 'warning':
      return {
        iconBg: 'bg-yellow-100 dark:bg-yellow-900/20',
        iconColor: 'text-yellow-600 dark:text-yellow-400',
        dotColor: 'bg-yellow-500'
      };
    case 'error':
      return {
        iconBg: 'bg-red-100 dark:bg-red-900/20',
        iconColor: 'text-red-600 dark:text-red-400',
        dotColor: 'bg-red-500'
      };
    case 'info':
    default:
      return {
        iconBg: 'bg-blue-100 dark:bg-blue-900/20',
        iconColor: 'text-blue-600 dark:text-blue-400',
        dotColor: 'bg-blue-500'
      };
  }
};

export default function ActiveActionsCard() {
  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <div className="flex items-center space-x-3">
          <Activity className="h-6 w-6 text-purple-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Latest Active Actions
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Real-time system activity and events
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {mockActions.map((action, index) => {
            const styles = getTypeStyles(action.type);
            return (
              <div key={action.id} className="flex items-start space-x-3">
                {/* Timeline dot */}
                <div className="flex flex-col items-center">
                  <div className={`w-2 h-2 rounded-full ${styles.dotColor}`} />
                  {index < mockActions.length - 1 && (
                    <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 mt-2" />
                  )}
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <div className={`p-1 rounded-full ${styles.iconBg}`}>
                      <div className={styles.iconColor}>
                        {action.icon}
                      </div>
                    </div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                      {action.title}
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    {action.description}
                  </p>
                  <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-500">
                    <Clock className="h-3 w-3" />
                    <span>{action.timestamp}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button className="w-full text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
            View All Activities →
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
