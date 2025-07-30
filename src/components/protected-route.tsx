import { ReactNode } from 'react';
import { useAuth } from '@/context/auth-context';
import { ForbiddenPage } from '@/pages/403-forbidden';

interface ProtectedRouteProps {
  children: ReactNode;
  adminOnly?: boolean;
  roles?: Array<'admin' | 'manager' | 'assessor'>;
}

export function ProtectedRoute({ 
  children, 
  adminOnly = false, 
  roles 
}: ProtectedRouteProps) {
  const { user } = useAuth();

  // If admin only and user is not admin, show 403
  if (adminOnly && user?.role !== 'admin') {
    return <ForbiddenPage />;
  }

  // If specific roles required and user doesn't have permission
  if (roles && user && !roles.includes(user.role)) {
    return <ForbiddenPage />;
  }

  return <>{children}</>;
}