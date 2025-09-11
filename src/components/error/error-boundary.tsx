import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: Array<string | number>;
  resetOnPropsChange?: boolean;
  isolate?: boolean;
  level?: 'page' | 'section' | 'component';
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
  showDetails: boolean;
}

/**
 * Global Error Boundary Component
 * Catches JavaScript errors anywhere in the component tree
 */
export class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: number | null = null;
  private previousResetKeys: Array<string | number> = [];

  constructor(props: Props) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
      showDetails: false
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
      errorCount: 0,
      showDetails: false
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Boundary Caught:', error, errorInfo);
    }

    // Update state with error details
    this.setState(prevState => ({
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Send error to monitoring service (e.g., Sentry)
    this.logErrorToService(error, errorInfo);
  }

  componentDidUpdate(prevProps: Props) {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;

    // Reset error boundary when resetKeys change
    if (
      hasError &&
      resetKeys &&
      this.previousResetKeys.length > 0 &&
      !this.arraysEqual(resetKeys, this.previousResetKeys)
    ) {
      this.resetErrorBoundary();
    }

    // Reset on any props change if specified
    if (hasError && resetOnPropsChange && prevProps !== this.props) {
      this.resetErrorBoundary();
    }

    this.previousResetKeys = resetKeys || [];
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  arraysEqual(a: Array<string | number>, b: Array<string | number>): boolean {
    return a.length === b.length && a.every((val, index) => val === b[index]);
  }

  logErrorToService(error: Error, errorInfo: ErrorInfo) {
    // In production, send to error monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error, { extra: errorInfo });
      
      // For now, just log to console
      console.error('Production Error:', {
        error: error.toString(),
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent
      });
    }
  }

  resetErrorBoundary = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
      showDetails: false
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  toggleDetails = () => {
    this.setState(prevState => ({
      showDetails: !prevState.showDetails
    }));
  };

  render() {
    const { hasError, error, errorInfo, errorCount, showDetails } = this.state;
    const { children, fallback, isolate, level = 'component' } = this.props;

    if (hasError && error) {
      // Use custom fallback if provided
      if (fallback) {
        return <>{fallback}</>;
      }

      // Different error UI based on level
      if (level === 'page') {
        return <PageErrorFallback
          error={error}
          errorInfo={errorInfo}
          errorCount={errorCount}
          showDetails={showDetails}
          onReset={this.resetErrorBoundary}
          onReload={this.handleReload}
          onGoHome={this.handleGoHome}
          onToggleDetails={this.toggleDetails}
        />;
      }

      if (level === 'section') {
        return <SectionErrorFallback
          error={error}
          errorInfo={errorInfo}
          showDetails={showDetails}
          onReset={this.resetErrorBoundary}
          onToggleDetails={this.toggleDetails}
        />;
      }

      // Default component-level error
      return <ComponentErrorFallback
        error={error}
        onReset={this.resetErrorBoundary}
        isolate={isolate}
      />;
    }

    return children;
  }
}

/**
 * Page-level error fallback UI
 */
function PageErrorFallback({
  error,
  errorInfo,
  errorCount,
  showDetails,
  onReset,
  onReload,
  onGoHome,
  onToggleDetails
}: {
  error: Error;
  errorInfo: ErrorInfo | null;
  errorCount: number;
  showDetails: boolean;
  onReset: () => void;
  onReload: () => void;
  onGoHome: () => void;
  onToggleDetails: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="max-w-2xl w-full p-8">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-16 w-16 text-red-500 mb-4" />
          
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Something went wrong
          </h1>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            We encountered an unexpected error. The issue has been logged and we'll look into it.
          </p>

          {errorCount > 2 && (
            <Alert className="mb-6 border-orange-200 bg-orange-50 dark:bg-orange-900/20">
              <AlertTitle>Multiple errors detected</AlertTitle>
              <AlertDescription>
                This error has occurred {errorCount} times. Consider reloading the page.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
            <Button onClick={onReset} variant="default">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            
            <Button onClick={onReload} variant="outline">
              Reload Page
            </Button>
            
            <Button onClick={onGoHome} variant="outline">
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </div>

          {/* Error Details Toggle */}
          <button
            onClick={onToggleDetails}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center justify-center mx-auto"
          >
            {showDetails ? (
              <ChevronDown className="w-4 h-4 mr-1" />
            ) : (
              <ChevronRight className="w-4 h-4 mr-1" />
            )}
            {showDetails ? 'Hide' : 'Show'} Error Details
          </button>

          {/* Error Details */}
          {showDetails && (
            <div className="mt-6 text-left">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 overflow-auto">
                <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2">
                  Error Message:
                </h3>
                <pre className="text-xs text-red-600 dark:text-red-400 whitespace-pre-wrap">
                  {error.toString()}
                </pre>

                {error.stack && (
                  <>
                    <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mt-4 mb-2">
                      Stack Trace:
                    </h3>
                    <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap max-h-48 overflow-y-auto">
                      {error.stack}
                    </pre>
                  </>
                )}

                {errorInfo?.componentStack && (
                  <>
                    <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mt-4 mb-2">
                      Component Stack:
                    </h3>
                    <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap max-h-48 overflow-y-auto">
                      {errorInfo.componentStack}
                    </pre>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

/**
 * Section-level error fallback UI
 */
function SectionErrorFallback({
  error,
  errorInfo,
  showDetails,
  onReset,
  onToggleDetails
}: {
  error: Error;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
  onReset: () => void;
  onToggleDetails: () => void;
}) {
  return (
    <Card className="p-6 border-red-200 bg-red-50 dark:bg-red-900/20">
      <div className="flex items-start">
        <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
        
        <div className="flex-1">
          <h3 className="font-semibold text-red-900 dark:text-red-100">
            Section Error
          </h3>
          
          <p className="text-sm text-red-700 dark:text-red-300 mt-1">
            This section couldn't load properly.
          </p>
          
          <Button 
            onClick={onReset}
            size="sm"
            variant="outline"
            className="mt-3"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Retry
          </Button>

          <button
            onClick={onToggleDetails}
            className="text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 mt-3 block"
          >
            {showDetails ? 'Hide' : 'Show'} Details
          </button>

          {showDetails && (
            <pre className="text-xs text-red-600 dark:text-red-400 mt-2 whitespace-pre-wrap bg-white dark:bg-gray-900 p-2 rounded">
              {error.message}
            </pre>
          )}
        </div>
      </div>
    </Card>
  );
}

/**
 * Component-level error fallback UI
 */
function ComponentErrorFallback({
  error,
  onReset,
  isolate
}: {
  error: Error;
  onReset: () => void;
  isolate?: boolean;
}) {
  if (isolate) {
    // Minimal error UI for isolated components
    return (
      <div className="p-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded">
        Component error
        <button 
          onClick={onReset}
          className="ml-2 underline hover:no-underline"
        >
          retry
        </button>
      </div>
    );
  }

  return (
    <Alert className="border-red-200">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Component Error</AlertTitle>
      <AlertDescription className="mt-2">
        <p className="text-sm">{error.message}</p>
        <Button 
          onClick={onReset}
          size="sm"
          variant="outline"
          className="mt-2"
        >
          Try Again
        </Button>
      </AlertDescription>
    </Alert>
  );
}

/**
 * Hook to reset error boundary from child components
 */
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return setError;
}

export default ErrorBoundary;