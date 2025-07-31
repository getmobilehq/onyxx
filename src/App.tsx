import { BrowserRouter as Router } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/components/theme-provider';
import { AppRoutes } from '@/routes';
import { AuthProvider } from '@/context/auth-context';
import { OrgProvider } from '@/context/org-context';
import { ErrorBoundary } from '@/components/error-boundary';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <ThemeProvider defaultTheme="light" storageKey="onyx-theme">
          <AuthProvider>
            <OrgProvider>
              <AppRoutes />
              <Toaster position="top-right" richColors duration={3000} />
            </OrgProvider>
          </AuthProvider>
        </ThemeProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;