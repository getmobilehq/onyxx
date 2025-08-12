import { ReactNode } from 'react';
import { useAuth } from '@/context/auth-context';
import { ForbiddenPage } from '@/pages/403-forbidden';

interface ProtectedRouteProps {
  children: ReactNode;
  adminOnly?: boolean;
  platformAdminOnly?: boolean;
  roles?: Array<'admin' | 'manager' | 'assessor'>;
}

export function ProtectedRoute({ 
  children, 
  adminOnly = false,
  platformAdminOnly = false, 
  roles 
}: ProtectedRouteProps) {
  const { user } = useAuth();

  // If platform admin only and user is not platform admin, show 403
  if (platformAdminOnly && !user?.is_platform_admin) {
    return <ForbiddenPage />;
  }

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