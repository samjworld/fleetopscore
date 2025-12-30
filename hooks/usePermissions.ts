import { useAuth } from '../contexts/AuthContext.tsx';
import { useConfig } from '../contexts/ConfigContext.tsx';
import { ModuleId } from '../types.ts';

/**
 * Enterprise Authorization Hook
 * Provides high-level abstractions for checking permissions.
 * Rule: Deny by default.
 */
export const usePermissions = () => {
  const { user } = useAuth();
  const { hasPermission } = useConfig();

  const canAccess = (moduleId: ModuleId): boolean => {
    if (!user || !user.role) return false;
    return hasPermission(user.role, moduleId);
  };

  const isRole = (roles: string[]): boolean => {
    if (!user || !user.role) return false;
    return roles.includes(user.role);
  };

  return { 
    canAccess, 
    isRole,
    currentRole: user?.role,
    isAuthenticated: !!user 
  };
};