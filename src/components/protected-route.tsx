import { ReactNode } from 'react';
import { useAuth } from '@/context/auth-context';
import { ForbiddenPage } from '@/pages/403-forbidden';

interface ProtectedRouteProps {
  children: ReactNode;
  adminOnly?: boolean; // Deprecated: use managerOnly instead
  managerOnly?: boolean;
  platformAdminOnly?: boolean;
  roles?: Array<'manager' | 'assessor'>;
}

export function ProtectedRoute({
  children,
  adminOnly = false,
  managerOnly = false,
  platformAdminOnly = false,
  roles
}: ProtectedRouteProps) {
  const { user } = useAuth();

  // If platform admin only and user is not platform admin, show 403
  if (platformAdminOnly && !user?.is_platform_admin) {
    return <ForbiddenPage />;
  }

  // If manager only (or deprecated adminOnly) and user is not manager, show 403
  if ((managerOnly || adminOnly) && user?.role !== 'manager') {
    return <ForbiddenPage />;
  }

  // If specific roles required and user doesn't have permission
  if (roles && user && !roles.includes(user.role)) {
    return <ForbiddenPage />;
  }

  return <>{children}</>;
}