import React from 'react';
import { AlertCircle, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import { ApiResponse, ApiError } from '../../../shared-types';

/**
 * API Error types specific to Onyx Report
 */
export type ApiErrorType = 
  | 'network'
  | 'timeout' 
  | 'authentication'
  | 'authorization'
  | 'validation'
  | 'server'
  | 'not_found'
  | 'rate_limit'
  | 'unknown';

export interface OnyxApiError {
  type: ApiErrorType;
  message: string;
  code?: string;
  status?: number;
  details?: any;
  retryable?: boolean;
}

/**
 * Parse API error from response
 */
export function parseApiError(error: any): OnyxApiError {
  // Network/Connection errors
  if (!error.response && error.request) {
    return {
      type: 'network',
      message: 'Unable to connect to server. Check your internet connection.',
      retryable: true
    };
  }

  // Timeout errors
  if (error.code === 'ECONNABORTED') {
    return {
      type: 'timeout',
      message: 'Request timed out. The server is taking too long to respond.',
      retryable: true
    };
  }

  const status = error.response?.status;
  const data = error.response?.data;

  // Structured API error response
  if (data && typeof data === 'object') {
    const apiResponse = data as ApiResponse<any>;
    
    switch (status) {
      case 400:
        return {
          type: 'validation',
          message: apiResponse.error || 'Invalid request data',
          code: 'BAD_REQUEST',
          status,
          details: apiResponse.errors,
          retryable: false
        };

      case 401:
        return {
          type: 'authentication',
          message: 'Your session has expired. Please log in again.',
          code: 'UNAUTHORIZED',
          status,
          retryable: false
        };

      case 403:
        return {
          type: 'authorization',
          message: 'You don\'t have permission to perform this action.',
          code: 'FORBIDDEN',
          status,
          retryable: false
        };

      case 404:
        return {
          type: 'not_found',
          message: apiResponse.error || 'The requested resource was not found.',
          code: 'NOT_FOUND',
          status,
          retryable: false
        };

      case 409:
        return {
          type: 'validation',
          message: apiResponse.error || 'This action conflicts with existing data.',
          code: 'CONFLICT',
          status,
          details: apiResponse.errors,
          retryable: false
        };

      case 429:
        return {
          type: 'rate_limit',
          message: 'Too many requests. Please wait a moment and try again.',
          code: 'RATE_LIMITED',
          status,
          retryable: true
        };

      case 500:
      case 502:
      case 503:
      case 504:
        return {
          type: 'server',
          message: 'Server error occurred. Our team has been notified.',
          code: 'SERVER_ERROR',
          status,
          retryable: true
        };

      default:
        return {
          type: 'unknown',
          message: apiResponse.error || `An unexpected error occurred (${status})`,
          status,
          retryable: status >= 500
        };
    }
  }

  // Fallback for non-structured errors
  return {
    type: 'unknown',
    message: error.message || 'An unexpected error occurred',
    retryable: false
  };
}

/**
 * API Error Display Component
 */
interface ApiErrorDisplayProps {
  error: OnyxApiError;
  onRetry?: () => void;
  onDismiss?: () => void;
  variant?: 'alert' | 'card' | 'inline';
  showDetails?: boolean;
}

export function ApiErrorDisplay({ 
  error, 
  onRetry, 
  onDismiss,
  variant = 'alert',
  showDetails = false
}: ApiErrorDisplayProps) {
  const getErrorIcon = () => {
    switch (error.type) {
      case 'network':
        return <WifiOff className="h-4 w-4" />;
      case 'timeout':
        return <Wifi className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getErrorTitle = () => {
    switch (error.type) {
      case 'network':
        return 'Connection Error';
      case 'timeout':
        return 'Request Timeout';
      case 'authentication':
        return 'Authentication Required';
      case 'authorization':
        return 'Access Denied';
      case 'validation':
        return 'Validation Error';
      case 'not_found':
        return 'Not Found';
      case 'rate_limit':
        return 'Rate Limited';
      case 'server':
        return 'Server Error';
      default:
        return 'Error';
    }
  };

  const content = (
    <>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-2">
          {getErrorIcon()}
          <div className="flex-1">
            <AlertTitle className="text-sm font-medium">
              {getErrorTitle()}
            </AlertTitle>
            <AlertDescription className="mt-1 text-sm">
              {error.message}
              
              {/* Validation errors */}
              {error.details && Array.isArray(error.details) && (
                <ul className="mt-2 space-y-1">
                  {error.details.map((detail: any, index: number) => (
                    <li key={index} className="text-xs">
                      • {detail.field}: {detail.message}
                    </li>
                  ))}
                </ul>
              )}
            </AlertDescription>
          </div>
        </div>

        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="ml-2 h-6 w-6 p-0"
          >
            ×
          </Button>
        )}
      </div>

      {/* Action buttons */}
      {(onRetry && error.retryable) && (
        <div className="mt-3 flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onRetry}
            className="h-8 text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        </div>
      )}

      {/* Error details for development */}
      {showDetails && process.env.NODE_ENV === 'development' && (
        <details className="mt-3">
          <summary className="text-xs cursor-pointer text-gray-500">
            Technical Details
          </summary>
          <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-auto">
            {JSON.stringify(error, null, 2)}
          </pre>
        </details>
      )}
    </>
  );

  if (variant === 'card') {
    return (
      <Card className="p-4 border-red-200 bg-red-50 dark:bg-red-900/20">
        {content}
      </Card>
    );
  }

  if (variant === 'inline') {
    return (
      <div className="text-sm text-red-600 dark:text-red-400 p-2 bg-red-50 dark:bg-red-900/20 rounded">
        {content}
      </div>
    );
  }

  return (
    <Alert className="border-red-200">
      {content}
    </Alert>
  );
}

/**
 * Hook for handling API errors in components
 */
export function useApiErrorHandler() {
  const [error, setError] = React.useState<OnyxApiError | null>(null);

  const handleError = React.useCallback((err: any) => {
    const parsedError = parseApiError(err);
    setError(parsedError);

    // Auto-dismiss certain errors after a delay
    if (parsedError.type === 'rate_limit') {
      setTimeout(() => {
        setError(null);
      }, 5000);
    }
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    handleError,
    clearError
  };
}

/**
 * Global API error handler for axios interceptors
 */
export function createGlobalApiErrorHandler(
  onAuthenticationError?: () => void,
  onServerError?: (error: OnyxApiError) => void
) {
  return (error: any) => {
    const parsedError = parseApiError(error);

    // Handle authentication errors globally
    if (parsedError.type === 'authentication' && onAuthenticationError) {
      onAuthenticationError();
      return Promise.reject(parsedError);
    }

    // Handle server errors globally
    if (parsedError.type === 'server' && onServerError) {
      onServerError(parsedError);
    }

    // Log errors in development
    if (process.env.NODE_ENV === 'development') {
      console.error('API Error:', parsedError);
    }

    return Promise.reject(parsedError);
  };
}

/**
 * Axios response interceptor for handling API errors
 */
export function setupApiErrorInterceptor(
  axiosInstance: any,
  onAuthError?: () => void,
  onServerError?: (error: OnyxApiError) => void
) {
  axiosInstance.interceptors.response.use(
    (response: any) => response,
    createGlobalApiErrorHandler(onAuthError, onServerError)
  );
}

export default ApiErrorDisplay;