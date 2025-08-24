import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '@/components/theme-provider';
import { useAuth } from '@/context/auth-context';
import { useOrg } from '@/context/org-context';
import { cn } from '@/lib/utils';

import {
  AlertCircle,
  BarChart3,
  Building2,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Settings,
  Shield,
  Sun,
  User,
  Users,
  Building,
  X,
  Activity,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader,
  SheetTitle,
  SheetTrigger 
} from '@/components/ui/sheet';
import { LoadingScreen } from '@/components/loading-screen';

export function DashboardLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const { currentOrg, loading: orgLoading } = useOrg();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      current: pathname === '/dashboard',
    },
    {
      name: 'Buildings',
      href: '/buildings',
      icon: Building2,
      current: pathname.startsWith('/buildings'),
    },
    {
      name: 'Assessments',
      href: '/assessments',
      icon: ClipboardList,
      current: pathname.startsWith('/assessments'),
    },
    {
      name: 'Reports',
      href: '/reports',
      icon: FileText,
      current: pathname.startsWith('/reports'),
    },
    {
      name: 'Analytics',
      href: '/analytics',
      icon: BarChart3,
      current: pathname.startsWith('/analytics'),
    },
    {
      name: 'Predictive Maintenance',
      href: '/predictive-maintenance',
      icon: Activity,
      current: pathname.startsWith('/predictive-maintenance'),
    },
    {
      name: 'Team',
      href: '/team',
      icon: Users,
      current: pathname.startsWith('/team'),
    },
    {
      name: 'Organization',
      href: '/organization',
      icon: Building,
      current: pathname.startsWith('/organization'),
    },
  ];

  // Admin-only navigation items
  const adminNavigation = user?.role === 'admin' ? [
    {
      name: 'Admin Dashboard',
      href: '/admin/dashboard',
      icon: Shield,
      current: pathname === '/admin/dashboard',
    },
    {
      name: 'Admin Settings',
      href: '/admin/settings',
      icon: Settings,
      current: pathname === '/admin/settings',
    },
  ] : [];

  const userNavigation = [
    { name: 'Your Profile', href: '/profile', icon: User },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  // Show loading screen while organization is loading
  if (orgLoading) {
    return <LoadingScreen message="Loading organization data..." />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
        <div className="flex flex-grow flex-col overflow-y-auto border-r bg-card/50 backdrop-blur-xl pt-6">
          <div className="flex flex-shrink-0 items-center px-6">
            <Link to="/dashboard" className="flex items-center gap-3 group">
              <div className="p-2.5 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                <Building2 className="h-7 w-7 text-primary" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">Onyx</span>
            </Link>
          </div>
          <div className="mt-10 flex flex-grow flex-col">
            <nav className="flex-1 space-y-1.5 px-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    item.current
                      ? 'bg-primary/10 text-primary shadow-sm'
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                    'group flex items-center rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200'
                  )}
                >
                  <item.icon
                    className={cn(
                      item.current ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground',
                      'mr-3 h-5 w-5 flex-shrink-0 transition-all duration-200 group-hover:scale-110'
                    )}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              ))}
              
              {/* Admin Navigation */}
              {adminNavigation.length > 0 && (
                <>
                  <div className="border-t border-border/50 mx-4 my-4" />
                  <div className="px-4 mb-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Admin
                    </p>
                  </div>
                  {adminNavigation.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={cn(
                        item.current
                          ? 'bg-destructive/10 text-destructive shadow-sm'
                          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                        'group flex items-center rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200'
                      )}
                    >
                      <item.icon
                        className={cn(
                          item.current ? 'text-destructive' : 'text-muted-foreground group-hover:text-foreground',
                          'mr-3 h-5 w-5 flex-shrink-0 transition-all duration-200 group-hover:scale-110'
                        )}
                        aria-hidden="true"
                      />
                      {item.name}
                    </Link>
                  ))}
                </>
              )}
            </nav>
          </div>
          {currentOrg && (
            <div className="border-t p-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shadow-sm">
                  <span className="text-sm font-bold text-primary">
                    {currentOrg.name.charAt(0)}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold truncate max-w-[168px]">
                    {currentOrg.name}
                  </span>
                  <span className="text-xs text-muted-foreground capitalize">
                    {currentOrg.subscription} Plan
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col md:pl-64">
        {/* Top navigation */}
        <div
          className={cn(
            'sticky top-0 z-10 flex h-20 shrink-0 items-center gap-x-4 border-b bg-background/80 px-6 backdrop-blur-xl sm:gap-x-6 sm:px-8 lg:px-10',
            isScrolled && 'shadow-lg border-b-transparent'
          )}
        >
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="-m-2.5 p-2.5 md:hidden"
              >
                <span className="sr-only">Open sidebar</span>
                <Menu className="h-6 w-6" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="sm:max-w-xs">
              <SheetHeader>
                <SheetTitle className="text-left">Navigation Menu</SheetTitle>
              </SheetHeader>
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b px-4 py-5">
                  <Link to="/dashboard" className="flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
                    <Building2 className="h-7 w-7 text-primary" />
                    <span className="text-xl font-bold text-primary">Onyx</span>
                  </Link>
                  <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <nav className="flex-1 overflow-y-auto py-6">
                  <div className="space-y-1 px-4">
                    {navigation.map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={cn(
                          item.current
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                          'group flex items-center rounded-md px-3 py-2.5 text-base font-medium'
                        )}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <item.icon
                          className={cn(
                            item.current ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground',
                            'mr-4 h-5 w-5 flex-shrink-0'
                          )}
                          aria-hidden="true"
                        />
                        {item.name}
                      </Link>
                    ))}
                    
                    {/* Admin Navigation in Mobile */}
                    {adminNavigation.length > 0 && (
                      <>
                        <div className="border-t border-border/50 mx-2 my-4" />
                        <div className="px-2 mb-2">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Admin
                          </p>
                        </div>
                        {adminNavigation.map((item) => (
                          <Link
                            key={item.name}
                            to={item.href}
                            className={cn(
                              item.current
                                ? 'bg-destructive/10 text-destructive'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                              'group flex items-center rounded-md px-3 py-2.5 text-base font-medium'
                            )}
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <item.icon
                              className={cn(
                                item.current ? 'text-destructive' : 'text-muted-foreground group-hover:text-foreground',
                                'mr-4 h-5 w-5 flex-shrink-0'
                              )}
                              aria-hidden="true"
                            />
                            {item.name}
                          </Link>
                        ))}
                      </>
                    )}
                  </div>
                  <div className="mt-10 border-t pt-6">
                    <div className="space-y-1 px-4">
                      {userNavigation.map((item) => (
                        <Link
                          key={item.name}
                          to={item.href}
                          className="group flex items-center rounded-md px-3 py-2.5 text-base font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <item.icon
                            className="mr-4 h-5 w-5 text-muted-foreground group-hover:text-foreground"
                            aria-hidden="true"
                          />
                          {item.name}
                        </Link>
                      ))}
                      <button
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          logout();
                        }}
                        className="group flex w-full items-center rounded-md px-3 py-2.5 text-base font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <LogOut
                          className="mr-4 h-5 w-5 text-muted-foreground group-hover:text-foreground"
                          aria-hidden="true"
                        />
                        Sign out
                      </button>
                    </div>
                  </div>
                </nav>
                {currentOrg && (
                  <div className="border-t p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {currentOrg.name.charAt(0)}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium truncate max-w-[168px]">
                          {currentOrg.name}
                        </span>
                        <span className="text-xs text-muted-foreground capitalize">
                          {currentOrg.subscription} Plan
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex flex-1 justify-end gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:bg-muted/50 rounded-xl transition-all duration-200"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                {theme === 'dark' ? (
                  <Sun className="h-5 w-5 transition-all duration-200" />
                ) : (
                  <Moon className="h-5 w-5 transition-all duration-200" />
                )}
                <span className="sr-only">Toggle theme</span>
              </Button>

              <Button variant="ghost" size="icon" className="text-muted-foreground hover:bg-muted/50 rounded-xl relative transition-all duration-200">
                <AlertCircle className="h-5 w-5" />
                <span className="sr-only">View notifications</span>
                <span className="absolute right-2 top-2.5 h-2 w-2 rounded-full bg-primary animate-pulse" />
              </Button>

              {/* Profile dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative flex items-center gap-x-3 rounded-xl px-3 py-2 hover:bg-muted/50 transition-all duration-200">
                    <span className="sr-only">Open user menu</span>
                    <Avatar className="h-9 w-9 ring-2 ring-primary/20">
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                        {user?.name.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden lg:flex lg:flex-col lg:items-start">
                      <span className="text-sm font-semibold" aria-hidden="true">
                        {user?.name || 'User'}
                      </span>
                      <span className="text-xs text-muted-foreground" aria-hidden="true">
                        {user?.role?.replace('_', ' ').charAt(0).toUpperCase() + user?.role?.replace('_', ' ').slice(1) || 'User'}
                      </span>
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-lg border-border/50 bg-background/95 backdrop-blur-xl">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{user?.name}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {userNavigation.map((item) => (
                    <DropdownMenuItem key={item.name} asChild>
                      <Link to={item.href} className="cursor-pointer flex items-center">
                        <item.icon className="mr-2 h-4 w-4" />
                        {item.name}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={logout}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}