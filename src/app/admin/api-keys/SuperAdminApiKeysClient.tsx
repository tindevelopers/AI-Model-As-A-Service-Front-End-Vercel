'use client'

import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card/Card';
import Button from '@/components/ui/button/Button';
import { 
  Key, 
  Building2, 
  Settings,
  Plus,
  Eye,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Activity,
  BarChart3,
  Search,
  CheckCircle,
  XCircle,
  Globe
} from 'lucide-react';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
}

interface PlatformApi {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'maintenance';
}

interface ApiKey {
  id: string;
  tenant_id: string;
  name: string;
  key_prefix: string;
  permissions: string[];
  is_active: boolean;
  last_used_at?: string;
  expires_at?: string;
  created_at: string;
  tenants: {
    name: string;
    slug: string;
    is_active: boolean;
  };
  user_profiles?: {
    email: string;
    full_name?: string;
  };
}

interface SuperAdminApiKeysClientProps {
  initialApiKeys: ApiKey[];
  initialTenants: Tenant[];
  platformApis: PlatformApi[];
}

export default function SuperAdminApiKeysClient({
  initialApiKeys,
  initialTenants,
  platformApis
}: SuperAdminApiKeysClientProps) {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(initialApiKeys);
  const [tenants] = useState<Tenant[]>(initialTenants);
  const [activeTab, setActiveTab] = useState<'overview' | 'tenant-keys' | 'platform-apis' | 'usage-analytics'>('overview');
  const [selectedTenant, setSelectedTenant] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter API keys based on selected tenant and search term
  const filteredApiKeys = apiKeys.filter(key => {
    const matchesTenant = selectedTenant === 'all' || key.tenant_id === selectedTenant;
    const matchesSearch = searchTerm === '' || 
      key.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      key.tenants.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      key.key_prefix.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTenant && matchesSearch;
  });

  // Calculate statistics
  const totalApiKeys = apiKeys.length;
  const activeApiKeys = apiKeys.filter(key => key.is_active).length;
  const expiredApiKeys = apiKeys.filter(key => key.expires_at && new Date(key.expires_at) < new Date()).length;
  const tenantCount = new Set(apiKeys.map(key => key.tenant_id)).size;

  const handleToggleApiKey = async (keyId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/api-keys/${keyId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          is_active: !currentStatus
        })
      });

      if (response.ok) {
        setApiKeys(prev => prev.map(key => 
          key.id === keyId ? { ...key, is_active: !currentStatus } : key
        ));
      }
    } catch (error) {
      console.error('Error toggling API key:', error);
    }
  };


  const getApiStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'tenant-keys', label: 'Tenant API Keys', icon: Key },
            { id: 'platform-apis', label: 'Platform APIs', icon: Globe },
            { id: 'usage-analytics', label: 'Usage Analytics', icon: Activity }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'overview' | 'tenant-keys' | 'platform-apis' | 'usage-analytics')}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total API Keys</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalApiKeys}</p>
                  </div>
                  <Key className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Keys</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{activeApiKeys}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tenants with Keys</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{tenantCount}</p>
                  </div>
                  <Building2 className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Expired Keys</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">{expiredApiKeys}</p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Platform APIs Status */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Platform API Services</h3>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {platformApis.map((api) => (
                  <div key={api.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-white">{api.name}</h4>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getApiStatusColor(api.status)}`}>
                        {api.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{api.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent API Key Activity</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {apiKeys.slice(0, 5).map((key) => (
                  <div key={key.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full ${key.is_active ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'}`}>
                        <Key className={`h-4 w-4 ${key.is_active ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{key.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {key.tenants.name} • {key.key_prefix}...
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {key.last_used_at ? new Date(key.last_used_at).toLocaleDateString() : 'Never used'}
                      </p>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${key.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'}`}>
                        {key.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tenant API Keys Tab */}
      {activeTab === 'tenant-keys' && (
        <div className="space-y-6">
          {/* Filters and Actions */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search API keys..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <select
                value={selectedTenant}
                onChange={(e) => setSelectedTenant(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="all">All Tenants</option>
                {tenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
                ))}
              </select>
            </div>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create API Key
            </Button>
          </div>

          {/* API Keys Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">API Key</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tenant</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Permissions</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Last Used</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredApiKeys.map((key) => (
                      <tr key={key.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{key.name}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{key.key_prefix}...</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <Building2 className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-900 dark:text-white">{key.tenants.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-1">
                            {key.permissions.map((permission) => (
                              <span key={permission} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                                {permission}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleToggleApiKey(key.id, key.is_active)}
                            className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                              key.is_active
                                ? 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400'
                                : 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400'
                            }`}
                          >
                            {key.is_active ? <ToggleRight className="h-3 w-3" /> : <ToggleLeft className="h-3 w-3" />}
                            <span>{key.is_active ? 'Active' : 'Inactive'}</span>
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {key.last_used_at ? new Date(key.last_used_at).toLocaleDateString() : 'Never'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                              <Eye className="h-4 w-4" />
                            </button>
                            <button className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300">
                              <Edit className="h-4 w-4" />
                            </button>
                            <button className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Platform APIs Tab */}
      {activeTab === 'platform-apis' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Platform API Services Management</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Manage which APIs are available to tenants and their access levels
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {platformApis.map((api) => (
                  <div key={api.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                          <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h4 className="text-lg font-medium text-gray-900 dark:text-white">{api.name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{api.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getApiStatusColor(api.status)}`}>
                          {api.status}
                        </span>
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4 mr-2" />
                          Configure
                        </Button>
                      </div>
                    </div>
                    
                    {/* Tenant Access Matrix */}
                    <div className="mt-4">
                      <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Tenant Access</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {tenants.slice(0, 6).map((tenant) => (
                          <div key={tenant.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <span className="text-sm text-gray-900 dark:text-white">{tenant.name}</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-green-600 dark:text-green-400">Enabled</span>
                              <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                <Settings className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Usage Analytics Tab */}
      {activeTab === 'usage-analytics' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">API Usage Analytics</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Monitor API usage across all tenants and services
              </p>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Usage Analytics Coming Soon</h4>
                <p className="text-gray-600 dark:text-gray-400">
                  Detailed usage analytics and reporting will be available here
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
