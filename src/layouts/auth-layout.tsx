import { Outlet, Link } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';

export function AuthLayout() {
  const { theme, setTheme } = useTheme();
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex items-center justify-between p-4 sm:p-6">
        <Link to="/" className="flex items-center gap-2">
          <Building2 className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold text-primary">Onyx</span>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </div>
      
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
      
      <footer className="py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Onyx Building Assessment. All rights reserved.
      </footer>
    </div>
  );
}