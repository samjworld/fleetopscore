import React from 'react';
import { ModuleId } from '../types.ts';
import { usePermissions } from '../hooks/usePermissions.ts';

interface GuardProps {
  moduleId?: ModuleId;
  roles?: string[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Declarative Permission Guard
 * Prevents "dumb" components from needing to know user roles.
 * Use this to wrap sensitive buttons, tabs, or sections.
 */
export const PermissionGuard: React.FC<GuardProps> = ({ 
  moduleId, 
  roles, 
  fallback = null, 
  children 
}) => {
  const { canAccess, isRole } = usePermissions();

  let allowed = true;

  // 1. Check Module-based permission (Primary)
  if (moduleId && !canAccess(moduleId)) {
    allowed = false;
  }

  // 2. Check Role-based permission (Override/Secondary)
  if (roles && !isRole(roles)) {
    allowed = false;
  }

  if (!allowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};