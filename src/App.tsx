import { BrowserRouter as Router } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/components/theme-provider';
import { AppRoutes } from '@/routes';
import { AuthProvider } from '@/context/auth-context';
import { OrgProvider } from '@/context/org-context';
import { ErrorBoundary } from '@/components/error/error-boundary';
import { AsyncErrorBoundary } from '@/components/error/async-error-boundary';

function App() {
  const handleGlobalError = (error: Error) => {
    // Log to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      console.error('Global Application Error:', error);
      // TODO: Send to Sentry or other monitoring service
    }
  };

  return (
    <ErrorBoundary
      level="page"
      onError={handleGlobalError}
    >
      <AsyncErrorBoundary onError={handleGlobalError}>
        <Router>
          <ThemeProvider defaultTheme="light" storageKey="onyx-theme">
            <AuthProvider>
              <OrgProvider>
                <ErrorBoundary level="section">
                  <AppRoutes />
                </ErrorBoundary>
                <Toaster position="top-right" richColors duration={3000} />
              </OrgProvider>
            </AuthProvider>
          </ThemeProvider>
        </Router>
      </AsyncErrorBoundary>
    </ErrorBoundary>
  );
}

export default App;