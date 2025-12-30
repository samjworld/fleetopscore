
import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Role, ModuleId } from '../types.ts';
import { NAV_ITEMS } from '../constants.ts';
import { useConfig } from '../contexts/ConfigContext.tsx';
import { useAuth } from '../contexts/AuthContext.tsx';
import { 
  Shield, Network, Lock, CheckCircle, XCircle, 
  Save, UserCog, LayoutGrid, Wrench, 
  Crown, Users, Plus, AlertTriangle, ShieldCheck,
  BookOpen, Info, ArrowDown, UserPlus, Edit3, Trash2, X, MinusCircle, Loader2, Copy, Send,
  RefreshCw, Power, Check, Clock, Download, Calendar, Settings, 
  CheckSquare, Square, ChevronRight, Filter, UserMinus, Key, Database, Globe, HardHat, Terminal,
  ChevronDown, Settings2, ShieldPlus, Smartphone, Hash, MousePointerClick, MoreHorizontal,
  Tags, Briefcase, GitBranch, Star
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api.ts';
import toast from 'react-hot-toast';

const INITIAL_SYSTEM_USERS = [
    { id: 's1', name: 'Site Manager Steve', role: Role.SITE_MANAGER, email: 'steve@fleetops.com', phone: '+1 (555) 123-4567', status: 'active', skills: ['Site Supervision', 'Safety'] },
    { id: 's2', name: 'Admin Alice', role: Role.SUPER_ADMIN, email: 'alice@fleetops.com', phone: '+1 (555) 999-8888', status: 'active', skills: ['Logistics'] },
    { id: 's3', name: 'Fleet Mgr Fred', role: Role.FLEET_MANAGER, email: 'fred@fleetops.com', phone: '+1 (555) 444-3333', status: 'active', skills: ['Heavy Machinery'] },
];

const AVAILABLE_SKILLS = [
  'Heavy Machinery', 'Excavation', 'Crane Operation', 
  'Logistics', 'Safety', 'Maintenance', 'First Aid', 'Site Supervision'
];

export const AdminSettings = () => {
  const { permissions, roleDefinitions, togglePermission, setRolePermissions, hasPermission, createRole, updateRole, deleteRole } = useConfig();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'attendance' | 'hierarchy' | 'matrix' | 'tools' | 'guide'>('roles');
  const [selectedRoleDetail, setSelectedRoleDetail] = useState<string | null>(null);
  const [systemUsers, setSystemUsers] = useState(INITIAL_SYSTEM_USERS);
  
  // User Modals
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userModalMode, setUserModalMode] = useState<'create' | 'edit'>('create');
  const [userModalStep, setUserModalStep] = useState<'form' | 'success'>('form');
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<any | null>(null);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: Role.SITE_MANAGER as string, phone: '', skills: [] as string[] });
  const [generatedCreds, setGeneratedCreds] = useState({ email: '', password: '' });

  // Role Modals
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [roleModalMode, setRoleModalMode] = useState<'create' | 'edit'>('create');
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [newRole, setNewRole] = useState({ 
    id: '', 
    label: '', 
    category: 'Operational', 
    reportsTo: Role.SUPER_ADMIN as string 
  });
  const [localRolePermissions, setLocalRolePermissions] = useState<ModuleId[]>([]);

  if (user?.role !== Role.SUPER_ADMIN) return <Navigate to="/app" replace />;

  const handleOpenCreateUser = (preSelectedRole?: string) => {
    setUserModalMode('create'); setUserModalStep('form');
    setNewUser({ name: '', email: '', role: preSelectedRole || Role.SITE_MANAGER, phone: '', skills: [] });
    setIsUserModalOpen(true);
  };

  const handleOpenEditUser = (u: any) => {
    setUserModalMode('edit'); setUserModalStep('form'); setSelectedUserForEdit(u.id);
    setNewUser({ name: u.name, email: u.email, role: u.role, phone: u.phone || '', skills: u.skills || [] });
    setIsUserModalOpen(true);
  };

  const handleUserFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userModalMode === 'create') {
        const tempPassword = Math.random().toString(36).slice(-10).toUpperCase();
        setSystemUsers(prev => [...prev, { id: `u_${Date.now()}`, name: newUser.name, role: newUser.role as Role, email: newUser.email, phone: newUser.phone, status: 'active', skills: newUser.skills }]);
        setGeneratedCreds({ email: newUser.email, password: tempPassword });
        setUserModalStep('success');
    } else {
        setSystemUsers(prev => prev.map(u => u.id === selectedUserForEdit ? { ...u, name: newUser.name, email: newUser.email, role: newUser.role as Role, phone: newUser.phone, skills: newUser.skills } : u));
        setIsUserModalOpen(false);
    }
  };

  const handleToggleSkill = (skill: string) => {
    setNewUser(prev => ({
        ...prev,
        skills: prev.skills.includes(skill) 
            ? prev.skills.filter(s => s !== skill)
            : [...prev.skills, skill]
    }));
  };

  // Role CRUD logic
  const handleOpenCreateRole = () => {
    setRoleModalMode('create');
    setEditingRoleId(null);
    setNewRole({ id: '', label: '', category: 'Operational', reportsTo: Role.SUPER_ADMIN });
    setLocalRolePermissions([]);
    setIsRoleModalOpen(true);
  };

  const handleOpenEditRole = (roleId: string) => {
    const role = roleDefinitions[roleId];
    if (!role) return;
    setRoleModalMode('edit');
    setEditingRoleId(roleId);
    setNewRole({ id: roleId, label: role.label, category: role.category, reportsTo: role.reportsTo as string || Role.SUPER_ADMIN });
    setLocalRolePermissions(permissions[roleId] || []);
    setIsRoleModalOpen(true);
  };

  const handleRoleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (roleModalMode === 'create') {
      if (roleDefinitions[newRole.id]) {
        toast.error("Role ID already exists in registry");
        return;
      }
      createRole(newRole.id, { label: newRole.label, category: newRole.category, reportsTo: newRole.reportsTo as Role }, localRolePermissions);
      toast.success("New role provisioned");
    } else if (editingRoleId) {
      updateRole(editingRoleId, { label: newRole.label, category: newRole.category, reportsTo: newRole.reportsTo as Role });
      setRolePermissions(editingRoleId, localRolePermissions);
      toast.success("Role designation updated");
    }
    setIsRoleModalOpen(false);
  };

  const confirmDeleteRole = (roleId: string) => {
    const isProtected = Object.values(Role).includes(roleId as Role);
    if (isProtected) {
      toast.error("Standard system roles cannot be terminated.");
      return;
    }
    const hasUsers = systemUsers.some(u => u.role === roleId);
    if (hasUsers) {
      toast.error("Cannot delete role: active users are still assigned.");
      return;
    }
    if (window.confirm(`Terminate role ${roleId}? This action is irreversible.`)) {
      deleteRole(roleId);
      toast.success("Role entry removed from nexus");
    }
  };

  const renderHierarchyNode = (roleId: string, level: number = 0) => {
    const roleDef = roleDefinitions[roleId];
    if (!roleDef) return null;
    const children = Object.keys(roleDefinitions).filter(id => (roleDefinitions[id] as any).reportsTo === roleId);
    const isRoot = level === 0;
    
    return (
      <div key={roleId} className={`relative flex flex-col ${isRoot ? 'items-center' : 'items-start'} w-full`}>
        {level > 1 && <div className="absolute left-0 top-8 w-6 h-px bg-gray-300 dark:bg-slate-600 -translate-y-1/2"></div>}
        <button 
          onClick={() => setSelectedRoleDetail(roleId)} 
          className={`relative z-10 flex items-center gap-3 p-4 rounded-xl transition-all border text-left group ${
            isRoot 
              ? 'bg-slate-900 border-slate-800 text-white shadow-xl ring-4 ring-slate-100 dark:ring-slate-800 mb-8 max-w-full w-full justify-center' 
              : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md mb-3 ml-6 sm:ml-8 min-w-0 max-w-full sm:min-w-[320px]'
          }`}
        >
            <div className={`p-2 rounded-lg shrink-0 transition-transform group-hover:scale-110 ${isRoot ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-inner' : 'bg-gray-50 dark:bg-slate-900 text-gray-500 border border-gray-100 dark:border-slate-700'}`}>{isRoot ? <Crown size={20} className="text-yellow-400" /> : <UserCog size={18} />}</div>
            <div className={`min-w-0 ${isRoot ? 'text-center' : ''}`}>
                <h4 className={`font-bold truncate ${isRoot ? 'text-lg md:text-xl' : 'text-sm md:text-base text-gray-900 dark:text-white'}`}>{roleDef.label}</h4>
                <p className={`text-[10px] font-mono mt-0.5 truncate ${isRoot ? 'text-slate-400' : 'text-gray-500 dark:text-slate-400'}`}>{roleId}</p>
            </div>
            {!isRoot && <div className="ml-auto shrink-0"><Info size={14} className="text-gray-300 group-hover:text-blue-500 transition-colors" /></div>}
        </button>
        {children.length > 0 && (
          <div className={`${isRoot ? 'flex flex-col items-center w-full relative pt-4' : 'ml-6 sm:ml-8 pl-6 sm:pl-8 border-l-2 border-gray-200 dark:border-slate-700 space-y-1'}`}>
            {isRoot && <div className="absolute top-0 left-1/2 -translate-x-1/2 h-4 w-px bg-gray-300 dark:bg-slate-600"></div>}
            <div className="w-full flex flex-col items-center sm:items-start">{children.map(child => renderHierarchyNode(child, level + 1))}</div>
          </div>
        )}
      </div>
    );
  };

  const handleToggleAllPermissions = () => {
    if (localRolePermissions.length === NAV_ITEMS.length) {
      setLocalRolePermissions([]);
    } else {
      setLocalRolePermissions(NAV_ITEMS.map(i => i.id));
    }
  };

  return (
    <div className="space-y-6 pb-8 h-full flex flex-col px-1 sm:px-0">
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-lg rounded-2xl p-4 flex items-center justify-between border border-slate-700 shrink-0">
        <div className="flex items-center gap-4"><div className="p-2 bg-green-500/20 text-green-400 rounded-lg border border-green-500/30 shrink-0"><ShieldCheck size={24} /></div><div className="min-w-0"><h3 className="font-bold text-sm md:text-lg leading-tight truncate">Secure Admin Session</h3><p className="text-slate-400 text-[10px] md:text-xs truncate">Authenticated as <span className="text-white font-mono">{user?.name}</span></p></div></div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div><h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white uppercase tracking-tight leading-none">Terminal Configuration</h2><p className="text-[11px] md:text-sm text-slate-500 dark:text-slate-400 mt-1">Personnel, functional mandates, and authority matrix.</p></div>
        <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-blue-700 shadow-xl active:scale-95 transition-all"><Save size={18} /> Commit Changes</button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-t-2xl px-2 overflow-x-auto shrink-0 custom-scrollbar">
          {[
            { id: 'roles', label: 'Role Registry', icon: Tags },
            { id: 'matrix', label: 'Access Matrix', icon: Lock },
            { id: 'users', label: 'Personnel', icon: Users },
            { id: 'attendance', label: 'Attendance', icon: Clock },
            { id: 'hierarchy', label: 'Hierarchy', icon: Network },
            { id: 'tools', label: 'System Tools', icon: Wrench },
          ].map(t => (
              <button 
                key={t.id} 
                onClick={() => setActiveTab(t.id as any)} 
                className={`flex items-center gap-2 px-5 py-4 font-black text-[10px] uppercase tracking-widest border-b-4 transition-all whitespace-nowrap ${activeTab === t.id ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-400 hover:text-gray-700 dark:hover:text-slate-200'}`}
              >
                  <t.icon size={14}/> {t.label}
              </button>
          ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto bg-white dark:bg-slate-900 rounded-b-2xl border-x border-b border-gray-200 dark:border-slate-800 shadow-sm min-h-0">
          
          {activeTab === 'roles' && (
            <div className="p-4 md:p-8 animate-in fade-in duration-500">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                        <h3 className="text-lg md:text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Role Registry</h3>
                        <p className="text-xs text-slate-400 font-medium mt-1">Manage functional designations and organizational reporting chains.</p>
                    </div>
                    <button onClick={handleOpenCreateRole} className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all active:scale-95"><Plus size={18} /> Provision Role</button>
                </div>
                
                <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-slate-800 bg-gray-50/30">
                    <table className="min-w-[800px] w-full text-xs text-left">
                        <thead className="bg-gray-100 dark:bg-slate-800 text-gray-400 font-black uppercase tracking-[0.2em]"><tr className="text-[9px]"><th className="px-6 py-4">Designation (Label)</th><th className="px-6 py-4">Registry ID</th><th className="px-6 py-4">Category</th><th className="px-6 py-4">Reporting To</th><th className="px-6 py-4 text-right">Ops</th></tr></thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                          {Object.keys(roleDefinitions).map(roleId => {
                            const def = roleDefinitions[roleId];
                            const isSystemRole = Object.values(Role).includes(roleId as Role);
                            return (
                                <tr key={roleId} className="hover:bg-white dark:hover:bg-slate-900 transition-colors group">
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                      <div className={`p-2 rounded-lg ${isSystemRole ? 'bg-slate-100 dark:bg-slate-800 text-slate-500' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600'}`}>
                                        {isSystemRole ? <Briefcase size={16} /> : <Tags size={16} />}
                                      </div>
                                      <span className="font-bold text-gray-900 dark:text-white uppercase tracking-tight">{def.label}</span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 font-mono text-slate-400">{roleId}</td>
                                  <td className="px-6 py-4">
                                    <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500">{def.category}</span>
                                  </td>
                                  <td className="px-6 py-4">
                                    {def.reportsTo ? (
                                      <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium">
                                        <GitBranch size={12} className="rotate-180" />
                                        <span>{roleDefinitions[def.reportsTo as Role]?.label || def.reportsTo}</span>
                                      </div>
                                    ) : (
                                      <span className="text-slate-300 dark:text-slate-600 italic">None (Root)</span>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button onClick={() => handleOpenEditRole(roleId)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all" title="Edit Properties"><Edit3 size={16}/></button>
                                      {!isSystemRole && (
                                        <button onClick={() => confirmDeleteRole(roleId)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-all" title="Decommission Role"><Trash2 size={16}/></button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                            );
                          })}
                        </tbody>
                    </table>
                </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="p-4 md:p-8 animate-in fade-in duration-500">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                        <h3 className="text-lg md:text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Staff Registry</h3>
                        <p className="text-xs text-slate-400 font-medium mt-1">Manage organizational nodes and terminal credentials.</p>
                    </div>
                    <button onClick={() => handleOpenCreateUser()} className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-900 dark:bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all"><UserPlus size={16} /> Provision User</button>
                </div>
                <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-slate-800 bg-gray-50/30">
                    <table className="min-w-[800px] w-full text-xs text-left">
                        <thead className="bg-gray-100 dark:bg-slate-800 text-gray-400 font-black uppercase tracking-[0.2em]"><tr className="text-[9px]"><th className="px-6 py-4">Identity</th><th className="px-6 py-4">Designation</th><th className="px-6 py-4">Contact</th><th className="px-6 py-4">Auth Node</th><th className="px-6 py-4 text-right">Ops</th></tr></thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-800">{systemUsers.map(u => (
                            <tr key={u.id} className="hover:bg-white dark:hover:bg-slate-900 transition-colors group">
                              <td className="px-6 py-4 font-bold text-gray-900 dark:text-white truncate max-w-[150px]">{u.name}</td>
                              <td className="px-6 py-4"><span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800">{roleDefinitions[u.role as Role]?.label || u.role}</span></td>
                              <td className="px-6 py-4 font-mono text-gray-500 truncate max-w-[120px]">{u.phone || 'N/A'}</td>
                              <td className="px-6 py-4 font-mono text-gray-400 truncate max-w-[200px]">{u.email}</td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-2">
                                  <button onClick={() => handleOpenEditUser(u)} className="p-2 text-gray-400 hover:text-blue-600" title="Edit Profile"><Edit3 size={16} /></button>
                                  <button onClick={() => setUserToDelete(u)} className="p-2 text-gray-400 hover:text-red-600" title="Revoke Access"><Trash2 size={16} /></button>
                                </div>
                              </td>
                            </tr>))}
                        </tbody>
                    </table>
                </div>
            </div>
          )}

          {activeTab === 'matrix' && (
             <div className="h-full flex flex-col animate-in fade-in duration-500">
                <div className="p-6 md:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 shrink-0">
                    <div>
                        <h3 className="text-lg md:text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Authority Matrix</h3>
                        <p className="text-xs text-slate-500 font-medium mt-1 italic">Configure functional access mandates for each role designation.</p>
                    </div>
                </div>

                <div className="flex-1 overflow-auto px-6 md:px-8 pb-8 custom-scrollbar">
                  <div className="rounded-[2rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-900">
                      <table className="w-full text-left border-collapse table-fixed">
                          <thead>
                              <tr className="bg-slate-50 dark:bg-slate-950">
                                  <th className="p-5 w-64 text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-200 dark:border-slate-800 sticky left-0 bg-slate-50 dark:bg-slate-950 z-30 shadow-[4px_0_10px_rgba(0,0,0,0.02)]">
                                      Access Module
                                  </th>
                                  {Object.keys(roleDefinitions).map(roleId => (
                                      <th key={roleId} className="p-5 w-44 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center border-b border-slate-200 dark:border-slate-800">
                                          <div className="flex flex-col items-center gap-3">
                                              <span className="truncate max-w-[140px] text-slate-900 dark:text-white">{roleDefinitions[roleId as Role].label}</span>
                                          </div>
                                      </th>
                                  ))}
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                              {NAV_ITEMS.map(item => (
                                  <tr key={item.id} className="hover:bg-blue-50/20 dark:hover:bg-slate-800/40 transition-colors group">
                                      <td className="p-5 font-black text-[10px] text-slate-600 dark:text-slate-400 flex items-center gap-4 border-r border-slate-100 dark:border-slate-800 sticky left-0 bg-white dark:bg-slate-900 z-20 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/80 transition-colors uppercase tracking-tight">
                                          <div className={`p-2 rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner border border-slate-100 dark:border-slate-800`}>
                                            <item.icon size={14} />
                                          </div>
                                          {item.label}
                                      </td>
                                      {Object.keys(roleDefinitions).map(roleId => {
                                          const isAllowed = hasPermission(roleId, item.id);
                                          return (
                                              <td key={`${item.id}-${roleId}`} className="p-5 text-center">
                                                  <button 
                                                      onClick={() => togglePermission(roleId, item.id)}
                                                      className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all mx-auto border-2 ${
                                                        isAllowed 
                                                          ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20' 
                                                          : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-transparent hover:border-blue-400'
                                                      }`}
                                                  >
                                                      <Check size={14} strokeWidth={4} />
                                                  </button>
                                              </td>
                                          );
                                      })}
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
                </div>
             </div>
          )}

          {activeTab === 'hierarchy' && (
            <div className="p-4 md:p-12 min-h-full bg-gray-50/50 dark:bg-slate-950/20 overflow-x-auto">
                <div className="flex flex-col items-center">
                    <div className="text-center mb-12"><h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Chain of Command</h3><p className="text-xs md:text-sm text-slate-500 font-medium italic">Functional reporting structure and authority escalation paths.</p></div>
                    <div className="w-full max-w-5xl px-4">{renderHierarchyNode(Role.SUPER_ADMIN)}</div>
                </div>
            </div>
          )}
          
          {activeTab === 'attendance' && <div className="p-20 text-center text-slate-400 uppercase tracking-widest font-black text-sm">Attendance Logs Synchronizing...</div>}
          {activeTab === 'tools' && <div className="p-20 text-center text-slate-400 uppercase tracking-widest font-black text-sm">System Utilities Offline</div>}
      </div>

      {/* Role Management Modal */}
      {isRoleModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[1500] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in duration-200">
                <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/50">
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{roleModalMode === 'create' ? 'Provision Custom Role' : 'Edit Role Designation'}</h3>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-[0.2em] mt-1">Authority and permission mapping</p>
                    </div>
                    <button onClick={() => setIsRoleModalOpen(false)} className="p-3 hover:bg-white dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400"><X size={24}/></button>
                </div>
                <form onSubmit={handleRoleSubmit} className="p-10 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Role Identifier (ID)</label>
                            <input 
                              required 
                              disabled={roleModalMode === 'edit'}
                              type="text" 
                              value={newRole.id} 
                              onChange={e => setNewRole({...newRole, id: e.target.value.toLowerCase().replace(/\s+/g, '_')})} 
                              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-sm font-black text-slate-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none shadow-sm disabled:opacity-50" 
                              placeholder="e.g. specialized_inspector" 
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Visual Label</label>
                            <input 
                              required 
                              type="text" 
                              value={newRole.label} 
                              onChange={e => setNewRole({...newRole, label: e.target.value})} 
                              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-sm font-black text-slate-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none shadow-sm" 
                              placeholder="e.g. Site Inspector" 
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Category Classification</label>
                            <div className="relative">
                                <select value={newRole.category} onChange={e => setNewRole({...newRole, category: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-sm font-black text-slate-900 dark:text-white appearance-none cursor-pointer focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none shadow-sm">
                                    <option value="Administrative">Administrative</option>
                                    <option value="Operational">Operational</option>
                                    <option value="Field">Field</option>
                                    <option value="Logistics">Logistics</option>
                                </select>
                                <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Escalation Node (Reports To)</label>
                            <div className="relative">
                                <select value={newRole.reportsTo} onChange={e => setNewRole({...newRole, reportsTo: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-sm font-black text-slate-900 dark:text-white appearance-none cursor-pointer focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none shadow-sm">
                                    {Object.keys(roleDefinitions).map(roleId => (
                                        <option key={roleId} value={roleId}>{roleDefinitions[roleId as Role].label.toUpperCase()}</option>
                                    ))}
                                </select>
                                <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {roleModalMode === 'create' && (
                      <div className="space-y-4">
                          <div className="flex items-center justify-between ml-1">
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Initial Module Entitlements</label>
                              <button 
                                  type="button" 
                                  onClick={handleToggleAllPermissions}
                                  className="text-[9px] font-black text-blue-600 uppercase tracking-widest hover:underline"
                              >
                                  {localRolePermissions.length === NAV_ITEMS.length ? 'Deselect All' : 'Select All'}
                              </button>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {NAV_ITEMS.map(item => (
                                  <button 
                                      key={item.id}
                                      type="button"
                                      onClick={() => {
                                        setLocalRolePermissions(prev => prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id]);
                                      }}
                                      className={`flex items-center justify-between p-4 rounded-xl border text-left transition-all group/perm ${
                                        localRolePermissions.includes(item.id) 
                                          ? 'bg-blue-50 border-blue-500 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 shadow-sm' 
                                          : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-500 hover:border-slate-300 dark:hover:border-slate-600'
                                      }`}
                                  >
                                      <div className="flex items-center gap-3">
                                        <item.icon size={16} className={localRolePermissions.includes(item.id) ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'} />
                                        <span className="text-[10px] font-black uppercase tracking-tight">{item.label}</span>
                                      </div>
                                      <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${
                                          localRolePermissions.includes(item.id) 
                                              ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20' 
                                              : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700'
                                      }`}>
                                          {localRolePermissions.includes(item.id) && <Check size={12} strokeWidth={4}/>}
                                      </div>
                                  </button>
                              ))}
                          </div>
                      </div>
                    )}

                    <div className="flex gap-4 pt-4 sticky bottom-0 bg-white dark:bg-slate-900 py-4 border-t border-slate-50 dark:border-slate-800">
                        <button type="button" onClick={() => setIsRoleModalOpen(false)} className="flex-1 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Abort</button>
                        <button type="submit" className="flex-[2] py-5 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl active:scale-95 transition-all">
                          {roleModalMode === 'create' ? 'AUTHORIZE DESIGNATION' : 'COMMIT UPDATES'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* User Deletion Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[1100] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl max-w-sm w-full p-10 border border-slate-200 dark:border-slate-800 text-center">
                <div className="w-20 h-20 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-6"><UserMinus size={40} /></div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">Revoke Access?</h3>
                <p className="text-sm text-slate-500 mb-8 font-medium italic">Terminate all privileges for {userToDelete.name}.</p>
                <div className="flex flex-col gap-3">
                    <button onClick={() => { setSystemUsers(prev => prev.filter(u => u.id !== userToDelete.id)); setUserToDelete(null); toast.success('Access Revoked'); }} className="w-full py-4 bg-red-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-red-500/20 active:scale-95 transition-all">TERMINATE SESSION</button>
                    <button onClick={() => setUserToDelete(null)} className="w-full py-4 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">Abort Process</button>
                </div>
            </div>
        </div>
      )}

      {/* User Create/Edit Form Modal */}
      {isUserModalOpen && userModalStep === 'form' && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[1100] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in duration-200">
                <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/50">
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{userModalMode === 'create' ? 'New Asset: Operator' : 'Edit Personnel Registry'}</h3>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-[0.2em] mt-1">{userModalMode === 'create' ? 'Initializing secure credentials' : 'Updating system metadata'}</p>
                    </div>
                    <button onClick={() => setIsUserModalOpen(false)} className="p-3 hover:bg-white dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400"><X size={24}/></button>
                </div>
                <form onSubmit={handleUserFormSubmit} className="p-10 space-y-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Identity Signature (Name)</label>
                            <div className="relative">
                                <input required type="text" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl pl-12 pr-6 py-4 text-sm font-black text-slate-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none shadow-sm transition-all" placeholder="Full Legal Name" />
                                <UserCog size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Comms Node (Email)</label>
                            <div className="relative">
                                <input required type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl pl-12 pr-6 py-4 text-sm font-black text-slate-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none shadow-sm transition-all" placeholder="operator@fleetops.com" />
                                <Globe size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            </div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Mobile Terminal (Phone)</label>
                            <div className="relative">
                                <input type="tel" value={newUser.phone} onChange={e => setNewUser({...newUser, phone: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl pl-12 pr-6 py-4 text-sm font-black text-slate-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none shadow-sm transition-all" placeholder="+1 (555) 000-0000" />
                                <Smartphone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Designation Matrix (Role)</label>
                            <div className="relative">
                                <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl pl-12 pr-12 py-4 text-sm font-black text-slate-900 dark:text-white appearance-none cursor-pointer focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none shadow-sm transition-all">
                                    {Object.keys(roleDefinitions).map(roleId => (
                                        <option key={roleId} value={roleId}>{roleDefinitions[roleId as Role].label.toUpperCase()}</option>
                                    ))}
                                </select>
                                <Shield size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1 flex items-center gap-2">
                           <Star size={12} className="text-blue-500" /> Expertise & Skills
                        </label>
                        <div className="flex flex-wrap gap-2 p-1">
                          {AVAILABLE_SKILLS.map(skill => {
                            const isSelected = newUser.skills.includes(skill);
                            return (
                              <button
                                key={skill}
                                type="button"
                                onClick={() => handleToggleSkill(skill)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all active:scale-95 ${
                                  isSelected 
                                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20' 
                                    : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400 hover:border-blue-500 dark:hover:border-blue-500'
                                }`}
                              >
                                {skill}
                              </button>
                            );
                          })}
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4 sticky bottom-0 bg-white dark:bg-slate-900 py-4 border-t border-slate-50 dark:border-slate-800">
                        <button type="button" onClick={() => setIsUserModalOpen(false)} className="flex-1 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Abort</button>
                        <button type="submit" className="flex-[2] py-5 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl active:scale-95 transition-all">COMMIT REGISTRY</button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* Provisioning Success Modal (Creation) */}
      {isUserModalOpen && userModalStep === 'success' && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[1200] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl max-w-md w-full p-12 border border-slate-200 dark:border-slate-800 text-center">
                <div className="w-24 h-24 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-8 shadow-inner ring-8 ring-emerald-500/5 animate-bounce"><CheckSquare size={48} /></div>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-4 uppercase tracking-tighter">Credentials Secure</h3>
                <p className="text-sm text-slate-500 mb-10 font-medium">Provisioning complete. Provide the following data to the operator.</p>
                
                <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-4 mb-10 shadow-inner">
                    <div className="flex justify-between items-center group">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID</span>
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">{generatedCreds.email}</span>
                            <button onClick={() => { navigator.clipboard.writeText(generatedCreds.email); toast.success('ID Copied'); }} className="p-1.5 hover:bg-white dark:hover:bg-slate-800 rounded-lg text-slate-300 hover:text-blue-600 transition-all"><Copy size={14}/></button>
                        </div>
                    </div>
                    <div className="flex justify-between items-center group">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Token</span>
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-bold text-blue-600">{generatedCreds.password}</span>
                            <button onClick={() => { navigator.clipboard.writeText(generatedCreds.password); toast.success('Token Copied'); }} className="p-1.5 hover:bg-white dark:hover:bg-slate-800 rounded-lg text-slate-300 hover:text-blue-600 transition-all"><Copy size={14}/></button>
                        </div>
                    </div>
                </div>

                <button onClick={() => setIsUserModalOpen(false)} className="w-full py-5 bg-slate-900 dark:bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl active:scale-95 transition-all">DISMISS COMMAND</button>
            </div>
        </div>
      )}
    </div>
  );
};
