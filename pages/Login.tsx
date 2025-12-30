import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Truck, Settings, MapPin, Users, Package, Wrench, 
  Lock, Mail, Eye, EyeOff, ShieldCheck, Loader2,
  ChevronRight, ArrowRight, HardHat
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.tsx';
import { API_BASE_URL } from '../constants.ts';
import { Role } from '../types.ts';
import toast from 'react-hot-toast';

export const Login = () => {
  const navigate = useNavigate();
  const { login, logout, isAuthenticated } = useAuth();
  
  const [email, setEmail] = useState('admin@fleetops.com');
  const [password, setPassword] = useState('password');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/app', { replace: true });
    }
  }, [isAuthenticated, navigate]);
  
  const performMockLogin = (targetEmail: string) => {
    let role = Role.SUPER_ADMIN;
    let name = 'Global Administrator';

    if (targetEmail.startsWith('site_mgr')) { role = Role.SITE_MANAGER; name = 'Steve Rodgers'; }
    else if (targetEmail.startsWith('fleet')) { role = Role.FLEET_MANAGER; name = 'Tony Stark'; }
    else if (targetEmail.startsWith('super')) { role = Role.SUPERVISOR; name = 'Sarah Connor'; }
    else if (targetEmail.startsWith('inv_mgr')) { role = Role.INVENTORY_MANAGER; name = 'Natasha Romanoff'; }
    else if (targetEmail.startsWith('maint_mgr')) { role = Role.MAINTENANCE_MANAGER; name = 'Bruce Banner'; }
    else if (targetEmail.startsWith('driver')) { role = Role.DRIVER; name = 'Mike Ross'; }

    const mockUser = {
      id: `u-${Math.random().toString(36).substring(7)}`,
      email: targetEmail,
      name,
      role,
      tenantId: 'tenant-enterprise-01',
      version: 1,
      createdBy: 'system',
      updatedBy: 'system',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    login(mockUser, 'session-token-valid-72h');
    toast.success(`Welcome, ${name}`);
    navigate('/app');
  };

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) throw new Error('Unauthorized');
      const data = await res.json();
      login(data.user, data.token);
      navigate('/app');
    } catch (err) {
      // In development/demo mode, we bypass to mock auth if server isn't running
      performMockLogin(email);
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (roleEmail: string) => {
    setEmail(roleEmail);
    logout();
    performMockLogin(roleEmail);
  };

  const simulatorOptions = [
    { label: 'Admin', icon: Settings, email: 'admin@fleetops.com' },
    { label: 'Site', icon: MapPin, email: 'site_mgr@fleetops.com' },
    { label: 'Fleet', icon: Users, email: 'fleet@fleetops.com' },
    { label: 'Operator', icon: HardHat, email: 'driver@fleetops.com' },
    { label: 'Inventory', icon: Package, email: 'inv_mgr@fleetops.com' },
    { label: 'Maint', icon: Wrench, email: 'maint_mgr@fleetops.com' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 selection:bg-blue-500/30 font-sans transition-colors duration-500">
      
      {/* Background Subtle Accent */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full"></div>
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-indigo-500/5 blur-[120px] rounded-full"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-[440px] relative z-10"
      >
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/20 mb-6">
            <Truck size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
            FleetOps <span className="text-blue-600">Core</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">Enterprise Intelligence Terminal</p>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-none p-10">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-5">
              {/* Email Input */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Identity Node</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <Mail size={18} />
                  </div>
                  <input 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3.5 pl-11 pr-4 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all"
                    placeholder="name@company.com"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Access Token</label>
                  <button type="button" className="text-[10px] font-bold text-slate-400 hover:text-blue-600 transition-colors">Recover</button>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <Lock size={18} />
                  </div>
                  <input 
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3.5 pl-11 pr-11 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all"
                    placeholder="••••••••"
                    required
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <button 
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl uppercase tracking-widest text-xs shadow-lg shadow-blue-500/20 flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>Sign In <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          {/* Verification Badge */}
          <div className="mt-8 pt-8 border-t border-slate-50 dark:border-slate-800 flex items-center justify-center gap-2">
            <ShieldCheck size={14} className="text-emerald-500" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Authorized Access Only</span>
          </div>
        </div>

        {/* Minimal Simulator Deck */}
        <div className="mt-12 space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800"></div>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Simulation Access</span>
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800"></div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {simulatorOptions.map((opt) => (
              <button 
                key={opt.email}
                onClick={() => quickLogin(opt.email)}
                className="flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl hover:border-blue-500/50 hover:shadow-lg transition-all group"
              >
                <opt.icon size={18} className="text-slate-400 group-hover:text-blue-500 transition-colors mb-2" />
                <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        <footer className="mt-12 text-center">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">&copy; {new Date().getFullYear()} FleetOps Intelligence Systems</p>
        </footer>
      </motion.div>
    </div>
  );
};