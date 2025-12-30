
import React, { useState, useMemo } from 'react';
import { 
  Fuel, TrendingUp, AlertTriangle, Droplets, ArrowDownRight, 
  Download, Calendar, X, FileText, CheckCircle2, Loader2,
  ChevronRight, Filter, Database, Clock, Edit3, Plus, Search,
  Truck, DollarSign, Gauge, Save, Zap, Info, ChevronDown,
  History, CreditCard, MoreVertical, Trash2, BarChart3, Activity
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Legend, AreaChart, Area
} from 'recharts';
import { API_BASE_URL, MOCK_VEHICLES } from '../constants.ts';
import { useAuth } from '../contexts/AuthContext.tsx';
import { FuelType } from '../types.ts';
import toast from 'react-hot-toast';

const CONSUMPTION_DATA = [
  { day: 'Mon', excavators: 450, dozers: 200, fuelPrice: 4.2 },
  { day: 'Tue', excavators: 420, dozers: 210, fuelPrice: 4.15 },
  { day: 'Wed', excavators: 480, dozers: 190, fuelPrice: 4.25 },
  { day: 'Thu', excavators: 510, dozers: 220, fuelPrice: 4.3 },
  { day: 'Fri', excavators: 390, dozers: 240, fuelPrice: 4.28 },
  { day: 'Sat', excavators: 250, dozers: 150, fuelPrice: 4.22 },
  { day: 'Sun', excavators: 180, dozers: 100, fuelPrice: 4.2 },
];

const INITIAL_ENTRIES = [
    { id: 'tx-001', vehicleId: '1', vehicleName: 'Excavator X1', type: 'DIESEL', volume: 120.5, cost: 512.40, odometer: 12450, date: '2024-03-24', time: '09:15', operator: 'Mike Ross' },
    { id: 'tx-002', vehicleId: '2', vehicleName: 'Dozer D5', type: 'DIESEL', volume: 85.0, cost: 361.25, odometer: 3420, date: '2024-03-23', time: '14:30', operator: 'Louis Litt' },
    { id: 'tx-003', vehicleId: '3', vehicleName: 'Crane C2', type: 'DIESEL', volume: 210.0, cost: 892.50, odometer: 5105, date: '2024-03-23', time: '08:45', operator: 'Harvey Specter' },
];

export const FuelPage = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState(INITIAL_ENTRIES);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    vehicleId: '',
    volume: '',
    cost: '',
    odometer: '',
    fuelType: FuelType.DIESEL,
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
  });

  const filteredEntries = useMemo(() => {
    return entries.filter(e => 
        e.vehicleName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        e.operator.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [entries, searchTerm]);

  const handleLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vehicleId || !formData.volume || !formData.cost) {
        return toast.error('All critical telemetry fields are required');
    }

    setIsSaving(true);
    // Simulate nexus synchronization
    await new Promise(r => setTimeout(r, 1200));

    const vehicle = MOCK_VEHICLES.find(v => v.id === formData.vehicleId);
    
    const newEntry = {
        id: `tx-${Math.floor(1000 + Math.random() * 9000)}`,
        vehicleId: formData.vehicleId,
        vehicleName: vehicle?.name || 'Unknown',
        type: formData.fuelType,
        volume: parseFloat(formData.volume),
        cost: parseFloat(formData.cost),
        odometer: parseInt(formData.odometer),
        date: formData.date,
        time: formData.time,
        operator: user?.name || 'Authorized System'
    };

    setEntries([newEntry, ...entries]);
    setIsSaving(false);
    setIsLogModalOpen(false);
    toast.success('Energy injection record finalized');
    
    // Reset form
    setFormData({
        vehicleId: '',
        volume: '',
        cost: '',
        odometer: '',
        fuelType: FuelType.DIESEL,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
    });
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
           <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter flex items-center gap-4">
              <div className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-500/20">
                <Fuel size={24} />
              </div>
              Energy Analytics
           </h2>
           <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-2 italic uppercase tracking-wider">Fleet consumption metrics and operational injection logs.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
            <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 active:scale-95 shadow-sm transition-all">
                <Download size={16} /> Audit Export
            </button>
            <button 
                onClick={() => setIsLogModalOpen(true)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3.5 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-blue-700 shadow-xl shadow-blue-500/30 active:scale-95 transition-all"
            >
                <Plus size={16} /> Log Transaction
            </button>
        </div>
      </div>

      {/* KPI Stripe */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden group">
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Total Injected (30D)</p>
            <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter tabular-nums">3,240 <span className="text-sm opacity-40">LTR</span></h3>
            <div className="mt-4 flex items-center gap-2 text-emerald-500 font-bold text-[10px] uppercase">
                <TrendingUp size={12} /> +12% vs Previous
            </div>
            <Fuel className="absolute -right-4 -bottom-4 text-blue-500 opacity-5 group-hover:scale-110 transition-transform" size={120} />
        </div>
        <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden group">
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Energy CAPEX (30D)</p>
            <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter tabular-nums">$14,280</h3>
            <div className="mt-4 flex items-center gap-2 text-red-500 font-bold text-[10px] uppercase">
                <ArrowDownRight size={12} /> -2% vs Previous
            </div>
            <CreditCard className="absolute -right-4 -bottom-4 text-blue-500 opacity-5 group-hover:scale-110 transition-transform" size={120} />
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col h-full overflow-hidden">
            <div className="flex items-center justify-between mb-12">
               <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3 leading-none">
                    {/* Fix: Added missing icon import */}
                    <BarChart3 size={20} className="text-blue-600" /> Departmental Load
                  </h3>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2 italic">Energy volume by asset classification (7D)</p>
               </div>
            </div>
            <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={CONSUMPTION_DATA}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.05} />
                        <XAxis 
                            dataKey="day" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} 
                        />
                        <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} 
                        />
                        <Tooltip 
                            cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
                            contentStyle={{ borderRadius: '24px', border: 'none', background: '#0f172a', color: '#fff', fontSize: '10px', padding: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}
                        />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', tracking: '0.1em', paddingTop: '20px' }} />
                        <Bar dataKey="excavators" name="EXCAVATION" fill="#3b82f6" radius={[6,6,0,0]} barSize={24} />
                        <Bar dataKey="dozers" name="HEAVY EARTH" fill="#10b981" radius={[6,6,0,0]} barSize={24} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
         </div>

         <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col h-full overflow-hidden">
            <div className="flex items-center justify-between mb-12">
               <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3 leading-none">
                    {/* Fix: Added missing icon import */}
                    <Activity size={20} className="text-emerald-500" /> Market Price Variance
                  </h3>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2 italic">Energy node price fluctuations per unit (7D)</p>
               </div>
            </div>
            <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={CONSUMPTION_DATA}>
                        <defs>
                            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.05} />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} />
                        <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} />
                        <Tooltip contentStyle={{ borderRadius: '24px', border: 'none', background: '#0f172a', color: '#fff', fontSize: '10px' }} />
                        <Area type="monotone" dataKey="fuelPrice" name="Unit Cost ($)" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#priceGradient)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
         </div>
      </div>

      {/* Transaction Ledger */}
      <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
          <div className="px-10 py-8 border-b border-slate-50 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-slate-50/50 dark:bg-slate-950/50">
             <div className="flex items-center gap-5">
                <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-500/20"><History size={24} /></div>
                <div>
                   <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Injection Ledger</h3>
                   <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1.5">{entries.length} Certified Records</p>
                </div>
             </div>
             
             <div className="flex flex-1 max-w-md relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                <input 
                    type="text" 
                    placeholder="Search Vehicle, Operator or Node ID..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                />
             </div>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
             <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        <th className="px-10 py-5">Temporal Node</th>
                        <th className="px-10 py-5">Asset Designation</th>
                        <th className="px-10 py-5">Injection Volume</th>
                        <th className="px-10 py-5">Economic Cost</th>
                        <th className="px-10 py-5">Odometer Terminal</th>
                        <th className="px-10 py-5">Operator</th>
                        <th className="px-10 py-5 text-right">Ops</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredEntries.map((entry) => (
                        <tr key={entry.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group">
                            <td className="px-10 py-6">
                                <div className="flex flex-col">
                                    <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{entry.date}</span>
                                    <span className="text-[9px] font-mono font-bold text-slate-400 mt-1 uppercase tracking-widest">{entry.time}</span>
                                </div>
                            </td>
                            <td className="px-10 py-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center font-black shadow-inner shrink-0 group-hover:scale-110 transition-transform"><Truck size={18} /></div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-1.5">{entry.vehicleName}</p>
                                        <p className="text-[9px] text-slate-400 font-mono font-bold uppercase">ID: {entry.id}</p>
                                    </div>
                                </div>
                            </td>
                            <td className="px-10 py-6">
                                <div className="flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white tabular-nums">
                                    <Droplets size={14} className="text-blue-500" /> {entry.volume} <span className="text-[10px] opacity-40">LTR</span>
                                </div>
                            </td>
                            <td className="px-10 py-6">
                                <div className="text-sm font-black text-emerald-600 tabular-nums">
                                    ${entry.cost.toFixed(2)}
                                </div>
                            </td>
                            <td className="px-10 py-6">
                                <div className="flex items-center gap-2 text-xs font-mono font-black text-slate-600 dark:text-slate-400 tabular-nums uppercase">
                                    <Gauge size={14} /> {entry.odometer.toLocaleString()}
                                </div>
                            </td>
                            <td className="px-10 py-6">
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-tight">{entry.operator}</span>
                            </td>
                            <td className="px-10 py-6 text-right">
                                <button className="p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={18} /></button>
                            </td>
                        </tr>
                    ))}
                </tbody>
             </table>
          </div>
      </div>

      {/* --- ENTRY TERMINAL MODAL --- */}
      {isLogModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[5000] flex items-center justify-center p-4 animate-in fade-in duration-300">
           <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in duration-200">
                <div className="p-10 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/50">
                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-blue-600 text-white rounded-3xl shadow-2xl shadow-blue-500/20"><Fuel size={32} /></div>
                        <div>
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Injection Terminal</h3>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-[0.3em] mt-1.5 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> Authorized Logging Session
                            </p>
                        </div>
                    </div>
                    <button onClick={() => setIsLogModalOpen(false)} className="p-4 hover:bg-white dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400"><X size={32}/></button>
                </div>
                
                <form onSubmit={handleLogSubmit} className="p-10 space-y-10 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {/* Primary Asset Node */}
                    <div className="space-y-4">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Target Asset Registry</label>
                        <div className="relative group">
                            <select 
                                required
                                value={formData.vehicleId}
                                onChange={e => setFormData({...formData, vehicleId: e.target.value})}
                                className="w-full appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[1.5rem] pl-14 pr-12 py-5 text-base font-black text-slate-900 dark:text-white focus:ring-8 focus:ring-blue-500/5 outline-none transition-all shadow-inner"
                            >
                                <option value="">Select Equipment Node</option>
                                {MOCK_VEHICLES.map(v => <option key={v.id} value={v.id}>{v.name.toUpperCase()} — {v.vin}</option>)}
                            </select>
                            <Truck size={24} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-blue-500 transition-colors" />
                            <ChevronDown size={20} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Telemetry Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Injection Volume (Liters)</label>
                            <div className="relative group">
                                <input 
                                    required 
                                    type="number" 
                                    step="0.01"
                                    placeholder="0.00"
                                    value={formData.volume}
                                    onChange={e => setFormData({...formData, volume: e.target.value})}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[1.5rem] pl-14 pr-6 py-5 text-lg font-black tabular-nums text-slate-900 dark:text-white focus:ring-8 focus:ring-blue-500/5 outline-none transition-all shadow-inner" 
                                />
                                <Droplets size={24} className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-500" />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Transaction Cost (USD)</label>
                            <div className="relative group">
                                <input 
                                    required 
                                    type="number" 
                                    step="0.01"
                                    placeholder="0.00"
                                    value={formData.cost}
                                    onChange={e => setFormData({...formData, cost: e.target.value})}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[1.5rem] pl-14 pr-6 py-5 text-lg font-black tabular-nums text-emerald-600 outline-none focus:ring-8 focus:ring-blue-500/5 transition-all shadow-inner" 
                                />
                                <DollarSign size={24} className="absolute left-5 top-1/2 -translate-y-1/2 text-emerald-500" />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Odometer Terminal</label>
                            <div className="relative group">
                                <input 
                                    required 
                                    type="number" 
                                    placeholder="Current Reading"
                                    value={formData.odometer}
                                    onChange={e => setFormData({...formData, odometer: e.target.value})}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[1.5rem] pl-14 pr-6 py-5 text-lg font-mono font-black text-slate-900 dark:text-white focus:ring-8 focus:ring-blue-500/5 outline-none transition-all shadow-inner" 
                                />
                                <Gauge size={24} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Energy Variant</label>
                            <div className="relative group">
                                <select 
                                    value={formData.fuelType}
                                    onChange={e => setFormData({...formData, fuelType: e.target.value as FuelType})}
                                    className="w-full appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[1.5rem] pl-14 pr-12 py-5 text-base font-black text-slate-900 dark:text-white focus:ring-8 focus:ring-blue-500/5 outline-none transition-all shadow-inner"
                                >
                                    {Object.values(FuelType).map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                                <Zap size={24} className="absolute left-5 top-1/2 -translate-y-1/2 text-orange-500" />
                                <ChevronDown size={20} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {/* Temporal Node */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Calendar Node</label>
                            <input 
                                required 
                                type="date" 
                                value={formData.date}
                                onChange={e => setFormData({...formData, date: e.target.value})}
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[1.5rem] px-8 py-5 text-sm font-black text-slate-900 dark:text-white outline-none focus:ring-8 focus:ring-blue-500/5 transition-all shadow-inner" 
                            />
                        </div>
                        <div className="space-y-4">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Temporal Sequence</label>
                            <input 
                                required 
                                type="time" 
                                value={formData.time}
                                onChange={e => setFormData({...formData, time: e.target.value})}
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[1.5rem] px-8 py-5 text-sm font-black text-slate-900 dark:text-white outline-none focus:ring-8 focus:ring-blue-500/5 transition-all shadow-inner" 
                            />
                        </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/10 border-2 border-dashed border-blue-100 dark:border-blue-900/30 p-8 rounded-[2rem] flex items-start gap-5 shadow-inner">
                        <Info className="text-blue-600 mt-1 shrink-0" size={24} />
                        <p className="text-xs text-blue-800 dark:text-blue-300 font-bold leading-relaxed uppercase tracking-tight">
                            Protocol Check: All energy transactions are audited against organizational telemetry. Discrepancies between odometer readings and GPS mission paths will trigger safety investigations.
                        </p>
                    </div>

                    <div className="flex gap-4 pt-4 sticky bottom-0 bg-white dark:bg-slate-900 py-4 border-t border-slate-50 dark:border-slate-800">
                        <button type="button" onClick={() => setIsLogModalOpen(false)} className="flex-1 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] hover:text-slate-600 transition-colors">Abort Terminal</button>
                        <button 
                            type="submit" 
                            disabled={isSaving}
                            className="flex-[2] py-6 bg-slate-900 dark:bg-blue-600 text-white rounded-[1.5rem] font-black text-[12px] uppercase tracking-[0.5em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
                        >
                            {isSaving ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
                            FINALIZE RECORD
                        </button>
                    </div>
                </form>
           </div>
        </div>
      )}
    </div>
  );
};
