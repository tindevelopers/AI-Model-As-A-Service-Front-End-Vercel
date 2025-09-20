'use client'

import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card/Card';
import { 
  Zap, 
  Users, 
  Key, 
  TrendingUp,
  DollarSign,
  Server,
  Shield
} from 'lucide-react';

interface StatItem {
  title: string;
  value: string | number;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
  color: string;
}

const mockStats: StatItem[] = [
  {
    title: 'API Requests Today',
    value: '2.4M',
    change: '+12.5%',
    changeType: 'positive',
    icon: <Zap className="h-5 w-5" />,
    color: 'blue'
  },
  {
    title: 'Active Users',
    value: '1,247',
    change: '+8.2%',
    changeType: 'positive',
    icon: <Users className="h-5 w-5" />,
    color: 'green'
  },
  {
    title: 'API Keys',
    value: '89',
    change: '+3',
    changeType: 'positive',
    icon: <Key className="h-5 w-5" />,
    color: 'purple'
  },
  {
    title: 'Revenue (MTD)',
    value: '$12.4K',
    change: '+15.3%',
    changeType: 'positive',
    icon: <DollarSign className="h-5 w-5" />,
    color: 'emerald'
  },
  {
    title: 'System Uptime',
    value: '99.9%',
    change: '+0.1%',
    changeType: 'positive',
    icon: <Server className="h-5 w-5" />,
    color: 'green'
  },
  {
    title: 'Security Events',
    value: '3',
    change: '-2',
    changeType: 'positive',
    icon: <Shield className="h-5 w-5" />,
    color: 'red'
  }
];

const getColorClasses = (color: string) => {
  switch (color) {
    case 'blue':
      return {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        icon: 'text-blue-600 dark:text-blue-400',
        text: 'text-blue-900 dark:text-blue-100'
      };
    case 'green':
      return {
        bg: 'bg-green-50 dark:bg-green-900/20',
        icon: 'text-green-600 dark:text-green-400',
        text: 'text-green-900 dark:text-green-100'
      };
    case 'purple':
      return {
        bg: 'bg-purple-50 dark:bg-purple-900/20',
        icon: 'text-purple-600 dark:text-purple-400',
        text: 'text-purple-900 dark:text-purple-100'
      };
    case 'emerald':
      return {
        bg: 'bg-emerald-50 dark:bg-emerald-900/20',
        icon: 'text-emerald-600 dark:text-emerald-400',
        text: 'text-emerald-900 dark:text-emerald-100'
      };
    case 'red':
      return {
        bg: 'bg-red-50 dark:bg-red-900/20',
        icon: 'text-red-600 dark:text-red-400',
        text: 'text-red-900 dark:text-red-100'
      };
    default:
      return {
        bg: 'bg-gray-50 dark:bg-gray-900/20',
        icon: 'text-gray-600 dark:text-gray-400',
        text: 'text-gray-900 dark:text-gray-100'
      };
  }
};

const getChangeColor = (changeType: StatItem['changeType']) => {
  switch (changeType) {
    case 'positive':
      return 'text-green-600 dark:text-green-400';
    case 'negative':
      return 'text-red-600 dark:text-red-400';
    case 'neutral':
    default:
      return 'text-gray-600 dark:text-gray-400';
  }
};

export default function QuickStatsCard() {
  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <div className="flex items-center space-x-3">
          <TrendingUp className="h-6 w-6 text-indigo-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Quick Statistics
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Key performance indicators and metrics
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mockStats.map((stat, index) => {
            const colors = getColorClasses(stat.color);
            return (
              <div key={index} className={`${colors.bg} rounded-lg p-4`}>
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg bg-white dark:bg-gray-800 ${colors.icon}`}>
                    {stat.icon}
                  </div>
                  <span className={`text-sm font-medium ${getChangeColor(stat.changeType)}`}>
                    {stat.change}
                  </span>
                </div>
                <div className={`text-2xl font-bold ${colors.text} mb-1`}>
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {stat.title}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              Last updated: 2 minutes ago
            </span>
            <button className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
              View Detailed Analytics →
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
