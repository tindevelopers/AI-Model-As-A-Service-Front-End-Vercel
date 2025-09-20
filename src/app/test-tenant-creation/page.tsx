'use client'

import React, { useState } from 'react';
import Button from '@/components/ui/button/Button';

export default function TestTenantCreation() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleCreateTenant = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const payload = {
        name: 'Test Tenant ' + Date.now(),
        slug: 'test-tenant-' + Date.now(),
        description: 'Test tenant created via direct API call',
        owner_user_id: null
      };

      const response = await fetch('/api/admin/tenants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult(`✅ Success: ${JSON.stringify(data, null, 2)}`);
      } else {
        setResult(`❌ Error (${response.status}): ${JSON.stringify(data, null, 2)}`);
      }
    } catch (error) {
      setResult(`❌ Network Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Test Tenant Creation
        </h1>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            This page tests tenant creation directly via the API endpoint.
            It will show the exact error message if authentication fails.
          </p>
          
          <Button 
            onClick={handleCreateTenant}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? 'Creating...' : 'Create Test Tenant'}
          </Button>
          
          {result && (
            <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <h3 className="font-semibold mb-2">API Response:</h3>
              <pre className="text-sm overflow-auto">{result}</pre>
            </div>
          )}
        </div>
        
        <div className="mt-8 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
            Test Credentials:
          </h3>
          <p className="text-yellow-700 dark:text-yellow-300 text-sm">
            Email: <code>superadmin@tin.info</code><br/>
            Password: <code>password123</code>
          </p>
          <p className="text-yellow-700 dark:text-yellow-300 text-sm mt-2">
            <a href="/signin" className="underline">Go to Sign In</a> to authenticate first.
          </p>
        </div>
      </div>
    </div>
  );
}
