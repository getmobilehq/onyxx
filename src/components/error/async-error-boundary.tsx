import React, { useEffect, useState } from 'react';
import { ErrorBoundary } from './error-boundary';

interface AsyncErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error) => void;
}

/**
 * Async Error Boundary for catching promise rejections
 */
export function AsyncErrorBoundary({ 
  children, 
  fallback, 
  onError 
}: AsyncErrorBoundaryProps) {
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = new Error(
        event.reason?.message || 'Unhandled Promise Rejection'
      );
      error.stack = event.reason?.stack;
      
      setError(error);
      
      if (onError) {
        onError(error);
      }
      
      // Prevent default browser error handling
      event.preventDefault();
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [onError]);

  // Throw error to be caught by nearest error boundary
  if (error) {
    throw error;
  }

  return <>{children}</>;
}

/**
 * Hook for manual async error handling
 */
export function useAsyncError() {
  const [, setError] = useState();
  
  return React.useCallback(
    (error: Error) => {
      setError(() => {
        throw error;
      });
    },
    []
  );
}

/**
 * Wrapper for async operations with error handling
 */
export async function withAsyncErrorHandling<T>(
  asyncFn: () => Promise<T>,
  onError?: (error: Error) => void
): Promise<T | undefined> {
  try {
    return await asyncFn();
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    
    if (onError) {
      onError(err);
    } else {
      console.error('Async operation failed:', err);
    }
    
    return undefined;
  }
}

/**
 * React Query error handler integration
 */
export function createQueryErrorHandler(throwError: (error: Error) => void) {
  return (error: unknown) => {
    const err = error instanceof Error 
      ? error 
      : new Error('Query failed: ' + String(error));
    
    // Don't throw for 401/403 errors (handle in auth context)
    if (err.message.includes('401') || err.message.includes('403')) {
      return;
    }
    
    // Throw error to be caught by error boundary
    throwError(err);
  };
}

export default AsyncErrorBoundary;