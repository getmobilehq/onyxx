import { BrowserRouter as Router } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/components/theme-provider';
import { AppRoutes } from '@/routes';
import { AuthProvider } from '@/context/auth-context';
import { OrgProvider } from '@/context/org-context';

function App() {
  return (
    <Router>
      <ThemeProvider defaultTheme="light" storageKey="onyx-theme">
        <AuthProvider>
          <OrgProvider>
            <AppRoutes />
            <Toaster position="top-right" richColors />
          </OrgProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;