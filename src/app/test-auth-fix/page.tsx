"use client";

import { useState } from 'react';

export default function TestAuthFixPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testAuthFix = async () => {
    if (!email) return;
    
    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/test-auth-fix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: 'Failed to send test magic link', details: error });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
            Test Auth Fix
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Test the improved magic link authentication flow
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              placeholder="Enter your email"
            />
          </div>

          <button
            onClick={testAuthFix}
            disabled={loading || !email}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending...' : 'Test Magic Link'}
          </button>
        </div>

        {result && (
          <div className={`rounded-md p-4 ${
            result.error 
              ? 'bg-red-50 dark:bg-red-900/20' 
              : 'bg-green-50 dark:bg-green-900/20'
          }`}>
            <div className={`text-sm ${
              result.error 
                ? 'text-red-800 dark:text-red-400' 
                : 'text-green-800 dark:text-green-400'
            }`}>
              {result.error ? (
                <div>
                  <p className="font-medium">Error:</p>
                  <p>{result.error}</p>
                  {result.details && (
                    <details className="mt-2">
                      <summary className="cursor-pointer">Details</summary>
                      <pre className="mt-1 text-xs overflow-x-auto">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ) : (
                <div>
                  <p className="font-medium">✅ Success!</p>
                  <p>{result.message}</p>
                  {result.improvements && (
                    <div className="mt-2">
                      <p className="font-medium">Improvements Applied:</p>
                      <ul className="list-disc list-inside mt-1">
                        {result.improvements.map((improvement: string, index: number) => (
                          <li key={index}>{improvement}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Check your email for the magic link and test the authentication flow
          </p>
        </div>
      </div>
    </div>
  );
}
