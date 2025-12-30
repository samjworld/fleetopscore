
import React from 'react';
import { NavLink, useLocation, useNavigate, Link } from 'react-router-dom';
import { NAV_ITEMS } from '../constants.ts';
import { Truck, LogOut, X, ChevronRight, Moon, Sun, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.tsx';
import { useConfig } from '../contexts/ConfigContext.tsx';
import { useTheme } from '../contexts/ThemeContext.tsx';
import { Role } from '../types.ts';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { hasPermission } = useConfig();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userRole = user?.role || Role.DRIVER;
  const filteredItems = NAV_ITEMS.filter(item => hasPermission(userRole, item.id));

  return (
    <>
      {/* High-priority overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[5000] md:hidden transition-all duration-300"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed md:relative inset-y-0 left-0 z-[6000] w-64 bg-slate-900 dark:bg-slate-950 text-white flex flex-col shadow-[0_0_80px_rgba(0,0,0,0.5)]
        transform transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] border-r border-slate-800
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="h-16 flex items-center justify-between px-5 bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-1.5 rounded-lg shadow-2xl shadow-blue-900/50 transition-transform hover:rotate-12">
                <Truck className="text-white" size={18} />
            </div>
            <div>
                <h1 className="text-lg font-black tracking-widest text-white leading-none uppercase">FleetOps</h1>
            </div>
          </div>
          <button onClick={onClose} className="md:hidden text-slate-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800">
            <X size={24} />
          </button>
        </div>

        <Link to="/app/user-settings" onClick={() => onClose()} className="px-5 py-6 border-b border-slate-800/50 bg-slate-950/20 group block">
          <div className="flex items-center gap-3 cursor-pointer">
             <div className="relative shrink-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-black text-white text-sm shadow-2xl border-2 border-slate-900 group-hover:border-blue-500 transition-all duration-500">
                  {user?.name.charAt(0) || 'U'}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full shadow-lg"></div>
             </div>
             <div className="overflow-hidden flex-1">
               <div className="flex items-center justify-between">
                 <p className="text-[11px] font-black text-white truncate group-hover:text-blue-400 transition-colors uppercase tracking-tight">{user?.name || 'Authorized Guest'}</p>
                 <Settings size={10} className="text-slate-600 group-hover:text-blue-400 transition-colors" />
               </div>
               <p className="text-[8px] text-slate-500 font-black truncate uppercase tracking-[0.2em] mt-0.5">{user?.role?.replace('_', ' ') || 'Pending Auth'}</p>
             </div>
          </div>
        </Link>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto custom-scrollbar">
          {filteredItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/app' && location.pathname.startsWith(item.path));
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => onClose()}
                className={`flex items-center justify-between px-4 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 group ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/50 translate-x-1' 
                    : 'text-slate-500 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center">
                    <item.icon size={16} className={`mr-3 transition-all duration-300 ${isActive ? 'text-white scale-110' : 'text-slate-600 group-hover:text-white group-hover:scale-110'}`} />
                    {item.label}
                </div>
                {isActive && <ChevronRight size={14} className="text-blue-200 animate-pulse" />}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-800 flex-shrink-0 bg-slate-950/50 flex items-center gap-2">
          <button 
            onClick={toggleTheme}
            className="flex-shrink-0 p-2.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition-all border border-slate-800 shadow-inner group"
          >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>
          
          <button 
            onClick={handleLogout}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-[9px] font-black uppercase tracking-[0.1em] text-slate-400 hover:text-red-500 hover:bg-red-500/10 border border-slate-800 rounded-xl transition-all group"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
};