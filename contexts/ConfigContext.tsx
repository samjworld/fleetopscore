import React, { createContext, useContext, useState, useEffect } from 'react';
import { Role, ModuleId } from '../types.ts';
import { DEFAULT_PERMISSIONS, ROLE_DEFINITIONS } from '../constants.ts';

interface RoleMetadata {
  label: string;
  category: string;
  reportsTo?: Role | string;
}

interface ConfigContextType {
  permissions: Record<string, ModuleId[]>;
  roleDefinitions: Record<string, RoleMetadata>;
  togglePermission: (role: string, moduleId: ModuleId) => void;
  setRolePermissions: (role: string, moduleIds: ModuleId[]) => void;
  hasPermission: (role: string, moduleId: ModuleId) => boolean;
  createRole: (id: string, metadata: RoleMetadata, initialPermissions: ModuleId[]) => void;
  updateRole: (id: string, metadata: RoleMetadata) => void;
  deleteRole: (id: string) => void;
}

const ConfigContext = createContext<ConfigContextType | null>(null);

export const ConfigProvider = ({ children }: React.PropsWithChildren) => {
  const [permissions, setPermissions] = useState<Record<string, ModuleId[]>>(() => {
    const saved = localStorage.getItem('fleetops_permissions');
    return saved ? JSON.parse(saved) : DEFAULT_PERMISSIONS;
  });

  const [roleDefinitions, setRoleDefinitions] = useState<Record<string, RoleMetadata>>(() => {
    const saved = localStorage.getItem('fleetops_roles');
    return saved ? JSON.parse(saved) : ROLE_DEFINITIONS;
  });

  useEffect(() => {
    localStorage.setItem('fleetops_permissions', JSON.stringify(permissions));
  }, [permissions]);

  useEffect(() => {
    localStorage.setItem('fleetops_roles', JSON.stringify(roleDefinitions));
  }, [roleDefinitions]);

  const togglePermission = (role: string, moduleId: ModuleId) => {
    setPermissions(prev => {
      const current = prev[role] || [];
      const exists = current.includes(moduleId);
      const updated = exists ? current.filter(id => id !== moduleId) : [...current, moduleId];
      return { ...prev, [role]: updated };
    });
  };

  const setRolePermissions = (role: string, moduleIds: ModuleId[]) => {
    setPermissions(prev => ({ ...prev, [role]: moduleIds }));
  };

  const hasPermission = (role: string, moduleId: ModuleId) => {
    return permissions[role]?.includes(moduleId) || false;
  };

  const createRole = (id: string, metadata: RoleMetadata, initialPermissions: ModuleId[]) => {
    setRoleDefinitions(prev => ({ ...prev, [id]: metadata }));
    setPermissions(prev => ({ ...prev, [id]: initialPermissions }));
  };

  const updateRole = (id: string, metadata: RoleMetadata) => {
    setRoleDefinitions(prev => ({ ...prev, [id]: metadata }));
  };

  const deleteRole = (id: string) => {
    setRoleDefinitions(prev => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
    setPermissions(prev => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
  };

  return (
    <ConfigContext.Provider value={{ 
      permissions, 
      roleDefinitions, 
      togglePermission, 
      setRolePermissions,
      hasPermission, 
      createRole, 
      updateRole, 
      deleteRole 
    }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};