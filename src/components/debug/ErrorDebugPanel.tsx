'use client';

import React, { useState, useEffect } from 'react';
import { useErrorLogger } from '@/hooks/useErrorLogger';

interface ErrorDebugPanelProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

export function ErrorDebugPanel({ isOpen = false, onToggle }: ErrorDebugPanelProps) {
  const [isVisible, setIsVisible] = useState(isOpen);
  const [activeTab, setActiveTab] = useState<'errors' | 'warnings' | 'environment'>('environment');
  const { getStoredErrors, getStoredWarnings, checkEnvironment, clearStoredLogs } = useErrorLogger({
    componentName: 'ErrorDebugPanel',
    autoCheckEnvironment: false,
  });

  const [errors, setErrors] = useState<any[]>([]);
  const [warnings, setWarnings] = useState<any[]>([]);
  const [envChecks, setEnvChecks] = useState<any[]>([]);

  useEffect(() => {
    if (isVisible) {
      setErrors(getStoredErrors());
      setWarnings(getStoredWarnings());
      setEnvChecks(checkEnvironment());
    }
  }, [isVisible, getStoredErrors, getStoredWarnings, checkEnvironment]);

  const handleClearLogs = () => {
    clearStoredLogs();
    setErrors([]);
    setWarnings([]);
  };

  const handleRefresh = () => {
    setErrors(getStoredErrors());
    setWarnings(getStoredWarnings());
    setEnvChecks(checkEnvironment());
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-red-500 text-white p-3 rounded-full shadow-lg hover:bg-red-600 transition-colors z-50"
        title="Open Error Debug Panel"
      >
        🐛
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-96 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          🐛 Debug Panel
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleRefresh}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            title="Refresh"
          >
            🔄
          </button>
          <button
            onClick={handleClearLogs}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            title="Clear Logs"
          >
            🧹
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            title="Close"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {[
          { id: 'environment', label: 'Environment', count: envChecks.filter(c => c.status !== 'valid').length },
          { id: 'errors', label: 'Errors', count: errors.length },
          { id: 'warnings', label: 'Warnings', count: warnings.length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 px-3 py-2 text-sm font-medium ${
              activeTab === tab.id
                ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            {tab.label} {tab.count > 0 && `(${tab.count})`}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-3 max-h-64 overflow-y-auto">
        {activeTab === 'environment' && (
          <div className="space-y-2">
            {envChecks.map((check, index) => (
              <div
                key={index}
                className={`p-2 rounded text-sm ${
                  check.status === 'valid'
                    ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                    : check.status === 'missing'
                    ? 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                    : 'bg-yellow-50 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                }`}
              >
                <div className="font-medium">{check.name}</div>
                <div className="text-xs opacity-75">{check.description}</div>
                <div className="text-xs mt-1">
                  Status: <span className="font-medium">{check.status}</span>
                </div>
                {check.value && (
                  <div className="text-xs mt-1 font-mono">
                    Value: {check.value.substring(0, 30)}...
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'errors' && (
          <div className="space-y-2">
            {errors.length === 0 ? (
              <div className="text-gray-500 dark:text-gray-400 text-sm">
                No errors logged
              </div>
            ) : (
              errors.map((error, index) => (
                <div
                  key={index}
                  className="p-2 bg-red-50 dark:bg-red-900/20 rounded text-sm"
                >
                  <div className="font-medium text-red-800 dark:text-red-400">
                    {error.message}
                  </div>
                  {error.context?.component && (
                    <div className="text-xs text-red-600 dark:text-red-500">
                      Component: {error.context.component}
                    </div>
                  )}
                  {error.context?.action && (
                    <div className="text-xs text-red-600 dark:text-red-500">
                      Action: {error.context.action}
                    </div>
                  )}
                  <div className="text-xs text-red-600 dark:text-red-500 mt-1">
                    {new Date(error.context?.timestamp).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'warnings' && (
          <div className="space-y-2">
            {warnings.length === 0 ? (
              <div className="text-gray-500 dark:text-gray-400 text-sm">
                No warnings logged
              </div>
            ) : (
              warnings.map((warning, index) => (
                <div
                  key={index}
                  className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-sm"
                >
                  <div className="font-medium text-yellow-800 dark:text-yellow-400">
                    {warning.message}
                  </div>
                  {warning.context?.component && (
                    <div className="text-xs text-yellow-600 dark:text-yellow-500">
                      Component: {warning.context.component}
                    </div>
                  )}
                  {warning.context?.action && (
                    <div className="text-xs text-yellow-600 dark:text-yellow-500">
                      Action: {warning.context.action}
                    </div>
                  )}
                  <div className="text-xs text-yellow-600 dark:text-yellow-500 mt-1">
                    {new Date(warning.context?.timestamp).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
