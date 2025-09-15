"use client";

import React, { useState, useEffect } from 'react';
import { sessionDebugger, SessionDebugInfo } from '@/utils/sessionDebugger';
import { XIcon, BugIcon, DownloadIcon, TrashIcon } from '@/icons';

export function SessionDebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<SessionDebugInfo[]>([]);
  const [activeTab, setActiveTab] = useState<'session' | 'cookies' | 'diagnosis'>('session');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    const updateLogs = () => {
      setLogs(sessionDebugger.getLogs());
    };

    updateLogs();

    if (autoRefresh) {
      const interval = setInterval(updateLogs, 1000);
      return () => clearInterval(interval);
    }
  }, [isOpen, autoRefresh]);

  const handleExportLogs = () => {
    const logsData = sessionDebugger.exportLogs();
    const blob = new Blob([logsData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `session-debug-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClearLogs = () => {
    sessionDebugger.clearLogs();
    setLogs([]);
  };

  const issues = sessionDebugger.diagnoseSessionIssues();

  return (
    <div className={`fixed bottom-4 left-4 z-50 ${isOpen ? 'w-96' : 'w-12 h-12'}`}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute -top-1 -left-1 bg-red-600 text-white rounded-full p-2 shadow-lg z-10"
        aria-label={isOpen ? 'Close session debug panel' : 'Open session debug panel'}
      >
        <BugIcon className="w-6 h-6" />
      </button>

      {isOpen && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Session Debug</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleExportLogs}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                aria-label="Export logs"
              >
                <DownloadIcon className="w-4 h-4" />
              </button>
              <button
                onClick={handleClearLogs}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                aria-label="Clear logs"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                aria-label="Close session debug panel"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Controls */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              <span className="text-gray-700 dark:text-gray-300">Auto-refresh</span>
            </label>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            {[
              { id: 'session', label: 'Session', count: logs.length },
              { id: 'cookies', label: 'Cookies', count: Object.keys(logs[0]?.cookies || {}).length },
              { id: 'diagnosis', label: 'Issues', count: issues.length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'session' | 'cookies' | 'diagnosis')}
                className={`flex-1 px-3 py-2 text-sm font-medium ${
                  activeTab === tab.id
                    ? 'text-red-600 border-b-2 border-red-600 dark:text-red-400 dark:border-red-400'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="p-3 max-h-64 overflow-y-auto">
            {activeTab === 'session' && (
              <div className="space-y-2">
                {logs.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">No session logs yet.</p>
                ) : (
                  logs.map((log, index) => (
                    <div key={index} className="bg-gray-50 dark:bg-gray-700 p-2 rounded text-sm">
                      <div className="flex justify-between items-start">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {log.event}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                      <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                        Session: {log.hasSession ? '✅' : '❌'} | User: {log.hasUser ? '✅' : '❌'}
                      </div>
                      {log.sessionId && log.sessionId !== 'none' && (
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          ID: {log.sessionId.substring(0, 8)}...
                        </div>
                      )}
                      {log.additionalData && Object.keys(log.additionalData).length > 0 && (
                        <details className="mt-1">
                          <summary className="text-xs text-blue-600 dark:text-blue-400 cursor-pointer">
                            Details
                          </summary>
                          <pre className="text-xs text-gray-500 dark:text-gray-400 mt-1 overflow-x-auto">
                            {JSON.stringify(log.additionalData, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'cookies' && (
              <div className="space-y-2">
                {logs.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">No cookie data yet.</p>
                ) : (
                  Object.entries(logs[0]?.cookies || {}).map(([name, value]) => (
                    <div key={name} className="bg-gray-50 dark:bg-gray-700 p-2 rounded text-sm">
                      <div className="font-medium text-gray-900 dark:text-white">{name}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-300 mt-1 break-all">
                        {value.length > 50 ? `${value.substring(0, 50)}...` : value}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Length: {value.length} chars
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'diagnosis' && (
              <div className="space-y-2">
                {issues.length === 0 ? (
                  <div className="text-green-600 dark:text-green-400 text-sm">
                    ✅ No session issues detected
                  </div>
                ) : (
                  issues.map((issue, index) => (
                    <div key={index} className="bg-red-50 dark:bg-red-900/20 p-2 rounded text-sm text-red-800 dark:text-red-400">
                      ⚠️ {issue}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
