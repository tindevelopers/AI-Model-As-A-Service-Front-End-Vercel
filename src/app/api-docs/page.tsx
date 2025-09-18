"use client";
import { useState } from 'react';
import { CopyIcon } from '@/icons';

export default function ApiDocsPage() {
  const [selectedEndpoint, setSelectedEndpoint] = useState('chat');
  const [apiKey, setApiKey] = useState('');
  const [requestBody, setRequestBody] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const endpoints = {
    chat: {
      name: 'Chat Completion',
      method: 'POST',
      path: '/v1/chat/completions',
      description: 'Generate chat completions using AI models'
    },
    text: {
      name: 'Text Generation',
      method: 'POST',
      path: '/v1/text/generate',
      description: 'Generate text completions'
    },
    embeddings: {
      name: 'Text Embeddings',
      method: 'POST',
      path: '/v1/embeddings',
      description: 'Generate text embeddings for semantic search'
    }
  };

  const exampleRequests = {
    chat: {
      model: 'gpt-4',
      messages: [
        {
          role: 'user',
          content: 'Hello, how are you?'
        }
      ],
      max_tokens: 150,
      temperature: 0.7
    },
    text: {
      model: 'gpt-3.5-turbo',
      prompt: 'Write a short story about a robot',
      max_tokens: 200,
      temperature: 0.8
    },
    embeddings: {
      model: 'text-embedding-ada-002',
      input: 'The quick brown fox jumps over the lazy dog'
    }
  };

  const testApiCall = async () => {
    if (!apiKey.trim()) {
      alert('Please enter your API key');
      return;
    }

    setLoading(true);
    setResponse('');

    try {
      const endpoint = endpoints[selectedEndpoint as keyof typeof endpoints];
      const url = `https://your-ai-api.run.app${endpoint.path}`;
      
      const requestData = requestBody ? JSON.parse(requestBody) : exampleRequests[selectedEndpoint as keyof typeof exampleRequests];

      const response = await fetch(url, {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'X-API-Key': apiKey
        },
        body: JSON.stringify(requestData)
      });

      const data = await response.json();
      setResponse(JSON.stringify(data, null, 2));
    } catch (error) {
      setResponse(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const generateCurlCommand = () => {
    const endpoint = endpoints[selectedEndpoint as keyof typeof endpoints];
    const requestData = requestBody ? JSON.parse(requestBody) : exampleRequests[selectedEndpoint as keyof typeof exampleRequests];
    
    return `curl -X ${endpoint.method} \\
  https://your-ai-api.run.app${endpoint.path} \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${apiKey || 'YOUR_API_KEY'}" \\
  -d '${JSON.stringify(requestData, null, 2)}'`;
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">AI API Documentation</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Test and integrate with our AI API endpoints
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Documentation */}
        <div className="space-y-6">
          {/* API Key Input */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">API Key</h2>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your API key"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Get your API key from the <a href="/api-management" className="text-blue-600 hover:underline">API Management</a> page
            </p>
          </div>

          {/* Endpoint Selection */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Endpoints</h2>
            <div className="space-y-3">
              {Object.entries(endpoints).map(([key, endpoint]) => (
                <div
                  key={key}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedEndpoint === key
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                  onClick={() => setSelectedEndpoint(key)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{endpoint.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{endpoint.description}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded ${
                      endpoint.method === 'POST'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    }`}>
                      {endpoint.method}
                    </span>
                  </div>
                  <code className="text-sm text-gray-600 dark:text-gray-400 mt-2 block">
                    {endpoint.path}
                  </code>
                </div>
              ))}
            </div>
          </div>

          {/* Request Body */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Request Body</h2>
              <button
                onClick={() => setRequestBody(JSON.stringify(exampleRequests[selectedEndpoint as keyof typeof exampleRequests], null, 2))}
                className="text-sm text-blue-600 hover:underline"
              >
                Use Example
              </button>
            </div>
            <textarea
              value={requestBody}
              onChange={(e) => setRequestBody(e.target.value)}
              placeholder="Enter JSON request body"
              rows={12}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white font-mono text-sm"
            />
          </div>

          {/* cURL Command */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">cURL Command</h2>
              <button
                onClick={() => copyToClipboard(generateCurlCommand())}
                className="flex items-center space-x-1 text-sm text-blue-600 hover:underline"
              >
                <CopyIcon className="w-4 h-4" />
                <span>Copy</span>
              </button>
            </div>
            <pre className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg text-sm overflow-x-auto">
              <code>{generateCurlCommand()}</code>
            </pre>
          </div>
        </div>

        {/* Right Column - Testing */}
        <div className="space-y-6">
          {/* Test Button */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Test API Call</h2>
            <button
              onClick={testApiCall}
              disabled={loading || !apiKey.trim()}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Testing...' : 'Test API Call'}
            </button>
          </div>

          {/* Response */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Response</h2>
              {response && (
                <button
                  onClick={() => copyToClipboard(response)}
                  className="flex items-center space-x-1 text-sm text-blue-600 hover:underline"
                >
                  <CopyIcon className="w-4 h-4" />
                  <span>Copy</span>
                </button>
              )}
            </div>
            <pre className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg text-sm overflow-x-auto min-h-[300px]">
              <code>{response || 'Response will appear here...'}</code>
            </pre>
          </div>

          {/* Rate Limits */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Rate Limits</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Free Tier</span>
                <span className="font-medium text-gray-900 dark:text-white">100 requests/hour</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Pro Tier</span>
                <span className="font-medium text-gray-900 dark:text-white">1,000 requests/hour</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Enterprise</span>
                <span className="font-medium text-gray-900 dark:text-white">Custom limits</span>
              </div>
            </div>
          </div>

          {/* SDKs */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">SDKs & Libraries</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Python</span>
                <button
                  onClick={() => copyToClipboard('pip install ai-api-client')}
                  className="text-sm text-blue-600 hover:underline"
                >
                  pip install ai-api-client
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Node.js</span>
                <button
                  onClick={() => copyToClipboard('npm install ai-api-client')}
                  className="text-sm text-blue-600 hover:underline"
                >
                  npm install ai-api-client
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">cURL</span>
                <button
                  onClick={() => copyToClipboard('curl -X POST https://your-ai-api.run.app/v1/chat/completions')}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Copy example
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
