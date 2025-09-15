/**
 * React Hook for Error Logging
 * Provides easy access to error logging functionality in React components
 */

import { useCallback, useEffect } from 'react';
import { errorLogger, ErrorContext } from '@/utils/errorLogger';

export interface UseErrorLoggerOptions {
  componentName?: string;
  autoCheckEnvironment?: boolean;
  logComponentMount?: boolean;
}

export function useErrorLogger(options: UseErrorLoggerOptions = {}) {
  const {
    componentName = 'UnknownComponent',
    autoCheckEnvironment = true,
    logComponentMount = false,
  } = options;

  // Auto-check environment on mount
  useEffect(() => {
    if (autoCheckEnvironment) {
      errorLogger.logEnvironmentCheck();
    }
    
    if (logComponentMount) {
      errorLogger.logSuccess(`Component ${componentName} mounted`, {
        component: componentName,
        action: 'mount',
      });
    }

    // Cleanup on unmount
    return () => {
      if (logComponentMount) {
        errorLogger.logSuccess(`Component ${componentName} unmounted`, {
          component: componentName,
          action: 'unmount',
        });
      }
    };
  }, [componentName, autoCheckEnvironment, logComponentMount]);

  // Wrapped logging functions with component context
  const logError = useCallback((error: Error | string, context?: Partial<ErrorContext>) => {
    errorLogger.logError(error, {
      component: componentName,
      ...context,
    });
  }, [componentName]);

  const logWarning = useCallback((message: string, context?: Partial<ErrorContext>) => {
    errorLogger.logWarning(message, {
      component: componentName,
      ...context,
    });
  }, [componentName]);

  const logSuccess = useCallback((message: string, context?: Partial<ErrorContext>) => {
    errorLogger.logSuccess(message, {
      component: componentName,
      ...context,
    });
  }, [componentName]);

  const checkEnvironment = useCallback(() => {
    return errorLogger.checkEnvironment();
  }, []);

  const logEnvironmentCheck = useCallback(() => {
    errorLogger.logEnvironmentCheck();
  }, []);

  const getStoredErrors = useCallback(() => {
    return errorLogger.getStoredErrors();
  }, []);

  const getStoredWarnings = useCallback(() => {
    return errorLogger.getStoredWarnings();
  }, []);

  const clearStoredLogs = useCallback(() => {
    errorLogger.clearStoredLogs();
  }, []);

  return {
    logError,
    logWarning,
    logSuccess,
    checkEnvironment,
    logEnvironmentCheck,
    getStoredErrors,
    getStoredWarnings,
    clearStoredLogs,
  };
}
