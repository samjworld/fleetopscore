
import React, { useState } from 'react';
import { User as UserIcon, Shield, Mail, Phone, MoreVertical, Plus, Lock, X, Check, Copy, AlertTriangle, ArrowRight, Settings, Star, Download } from 'lucide-react';
// Fix: Added .ts extension for consistency with project standards
import { MOCK_DRIVERS, ROLE_DEFINITIONS } from '../constants.ts';
// Fix: Added .tsx extension for consistency with project standards
import { useAuth } from '../contexts/AuthContext.tsx';
// Fix: Added .ts extension for consistency with project standards
import { Role } from '../types.ts';
// Fix: Added useNavigate to imports to resolve navigate reference error
import { Link, useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

const INITIAL_STAFF = [
    ...MOCK_DRIVERS.map(d => ({ 
        ...d, 
        role: 'Driver', 
        email: `${d.name.split(' ')[0].toLowerCase()}@fleetops.com`, 
        id: d.id, 
        phone: '+1 (555) 010-9988',
        skills: d.skills || []
    })),
    { id: 's1', name: 'Site Manager Steve', role: 'Site Manager', status: 'active', email: 'steve@fleetops.com', rating: 5.0, phone: '+1 (555) 012-3456', skills: ['Site Supervision', 'Safety'] },
    { id: 's2', name: 'Admin Alice', role: 'Super Admin', status: 'active', email: 'alice@fleetops.com', rating: 5.0, phone: '+1 (555) 099-8877', skills: ['Logistics'] },
];

export const Users = () => {
  const { user } = useAuth();
  // Fix: Initialized useNavigate hook to allow programmatic navigation
  const navigate = useNavigate();
  const [staffList, setStaffList] = useState(INITIAL_STAFF);
  const isSuperAdmin = user?.role === Role.SUPER_ADMIN;

  const handleExport = () => {
    if (staffList.length === 0) return toast.error('Roster is empty');
    
    const exportData = staffList.map(s => ({
      'Staff ID': s.id,
      'Full Name': s.name,
      'Designated Role': s.role,
      'Operational Status': s.status?.toUpperCase() || 'ACTIVE',
      'Email Node': s.email,
      'Contact Node': s.phone || 'N/A',
      'Safety Index (Rating)': s.rating || 'N/A',
      'Verified Skills': s.skills?.join(', ') || 'None'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Operational Roster");
    XLSX.writeFile(wb, `FleetOps_Roster_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Staff Roster exported');
  };

  return (
    <div className="space-y-6 pb-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
           <h2 className="text-2xl font-bold text-gray-800 dark:text-white uppercase tracking-tight leading-none">Staff Directory</h2>
           <p className="text-sm text-gray-500 dark:text-slate-400 mt-2 font-medium italic">View driver profiles, assigned expertise, and contact information.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <button 
                onClick={handleExport}
                className="flex items-center gap-2 px-6 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white rounded-xl font-black hover:bg-slate-50 shadow-sm transition-all uppercase text-[10px] tracking-widest active:scale-95"
            >
                <Download size={18} /> Export Roster
            </button>
            {isSuperAdmin && (
                <Link 
                    to="/app/settings"
                    className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 dark:bg-blue-600 text-white rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-blue-700 shadow-xl transition-all uppercase text-[10px] tracking-widest active:scale-95"
                >
                    <Settings size={18} /> Manage Access
                </Link>
            )}
        </div>
      </div>

      {!isSuperAdmin && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-4 rounded-xl flex items-start gap-3">
              <Shield className="text-blue-600 dark:text-blue-400 mt-0.5" size={20} />
              <div>
                  <h4 className="text-sm font-bold text-blue-900 dark:text-blue-300 uppercase tracking-tight">Directory View</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-400 mt-1 italic">
                      You are viewing the staff directory. To request new user accounts or password resets, contact a Super Administrator.
                  </p>
              </div>
          </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {staffList.map(item => (
              <div key={item.id} className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-sm border border-gray-200 dark:border-slate-700 p-8 flex flex-col gap-5 hover:shadow-xl hover:border-blue-500 transition-all group">
                  <div className="flex justify-between items-start">
                      <div className="flex items-center gap-5">
                          <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-2xl font-black text-blue-600 dark:text-blue-400 border border-gray-100 dark:border-slate-700 shadow-inner group-hover:bg-blue-600 group-hover:text-white transition-all">
                              {item.name.charAt(0)}
                          </div>
                          <div>
                              <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none text-lg mb-2">{item.name}</h3>
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-blue-500 transition-colors">{item.role}</p>
                          </div>
                      </div>
                      <button className="p-2 text-gray-300 hover:text-gray-600 dark:hover:text-slate-200 transition-colors">
                          <MoreVertical size={20} />
                      </button>
                  </div>
                  
                  {item.skills && item.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 py-1">
                          {item.skills.map(skill => (
                              <span key={skill} className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-900/50 text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-700 flex items-center gap-1.5 group-hover:border-blue-200 dark:group-hover:border-blue-900 transition-colors">
                                  <Star size={10} className="text-blue-500" /> {skill}
                              </span>
                          ))}
                      </div>
                  )}

                  <div className="space-y-3 py-4 border-y border-slate-50 dark:border-slate-700/50">
                      <div className="flex items-center gap-3 text-xs font-bold text-gray-600 dark:text-slate-300">
                          <Mail size={16} className="text-slate-300 dark:text-slate-600" /> <span className="truncate">{item.email}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs font-bold text-gray-600 dark:text-slate-300">
                          <Phone size={16} className="text-slate-300 dark:text-slate-600" /> {item.phone || 'N/A'}
                      </div>
                  </div>

                  <div className="flex items-center justify-between mt-auto">
                      <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] border shadow-sm ${
                          item.status === 'active' || item.status === 'available' ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50' : 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800'
                      }`}>
                          {item.status ? item.status.replace('_', ' ') : 'Active'}
                      </span>
                      {item.role === 'Driver' && (
                          <div className="flex flex-col items-end">
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Safety Index</span>
                              <span className="text-xs font-black text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                  {item.rating} <Star size={12} className="fill-current" />
                              </span>
                          </div>
                      )}
                  </div>
              </div>
          ))}

          {isSuperAdmin && (
              <button 
                  onClick={() => navigate('/app/settings')}
                  className="border-4 border-dashed border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-slate-300 dark:text-slate-700 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50/50 transition-all group min-h-[300px]"
              >
                  <div className="w-16 h-16 rounded-[1.5rem] bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">
                      <Plus size={32} />
                  </div>
                  <span className="font-black text-xs uppercase tracking-[0.2em]">Provision New Node</span>
              </button>
          )}
      </div>
    </div>
  );
};
