
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.tsx';
import { useTheme } from '../contexts/ThemeContext.tsx';
import { 
  User, Mail, Phone, Bell, Moon, Sun, Shield, 
  Save, Camera, Key, Smartphone, Globe, CheckCircle2,
  ChevronRight, ArrowLeft, Loader2, Lock, Eye, EyeOff,
  Plus, Trash2, Copy, Zap, Fingerprint, ShieldAlert,
  Terminal, ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  created: string;
  lastUsed: string;
}

const MOCK_API_KEYS: ApiKey[] = [
  { id: 'ak_1', name: 'External Telemetry Sync', key: 'fl_live_492...x921', created: '2023-11-12', lastUsed: '2 hours ago' },
  { id: 'ak_2', name: 'Maintenance Hub Webhook', key: 'fl_live_103...z882', created: '2024-01-05', lastUsed: 'Yesterday' }
];

export const UserSettings = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isSaving, setIsSaving] = useState(false);
  
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '+1 (555) 012-3456',
  });

  const [passwordForm, setPasswordForm] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [showPasswords, setShowPasswords] = useState(false);

  const [apiKeys, setApiKeys] = useState<ApiKey[]>(MOCK_API_KEYS);
  const [isMfaEnabled, setIsMfaEnabled] = useState(true);

  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    criticalOnly: false
  });

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 1000));
    setIsSaving(false);
    toast.success('Profile preferences updated in nexus registry');
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.new !== passwordForm.confirm) {
      toast.error('Token confirmation mismatch');
      return;
    }
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 1500));
    setIsSaving(false);
    setPasswordForm({ current: '', new: '', confirm: '' });
    toast.success('Access credentials rotated successfully');
  };

  const generateApiKey = () => {
    const newId = `ak_${Date.now()}`;
    const newKey: ApiKey = {
      id: newId,
      name: `Integrate_${Math.floor(Math.random() * 1000)}`,
      key: `fl_live_${Math.random().toString(36).substring(2, 10)}...${Math.random().toString(36).substring(2, 6)}`,
      created: new Date().toISOString().split('T')[0],
      lastUsed: 'Never'
    };
    setApiKeys([newKey, ...apiKeys]);
    toast.success('New API Access Node provisioned');
  };

  const revokeApiKey = (id: string) => {
    setApiKeys(apiKeys.filter(k => k.id !== id));
    toast.error('API Access Node decommissioned');
  };

  const toggleNotif = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Link to="/app" className="p-3 bg-white dark:bg-slate-800 rounded-2xl text-slate-400 hover:text-blue-600 transition-all shadow-sm border border-slate-100 dark:border-slate-800">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">User Terminal</h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2">Manage your personal organizational node and security protocols.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Col: Account Summary */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm p-8 text-center">
            <div className="relative inline-block group mb-6">
              <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-4xl font-black text-white shadow-2xl border-4 border-white dark:border-slate-800 group-hover:rotate-3 transition-transform">
                {user?.name?.charAt(0)}
              </div>
              <button className="absolute -bottom-2 -right-2 p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-xl text-blue-600 border border-slate-100 dark:border-slate-700 hover:scale-110 active:scale-95 transition-all">
                <Camera size={18} />
              </button>
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">{user?.name}</h3>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-3">ID: {user?.id?.substring(0,8)}</p>
            
            <div className="mt-8 pt-8 border-t border-slate-50 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between text-left">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Authority</span>
                <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded text-[9px] font-black uppercase border border-blue-100 dark:border-blue-800">{user?.role?.replace('_', ' ')}</span>
              </div>
              <div className="flex items-center justify-between text-left">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Registry Status</span>
                <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 uppercase"><CheckCircle2 size={12}/> Verified</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-2xl shadow-blue-500/20 relative overflow-hidden group">
            <div className="absolute inset-0 bg-blue-600/10 group-hover:bg-blue-600/20 transition-colors"></div>
            <div className="relative z-10">
              <Shield className="text-blue-400 mb-4" size={32} />
              <h4 className="font-black text-lg uppercase tracking-tight mb-2">Enterprise Security</h4>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">Your terminal session is protected by end-to-end organizational encryption protocols.</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
             <div className="flex items-center justify-between mb-4">
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Authentication</h4>
               <Fingerprint size={16} className="text-blue-500" />
             </div>
             <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
               <span className="text-xs font-bold text-slate-700 dark:text-slate-300">2FA Node</span>
               <button 
                onClick={() => setIsMfaEnabled(!isMfaEnabled)}
                className={`w-10 h-6 rounded-full transition-all relative p-1 ${isMfaEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}
               >
                 <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isMfaEnabled ? 'left-5' : 'left-1'}`}></div>
               </button>
             </div>
          </div>
        </div>

        {/* Right Col: Settings Forms */}
        <div className="lg:col-span-2 space-y-8">
          {/* Profile Form */}
          <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
               <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
                 <User size={18} className="text-blue-600" /> Identity Profile
               </h3>
            </div>
            <form onSubmit={handleSaveProfile} className="p-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Signature Name</label>
                  <input 
                    type="text" 
                    value={profile.name}
                    onChange={e => setProfile({...profile, name: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Comms Terminal (Email)</label>
                  <div className="relative">
                    <input 
                      type="email" 
                      value={profile.email}
                      onChange={e => setProfile({...profile, email: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 pl-12 text-sm font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all" 
                    />
                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Secondary Node (Phone)</label>
                  <div className="relative">
                    <input 
                      type="tel" 
                      value={profile.phone}
                      onChange={e => setProfile({...profile, phone: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 pl-12 text-sm font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all" 
                    />
                    <Smartphone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
              </div>
              <div className="pt-4">
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="w-full sm:w-auto px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-blue-500/40 active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                  COMMIT PREFERENCES
                </button>
              </div>
            </form>
          </section>

          {/* Interface / Theme Section */}
          <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
               <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
                 <Globe size={18} className="text-purple-500" /> Terminal Interface
               </h3>
            </div>
            <div className="p-10 space-y-8">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-8 bg-slate-50 dark:bg-slate-950 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-inner">
                <div>
                  <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-tight">Active Theme</h4>
                  <p className="text-xs text-slate-500 font-medium mt-1 uppercase tracking-widest">Adjust visual contrast parameters</p>
                </div>
                <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                  <button 
                    onClick={() => theme !== 'light' && toggleTheme()}
                    className={`flex items-center gap-3 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${theme === 'light' ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <Sun size={16} /> Light
                  </button>
                  <button 
                    onClick={() => theme !== 'dark' && toggleTheme()}
                    className={`flex items-center gap-3 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${theme === 'dark' ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    <Moon size={16} /> Night
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Security Section (Password and Keys) */}
          <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
               <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
                 <Lock size={18} className="text-red-500" /> Security Nexus
               </h3>
               <span className="text-[10px] font-black text-red-500 uppercase bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded-full animate-pulse">Critical Zone</span>
            </div>
            
            <div className="p-10 space-y-12">
              {/* Change Password */}
              <div>
                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                   <Key size={14} /> Password Protocol
                </h4>
                <form onSubmit={handleUpdatePassword} className="space-y-6">
                   <div className="relative group">
                     <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Current Token</label>
                     <div className="relative">
                       <input 
                         required
                         type={showPasswords ? "text" : "password"}
                         value={passwordForm.current}
                         onChange={e => setPasswordForm({...passwordForm, current: e.target.value})}
                         className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-sm font-mono text-slate-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all" 
                       />
                       <button 
                        type="button"
                        onClick={() => setShowPasswords(!showPasswords)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-500"
                       >
                         {showPasswords ? <EyeOff size={18} /> : <Eye size={18} />}
                       </button>
                     </div>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="relative">
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">New Terminal Token</label>
                        <input 
                          required
                          type={showPasswords ? "text" : "password"}
                          value={passwordForm.new}
                          onChange={e => setPasswordForm({...passwordForm, new: e.target.value})}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-sm font-mono text-slate-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all" 
                        />
                      </div>
                      <div className="relative">
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Confirm Token</label>
                        <input 
                          required
                          type={showPasswords ? "text" : "password"}
                          value={passwordForm.confirm}
                          onChange={e => setPasswordForm({...passwordForm, confirm: e.target.value})}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-sm font-mono text-slate-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all" 
                        />
                      </div>
                   </div>
                   <button 
                    type="submit" 
                    className="px-8 py-4 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl"
                   >
                     Update Access Node
                   </button>
                </form>
              </div>

              {/* API Access Tokens */}
              <div className="pt-8 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                       <Terminal size={14} /> API Access Hub
                    </h4>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">External fleet integration nodes</p>
                  </div>
                  <button 
                    onClick={generateApiKey}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg hover:bg-blue-700 transition-all active:scale-95"
                  >
                    <Plus size={14} /> Provision Node
                  </button>
                </div>

                <div className="space-y-4">
                   {apiKeys.length === 0 ? (
                     <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/30 rounded-3xl border-2 border-dashed border-slate-100 dark:border-slate-700">
                        <Terminal size={32} className="text-slate-300 mx-auto mb-3" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No active API nodes detected</p>
                     </div>
                   ) : (
                     apiKeys.map(k => (
                       <div key={k.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-700 group hover:border-blue-200 dark:hover:border-blue-800 transition-all">
                          <div className="space-y-2 mb-4 sm:mb-0">
                             <div className="flex items-center gap-3">
                               <h5 className="font-black text-slate-900 dark:text-white text-xs uppercase tracking-tight">{k.name}</h5>
                               <span className="text-[8px] font-black px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase">Live</span>
                             </div>
                             <div className="flex items-center gap-3 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-700">
                                <code className="text-[11px] font-mono text-slate-500 dark:text-slate-400">{k.key}</code>
                                <button 
                                  onClick={() => { navigator.clipboard.writeText(k.key); toast.success('Node key copied to buffer'); }}
                                  className="text-slate-300 hover:text-blue-500 transition-colors"
                                >
                                  <Copy size={12} />
                                </button>
                             </div>
                             <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Last Traffic: {k.lastUsed} | Created: {k.created}</p>
                          </div>
                          <div className="flex items-center gap-2">
                             <button className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all shadow-sm"><ExternalLink size={16} /></button>
                             <button 
                              onClick={() => revokeApiKey(k.id)}
                              className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all shadow-sm"
                             >
                               <Trash2 size={16} />
                             </button>
                          </div>
                       </div>
                     ))
                   )}
                </div>
                
                <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/10 rounded-3xl border-2 border-dashed border-blue-200 dark:border-blue-900/30 flex items-start gap-4">
                   <Zap size={20} className="text-blue-600 mt-1 shrink-0" />
                   <p className="text-[10px] text-blue-800 dark:text-blue-300 font-bold leading-relaxed uppercase tracking-tight">
                     Operational Alert: API nodes have full read/write access to organizational telemetry. Secure these tokens in high-integrity vaults only.
                   </p>
                </div>
              </div>
            </div>
          </section>

          {/* Notifications Section */}
          <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
               <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
                 <Bell size={18} className="text-orange-500" /> Dispatch Alerts
               </h3>
            </div>
            <div className="p-10 space-y-6">
              {[
                { id: 'email', label: 'Email Protocol', desc: 'Summary logs and maintenance schedules' },
                { id: 'push', label: 'Push Telemetry', desc: 'Real-time asset movement and geofencing' },
                { id: 'sms', label: 'Emergency SMS', desc: 'Direct mission-critical safety alerts' },
                { id: 'criticalOnly', label: 'Priority Only', desc: 'Suppress non-critical operational chatter' }
              ].map(opt => (
                <div key={opt.id} className="flex items-center justify-between p-6 bg-slate-50/50 dark:bg-slate-950/30 rounded-2xl border border-slate-100 dark:border-slate-800 group hover:border-blue-200 transition-all">
                  <div>
                    <h4 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-tight">{opt.label}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{opt.desc}</p>
                  </div>
                  <button 
                    onClick={() => toggleNotif(opt.id as any)}
                    className={`w-14 h-8 rounded-full transition-all relative p-1 ${notifications[opt.id as keyof typeof notifications] ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-800'}`}
                  >
                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg transition-all ${notifications[opt.id as keyof typeof notifications] ? 'left-7' : 'left-1'}`}></div>
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
