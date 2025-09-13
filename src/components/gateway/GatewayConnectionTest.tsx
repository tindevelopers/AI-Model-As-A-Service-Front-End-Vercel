'use client'

import { useState } from 'react'
import { gatewayApi } from '@/lib/gateway-api'
import Button from '@/components/ui/button/Button'

interface TestResult {
  success: boolean
  message: string
  data?: unknown
}

export default function GatewayConnectionTest() {
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<TestResult | null>(null)

  const testConnection = async () => {
    setTesting(true)
    setResult(null)

    try {
      const response = await gatewayApi.testConnection()
      
      if (response.success) {
        setResult({
          success: true,
          message: 'Gateway connection successful!',
          data: response.data
        })
      } else {
        setResult({
          success: false,
          message: response.error || 'Connection failed'
        })
      }
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    } finally {
      setTesting(false)
    }
  }

  const testModels = async () => {
    setTesting(true)
    setResult(null)

    try {
      const response = await gatewayApi.getModels()
      
      if (response.success) {
        setResult({
          success: true,
          message: `Found ${response.data?.length || 0} available models`,
          data: response.data
        })
      } else {
        setResult({
          success: false,
          message: response.error || 'Failed to fetch models'
        })
      }
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/3">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Gateway Connection Test
      </h3>
      
      <div className="space-y-4">
        <div className="flex gap-3">
          <Button
            onClick={testConnection}
            disabled={testing}
            variant="outline"
          >
            {testing ? 'Testing...' : 'Test Connection'}
          </Button>
          
          <Button
            onClick={testModels}
            disabled={testing}
          >
            {testing ? 'Loading...' : 'Test Models API'}
          </Button>
        </div>

        {result && (
          <div className={`rounded-lg p-4 ${
            result.success 
              ? 'bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800' 
              : 'bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800'
          }`}>
            <div className={`text-sm font-medium ${
              result.success 
                ? 'text-green-800 dark:text-green-400' 
                : 'text-red-800 dark:text-red-400'
            }`}>
              {result.message}
            </div>
            
            {result.data != null && (
              <details className="mt-2">
                <summary className={`cursor-pointer text-xs ${
                  result.success 
                    ? 'text-green-600 dark:text-green-500' 
                    : 'text-red-600 dark:text-red-500'
                }`}>
                  View Details
                </summary>
                <pre className={`mt-2 text-xs overflow-auto ${
                  result.success 
                    ? 'text-green-700 dark:text-green-400' 
                    : 'text-red-700 dark:text-red-400'
                }`}>
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </details>
            )}
          </div>
        )}

        <div className="text-sm text-gray-600 dark:text-gray-400">
          <p><strong>Backend:</strong> Connected to AI Gateway at:</p>
          <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
            https://ai-gateway-170185267560.us-central1.run.app
          </code>
          <p className="mt-2"><strong>Available endpoints:</strong> /health, /v1/models, /v1/chat/completions, /v1/api-keys</p>
        </div>
      </div>
    </div>
  )
}