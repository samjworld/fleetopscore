
import React, { useState, useMemo } from 'react';
import { 
  BarChart3, PieChart, Calendar, Filter, Truck, Clock, 
  TrendingUp, Activity, Gauge, Download, ChevronDown,
  Timer, Info, Zap, AlertTriangle, CheckCircle2, MoreHorizontal,
  Loader2, ChevronRight, FileText
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart as RePieChart, Pie, Cell, 
  Legend, ComposedChart, Line, Area, ReferenceLine
} from 'recharts';
import { MOCK_VEHICLES } from '../constants.ts';
import toast from 'react-hot-toast';

// --- MOCK UTILIZATION DATA ---
const DAILY_DATA = [
  { day: 'Mon', active: 6.5, idle: 1.5, fuel: 85, score: 81 },
  { day: 'Tue', active: 7.2, idle: 0.8, fuel: 92, score: 90 },
  { day: 'Wed', active: 5.8, idle: 2.2, fuel: 78, score: 72 },
  { day: 'Thu', active: 8.0, idle: 0.0, fuel: 98, score: 100 },
  { day: 'Fri', active: 7.5, idle: 0.5, fuel: 94, score: 93 },
  { day: 'Sat', active: 3.2, idle: 4.8, fuel: 45, score: 40 },
  { day: 'Sun', active: 1.5, idle: 6.5, fuel: 20, score: 18 },
];

const MACHINE_BREAKDOWN = [
  { name: 'Excavator X1', hours: 42, idle: 4, utilization: 91 },
  { name: 'Dozer D5', hours: 38, idle: 8, utilization: 82 },
  { name: 'Crane C2', hours: 15, idle: 2, utilization: 88 },
  { name: 'Loader L4', hours: 52, idle: 12, utilization: 81 },
  { name: 'Backhoe B1', hours: 33, idle: 5, utilization: 86 },
];

const PIE_DATA = [
  { name: 'Productive Work', value: 78, color: '#3b82f6' },
  { name: 'Idle State', value: 14, color: '#f59e0b' },
  { name: 'Transit / Prep', value: 8, color: '#10b981' },
];

export const UtilizationReport = () => {
  const [selectedMachine, setSelectedMachine] = useState<string>('all');
  const [dateRange, setDateRange] = useState('7d');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    await new Promise(r => setTimeout(r, 1500));
    setIsExporting(false);
    toast.success('Utilization Audit Packet Compiled');
  };

  const totals = useMemo(() => {
    const totalActive = DAILY_DATA.reduce((acc, d) => acc + d.active, 0);
    const totalIdle = DAILY_DATA.reduce((acc, d) => acc + d.idle, 0);
    const avgUtil = (totalActive / (totalActive + totalIdle)) * 100;
    return {
        active: totalActive.toFixed(1),
        idle: totalIdle.toFixed(1),
        score: avgUtil.toFixed(1)
    };
  }, []);

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-700">
      {/* Header & Global Filters */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
           <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none flex items-center gap-4">
              <div className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-500/20">
                <BarChart3 size={24} />
              </div>
              Utilization Intel
           </h2>
           <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-2 italic uppercase tracking-wider">Fleet efficiency profile & operational burn rates.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
           <div className="flex bg-white dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
             <div className="relative">
                <select 
                    value={selectedMachine} 
                    onChange={e => setSelectedMachine(e.target.value)}
                    className="appearance-none bg-transparent pl-4 pr-10 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
                >
                    <option value="all">Global Fleet</option>
                    {MOCK_VEHICLES.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
             </div>
             <div className="w-px h-6 bg-slate-100 dark:bg-slate-700 self-center mx-2"></div>
             <div className="relative">
                <select 
                    value={dateRange} 
                    onChange={e => setDateRange(e.target.value)}
                    className="appearance-none bg-transparent pl-4 pr-10 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
                >
                    <option value="24h">Last 24h</option>
                    <option value="7d">Last 7 Days</option>
                    <option value="30d">Last 30 Days</option>
                    <option value="custom">Custom Node</option>
                </select>
                <Calendar size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
             </div>
           </div>

           <button 
             onClick={handleExport}
             disabled={isExporting}
             className="px-6 py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
           >
              {/* Fix: Added Loader2 to imports from lucide-react */}
              {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              Export Audit
           </button>
        </div>
      </div>

      {/* KPI Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-in slide-in-from-bottom-4 duration-500">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Utilization Score</p>
            <div className="flex items-baseline gap-2">
                <h3 className="text-4xl font-black text-blue-600 dark:text-blue-400 tracking-tighter tabular-nums">{totals.score}%</h3>
                <span className="text-emerald-500 font-bold text-[10px] flex items-center gap-1 uppercase tracking-tighter"><TrendingUp size={12}/> +4.2%</span>
            </div>
            <p className="text-[9px] text-slate-400 font-bold uppercase mt-4">Mean operational consistency</p>
            <Activity className="absolute -right-4 -bottom-4 text-blue-500 opacity-5 group-hover:scale-110 transition-transform" size={100} />
        </div>

        <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Work Accumulation</p>
            <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter tabular-nums">{totals.active} <span className="text-sm opacity-40 uppercase">Hrs</span></h3>
            <p className="text-[9px] text-slate-400 font-bold uppercase mt-4">Total productive field time</p>
            <Truck className="absolute -right-4 -bottom-4 text-emerald-500 opacity-5 group-hover:scale-110 transition-transform" size={100} />
        </div>

        <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Non-Productive Delay</p>
            <h3 className="text-4xl font-black text-amber-500 tracking-tighter tabular-nums">{totals.idle} <span className="text-sm opacity-40 uppercase">Hrs</span></h3>
            <p className="text-[9px] text-slate-400 font-bold uppercase mt-4">Engine active / Speed null state</p>
            <Clock className="absolute -right-4 -bottom-4 text-amber-500 opacity-5 group-hover:scale-110 transition-transform" size={100} />
        </div>

        <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Efficiency Grade</p>
            <h3 className="text-4xl font-black text-emerald-600 tracking-tighter leading-none">A+</h3>
            <div className="mt-4 flex gap-1">
               {[1,2,3,4,5].map(i => <div key={i} className="h-1.5 flex-1 bg-emerald-500 rounded-full"></div>)}
            </div>
            <p className="text-[9px] text-slate-400 font-bold uppercase mt-3">Exceeding sector benchmarks</p>
            <Zap className="absolute -right-4 -bottom-4 text-purple-500 opacity-5 group-hover:scale-110 transition-transform" size={100} />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
         {/* Daily Utilization Correlation */}
         <div className="xl:col-span-2 bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-12">
               <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3 leading-none">
                    <TrendingUp size={20} className="text-blue-600" /> Duty Cycle Distribution
                  </h3>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2">Correlating active runtime with idle delays (7D)</p>
               </div>
               <div className="flex items-center gap-6 bg-slate-50 dark:bg-slate-950 px-5 py-3 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-inner">
                  <div className="flex items-center gap-2">
                     <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div>
                     <span className="text-[9px] font-black text-slate-600 dark:text-slate-300 uppercase">Productive</span>
                  </div>
                  <div className="flex items-center gap-2">
                     <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                     <span className="text-[9px] font-black text-slate-600 dark:text-slate-300 uppercase">Idle Delay</span>
                  </div>
               </div>
            </div>

            <div className="h-[400px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={DAILY_DATA}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.05} />
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
                      label={{ value: 'Runtime (Hours)', angle: -90, position: 'insideLeft', offset: 0, fontSize: 10, fontWeight: 900, fill: '#94a3b8', textTransform: 'uppercase' }}
                    />
                    <Tooltip 
                      cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
                      contentStyle={{ borderRadius: '24px', border: 'none', background: '#0f172a', color: '#fff', fontSize: '10px', padding: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}
                      itemStyle={{ fontWeight: 800, textTransform: 'uppercase' }}
                    />
                    <Bar dataKey="active" name="Productive" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                    <Bar dataKey="idle" name="Idle Delay" stackId="a" fill="#f59e0b" radius={[12, 12, 0, 0]} barSize={40} />
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* Distribution Summary */}
         <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center">
            <h3 className="w-full text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-12">Fleet State Mix</h3>
            <div className="h-[280px] w-full relative group">
                <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                        <Pie
                            data={PIE_DATA}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={100}
                            paddingAngle={8}
                            dataKey="value"
                            stroke="none"
                        >
                            {PIE_DATA.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', background: '#0f172a', color: '#fff', fontSize: '10px' }} />
                    </RePieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none group-hover:scale-110 transition-transform duration-500">
                    <span className="text-3xl font-black text-slate-900 dark:text-white leading-none">{totals.score}%</span>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-2">Active Mix</span>
                </div>
            </div>

            <div className="w-full space-y-3 mt-10">
                {PIE_DATA.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 shadow-inner group hover:border-blue-500 transition-all">
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                            <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-tight">{item.name}</span>
                        </div>
                        <span className="text-sm font-black text-slate-900 dark:text-white tabular-nums">{item.value}%</span>
                    </div>
                ))}
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* Asset Performance Ranking */}
         <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
               <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Machine Utilization Depth</h3>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Ranking assets by active duty ratios</p>
               </div>
               <button className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 hover:text-blue-600 transition-all shadow-sm"><MoreHorizontal size={20}/></button>
            </div>
            
            <div className="p-8 space-y-8">
                {MACHINE_BREAKDOWN.map((m, i) => (
                    <div key={i} className="space-y-3 group">
                        <div className="flex justify-between items-end">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center font-black text-xs shadow-inner">#{i+1}</div>
                                <div>
                                    <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight group-hover:text-blue-600 transition-colors">{m.name}</h4>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Active: {m.hours}h | Idle: {m.idle}h</p>
                                </div>
                            </div>
                            <span className="text-sm font-black text-slate-900 dark:text-white tabular-nums">{m.utilization}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                            <div 
                                className={`h-full rounded-full transition-all duration-1000 ease-out ${m.utilization > 85 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                style={{ width: `${m.utilization}%` }}
                            ></div>
                        </div>
                    </div>
                ))}
            </div>
         </section>

         {/* Heuristic Insights */}
         <section className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden flex flex-col group">
            <div className="relative z-10 flex-1">
               <div className="flex items-center gap-4 mb-10">
                  <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10 text-blue-400">
                    <Zap size={24} />
                  </div>
                  <h3 className="text-xl font-black uppercase tracking-tight">Machine Intelligence Insights</h3>
               </div>
               
               <div className="space-y-6">
                  <div className="p-6 bg-white/5 rounded-3xl border border-white/5 hover:bg-white/10 transition-all cursor-pointer">
                     <div className="flex items-start gap-4">
                        <AlertTriangle className="text-amber-400 shrink-0" size={20} />
                        <div>
                           <h5 className="font-black text-xs uppercase tracking-widest text-amber-400 mb-1">Inefficiency Detected</h5>
                           <p className="text-sm font-medium text-slate-300 leading-relaxed italic">"Dozer D5 has spent 21% of shift in idle state at Sector B. Estimated fuel waste: 42.5 Liters."</p>
                        </div>
                     </div>
                  </div>

                  <div className="p-6 bg-white/5 rounded-3xl border border-white/5 hover:bg-white/10 transition-all cursor-pointer">
                     <div className="flex items-start gap-4">
                        <CheckCircle2 className="text-emerald-400 shrink-0" size={20} />
                        <div>
                           <h5 className="font-black text-xs uppercase tracking-widest text-emerald-400 mb-1">Optimal Performance</h5>
                           <p className="text-sm font-medium text-slate-300 leading-relaxed italic">"Excavator X1 utilization is 12% above fleet average. Current operator shows high mission coordination."</p>
                        </div>
                     </div>
                  </div>

                  <div className="p-6 bg-white/5 rounded-3xl border border-white/5 hover:bg-white/10 transition-all cursor-pointer">
                     <div className="flex items-start gap-4">
                        <Timer className="text-blue-400 shrink-0" size={20} />
                        <div>
                           <h5 className="font-black text-xs uppercase tracking-widest text-blue-400 mb-1">Predictive Bottleneck</h5>
                           <p className="text-sm font-medium text-slate-300 leading-relaxed italic">"High transit times detected in Sector A. Logistics corridor optimization recommended to increase active uptime."</p>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
            
            <button className="relative z-10 w-full mt-10 py-5 bg-white text-slate-900 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] hover:bg-blue-50 active:scale-95 transition-all shadow-2xl flex items-center justify-center gap-3">
               {/* Fix: Added ChevronRight to imports from lucide-react */}
               Open Analytics Suite <ChevronRight size={18} />
            </button>

            <BarChart3 size={200} className="absolute -right-20 -bottom-20 text-white opacity-5 group-hover:scale-110 transition-transform duration-700" />
         </section>
      </div>

      {/* Detail Grid Footer */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                {/* Fix: Added FileText to imports from lucide-react */}
                <FileText size={18} className="text-slate-400" /> Telemetry Packet Ledger
            </h3>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse font-sans">
                <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        <th className="px-8 py-5">Date Node</th>
                        <th className="px-8 py-5">Productive (H)</th>
                        <th className="px-8 py-5">Idle Delay (H)</th>
                        <th className="px-8 py-5">Energy Mix (%)</th>
                        <th className="px-8 py-5">Daily Heuristic</th>
                        <th className="px-8 py-5 text-right">Integrity</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {DAILY_DATA.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                            <td className="px-8 py-5 text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{row.day} 24-MAY</td>
                            <td className="px-8 py-5 font-mono text-sm font-black text-blue-600">{row.active}</td>
                            <td className="px-8 py-5 font-mono text-sm font-black text-amber-500">{row.idle}</td>
                            <td className="px-8 py-5">
                                <div className="flex items-center gap-2">
                                    <div className="h-2 flex-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${row.fuel}%` }}></div>
                                    </div>
                                    <span className="text-[10px] font-black text-slate-500 tabular-nums">{row.fuel}%</span>
                                </div>
                            </td>
                            <td className="px-8 py-5">
                                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${
                                    row.score > 80 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                    row.score > 50 ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                    'bg-red-50 text-red-600 border-red-100'
                                }`}>
                                    {row.score > 80 ? 'Optimal' : row.score > 50 ? 'Nominal' : 'Low Duty'}
                                </span>
                            </td>
                            <td className="px-8 py-5 text-right">
                                <CheckCircle2 size={16} className="text-emerald-500 ml-auto" />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};
