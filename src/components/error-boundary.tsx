import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorPage } from '@/pages/error-page';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    
    // In production, you might want to send this to an error reporting service
    if (import.meta.env.PROD) {
      // Log to error reporting service
      console.error('Error boundary caught:', error.message);
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <ErrorPage
          code={500}
          title="Application Error"
          message="An unexpected error occurred. Please refresh the page to try again."
          showBackButton={false}
        />
      );
    }

    return this.props.children;
  }
}